// /services — 서비스 목록 페이지 (Day 9 → Day 12 큐레이션 테이블 도입)
//
// 세 섹션:
// - 핫·추천: Collection 테이블의 slug로 필터 (Day 12 — 다대다 관계 활용)
// - 전체: 모든 활성 서비스
// 세 쿼리를 Promise.all로 *병렬* 실행
//
// TODO(나중): orderBy 를 ServiceCollection.displayOrder 기준으로 교체.
// 지금은 Service.id 순이라 매핑의 displayOrder 가 *반영 안 됨*.

import Link from "next/link"
import { prisma } from "@/app/lib/prisma"
import ServiceCard, { type ServiceCardData } from "@/app/components/ServiceCard"
import SuccessBanner from "@/app/components/SuccessBanner"
import {
  SERVICE_CATEGORIES,
} from "@/app/lib/service-categories"
import { buildUrl, chipClass, validateEnumParam } from "@/app/lib/url-filter"

// 세 쿼리가 같은 relation을 include함 → 한 곳에서 정의하고 재사용 (DRY)
const SECTION_INCLUDE = {
  sellerProfile: {
    include: { user: { select: { name: true } } },
  },
} as const

// 구매자 측 가시성 필터 (Day 13) — 셀러가 비활성화한 것, 운영자 미검증은 제외.
// 세 쿼리에서 spread로 재사용 — 향후 노출 조건 추가·변경 시 한 곳만 수정.
const VISIBLE_SERVICE_FILTER = {
  isActive: true,
  verificationStatus: "approved",
} as const

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; category?: string; q?: string }>
}) {
  const { welcome, category: rawCategory, q: rawQ } = await searchParams

  // 카테고리 화이트리스트 검증 (Day 16 → Day 19 추출) — Day 14·18 과 같은 패턴.
  // *외부 입력* 을 그대로 Prisma where 에 넣으면 *임의 값* 가능 → 명시 목록과 매칭만 통과.
  // 빈 문자열·undefined·임의 값 모두 undefined → 필터 *적용 안 함* (전체 노출).
  const category = validateEnumParam(rawCategory, SERVICE_CATEGORIES)

  // 검색어 sanitize (Day 16) — *이중 방어*:
  //   1) UI maxLength=100 (1차)
  //   2) 백엔드 trim + slice(0,100) (UI 우회 시 2차)
  //   공백만 입력 = 빈 검색으로 처리 (trim 후 빈 문자열).
  //   SQLite Prisma contains 는 *대소문자 구분* — 학습 포인트, 그대로 둠.
  const q = (rawQ ?? "").trim().slice(0, 100)

  // where 동적 조립 — *값 있을 때만* spread, 없으면 빈 객체.
  // Prisma 의 where 객체는 *키가 있으면* 조건 추가, *없으면* 무시 → 깔끔한 분기.
  // q 는 *title 또는 description* 둘 중 하나만 일치해도 OK → Prisma OR.
  const baseWhere = {
    ...VISIBLE_SERVICE_FILTER,
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  }

  // 모드 분리 (Day 16 — 5단계)
  //   - *탐색 모드* (필터 없음): 핫 / 추천 / 전체 세 섹션 — 운영자 큐레이션 의도 보존
  //   - *검색 모드* (category 또는 q 있음): 큐레이션 섹션 숨기고 *단일 결과 섹션*
  //
  // 탐색 → 검색은 *사용자 의도 전환* — 검색 모드에선 큐레이션이 *오히려 노이즈*.
  // 또한 검색 모드는 *큐레이션 쿼리 두 개 생략* → 성능 ↑.
  const isSearchMode = !!(category || q)

  // 검색 모드: 단일 쿼리 (전체 결과). take 제한 X — 검색 의도라 전체 표시.
  // 탐색 모드: 세 쿼리 병렬. 큐레이션 두 개 + 둘러보기용 12개 제한된 전체.
  //
  // 다대다 필터: collections.some.collection.slug = "..." 의미는
  // "이 서비스의 매핑(ServiceCollection) 중 *하나라도* slug 조건을 만족하면" — 다대다 표준 표현.
  let hot: ServiceCardData[] = []
  let featured: ServiceCardData[] = []
  let results: ServiceCardData[]

  if (isSearchMode) {
    results = await prisma.service.findMany({
      where: baseWhere,
      include: SECTION_INCLUDE,
      orderBy: { createdAt: "desc" },
    })
  } else {
    ;[hot, featured, results] = await Promise.all([
      prisma.service.findMany({
        where: {
          ...baseWhere,
          collections: { some: { collection: { slug: "hot" } } },
        },
        include: SECTION_INCLUDE,
        orderBy: { id: "asc" },
      }),
      prisma.service.findMany({
        where: {
          ...baseWhere,
          collections: { some: { collection: { slug: "featured" } } },
        },
        include: SECTION_INCLUDE,
        orderBy: { id: "asc" },
      }),
      prisma.service.findMany({
        where: baseWhere,
        include: SECTION_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
    ])
  }

  // 검색 모드에서만 *빈 결과 메시지* 노출 (탐색 모드의 큐레이션 0건은 섹션 자체 미렌더).
  const emptyMsg = isSearchMode ? "조건에 맞는 서비스가 없습니다" : undefined

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* 회원가입 직후 환영 배너 — from 없이 가입했을 때만 */}
      {welcome && (
        <SuccessBanner message="가입이 완료되었습니다. Stylefit에 오신 것을 환영합니다." />
      )}

      <h1 className="mb-6 text-3xl font-bold tracking-tight">
        서비스 둘러보기
      </h1>

      {/* 검색 폼 (Day 16) — form GET → 현재 URL 에 ?q=... 추가.
          Server Action 없이 *URL 변경* 만으로 Server Component 재실행 → 결과 갱신.
          hidden category — 검색 시 *카테고리 유지* (16-4 결합 미리).
          maxLength=100 + 백엔드 slice 이중 방어. */}
      <form className="mb-4">
        {category && (
          <input type="hidden" name="category" value={category} />
        )}
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            maxLength={100}
            placeholder="제목·설명에서 검색"
            className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent-bg px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
          >
            검색
          </button>
        </div>
      </form>

      {/* 카테고리 칩 (Day 16 → Day 19 추출) — Link 기반, URL 의 category 쿼리가 source of truth.
          buildUrl 로 *기존 q 유지* — 칩 클릭해도 검색어 안 날아감. *전체* 칩 = category 만 제거, q 는 유지. */}
      <div className="mb-10 flex flex-wrap gap-2">
        <Link href={buildUrl("/services", { q })} className={chipClass(!category)}>
          전체
        </Link>
        {SERVICE_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={buildUrl("/services", { category: c, q })}
            className={chipClass(category === c)}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* 탐색 모드에서만 큐레이션 두 섹션 노출. 검색 모드에선 *큐레이션 의도 보존*을 위해 숨김.
          emptyMessage 전달 안 함 — 탐색 모드의 큐레이션 0건은 *섹션 자체 미렌더* (기존 동작). */}
      {!isSearchMode && (
        <>
          <Section title="지금 핫한 서비스" services={hot} />
          <Section title="에디터 추천" services={featured} />
        </>
      )}

      {/* 마지막 섹션 — 탐색 모드는 *전체 서비스*, 검색 모드는 *검색 결과 (N건)*.
          한 변수(results)가 두 의미를 겸함 — JSX 안에선 *타이틀*로 의도 표현. */}
      <Section
        title={isSearchMode ? `검색 결과 (${results.length}건)` : "전체 서비스"}
        services={results}
        emptyMessage={emptyMsg}
      />
    </main>
  )
}

// 같은 파일 안에 inline 정의 — services 페이지 안에서만 쓰니까 외부 분리 X.
// 분리 기준: *다른 페이지에서도 쓰게 되면* 그때 ServiceCard처럼 components/로.
function Section({
  title,
  services,
  emptyMessage,
}: {
  title: string
  services: ServiceCardData[]
  // 0건일 때 표시할 메시지. undefined 면 *섹션 본문 자체를 안 그림* — 기존 동작.
  // 호출 측에서 *필터 적용 시에만* 전달해 검색 0건과 큐레이션 미설정 구분.
  emptyMessage?: string
}) {
  if (services.length === 0 && !emptyMessage) return null

  return (
    <section className="mb-12">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      {services.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-ink-subtle">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </section>
  )
}
