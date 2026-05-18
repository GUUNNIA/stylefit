// /services — 서비스 목록 페이지 (Day 9)
//
// 세 섹션 구조: 핫 / 추천 / 전체
// - 지금은 임시로 *정렬만 다르게* 해서 차별화 (큐레이션 테이블은 Day 10~)
// - 세 쿼리를 Promise.all로 *병렬* 실행 → 순차보다 빠름

import { prisma } from "@/app/lib/prisma"
import ServiceCard, { type ServiceCardData } from "@/app/components/ServiceCard"
import SuccessBanner from "@/app/components/SuccessBanner"

// 세 쿼리가 같은 relation을 include함 → 한 곳에서 정의하고 재사용 (DRY)
const SECTION_INCLUDE = {
  sellerProfile: {
    include: { user: { select: { name: true } } },
  },
} as const

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>
}) {
  // 회원가입 직후 환영 배너 표시용 — from 없이 가입했을 때만 set 됨
  const { welcome } = await searchParams

  // 세 섹션 데이터를 *병렬*로 페치.
  // 순차 await 3번이면 (t1 + t2 + t3) 시간 — 각 쿼리가 끝나야 다음 시작.
  // Promise.all이면 max(t1, t2, t3) 시간 — 동시에 보냄, 다 끝나면 결과 묶음.
  // 세 쿼리가 *서로 독립*이라 병렬화 가능.
  const [hot, featured, all] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      include: SECTION_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      include: SECTION_INCLUDE,
      orderBy: { id: "asc" },
      take: 3,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      include: SECTION_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      {/* 회원가입 직후 환영 배너 — from 없이 가입했을 때만 */}
      {welcome && (
        <SuccessBanner message="가입이 완료되었습니다. Stylefit에 오신 것을 환영합니다." />
      )}

      <h1 className="mb-10 text-3xl font-bold tracking-tight">
        서비스 둘러보기
      </h1>

      <Section title="지금 핫한 서비스" services={hot} />
      <Section title="에디터 추천" services={featured} />
      <Section title="전체 서비스" services={all} />
    </main>
  )
}

// 같은 파일 안에 inline 정의 — services 페이지 안에서만 쓰니까 외부 분리 X.
// 분리 기준: *다른 페이지에서도 쓰게 되면* 그때 ServiceCard처럼 components/로.
function Section({
  title,
  services,
}: {
  title: string
  services: ServiceCardData[]
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-5 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} />
        ))}
      </div>
    </section>
  )
}
