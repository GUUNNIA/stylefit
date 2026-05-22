// /services/[id] — 서비스 상세 페이지 (Day 11)
//
// Server Component 패턴 (Day 9 /services와 동일):
// - async page, prisma 직접 호출
// - 동적 라우트 params는 *Promise* — Next.js 15+ 패턴 (Day 6 route.ts와 동일)
// - notFound()로 404 응답
//
// 새 패턴: *로그인 여부에 따른 조건부 렌더*
// - 로그인 → BookingForm (Client Component) 노출
// - 비로그인 → "로그인하고 예약하기" CTA, 폼은 숨김

import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { getCurrentUser } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"
import BookingForm from "./BookingForm"

// 알려진 진입점 → 뒤로가기 라벨·경로 매핑.
// from이 매핑 밖이면 fallback "/services"로 (외부 URL/이상한 값 차단 효과도 있음).
const BACK_LINKS: Record<string, { href: string; label: string }> = {
  "/bookings": { href: "/bookings", label: "← 내 예약으로" },
  "/services": { href: "/services", label: "← 서비스 목록" },
}

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams
  const serviceId = parseInt(id, 10)
  if (isNaN(serviceId)) notFound()

  // from이 알려진 값일 때만 그쪽으로, 아니면 기본 "/services".
  // ||(falsy fallback): from이 빈 문자열/undefined 또는 BACK_LINKS에 없는 값이면 모두 fallback.
  // (??는 빈 문자열을 통과시켜 타입이 깨짐 — "" | {...} 형태가 됨)
  const backLink = (from && BACK_LINKS[from]) || BACK_LINKS["/services"]

  // 서비스 + 셀러 정보 + 후기 통계 + 최신 후기 5 + 사용자 — *4 쿼리 병렬* (Day 25)
  //   - reviewStats: *Prisma aggregate 첫 도입* — _avg + _count 한 쿼리에서 집계
  //   - recentReviews: 최신 5개 만 (페이지네이션은 미래 Day)
  //   - 두 쿼리 모두 *nested filter* (where: { booking: { serviceId } }) — Review 가 *booking 거쳐서 service 와 연결*
  //     Review.serviceId 비정규화 컬럼 없음 → Prisma 의 nested where 활용
  const [service, reviewStats, recentReviews, user] = await Promise.all([
    prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        sellerProfile: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.review.aggregate({
      where: { booking: { serviceId } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { booking: { serviceId } },
      include: { buyer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getCurrentUser(),
  ])

  if (!service || !service.isActive) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* ⑥ 명시적 뒤로가기 — from에 따라 라벨·href 동적. 어디로 갈지 명시 */}
      <Link
        href={backLink.href}
        className="mb-4 inline-block text-sm text-ink-muted transition-colors hover:text-foreground"
      >
        {backLink.label}
      </Link>

      {/* 서비스 정보 영역 */}
      <article className="rounded-xl border border-line bg-surface p-8 text-foreground">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {service.category} ·{" "}
          {service.serviceType === "online" ? "온라인" : "오프라인"}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {service.title}
        </h1>

        <p className="mt-2 text-sm text-ink-muted">
          by {service.sellerProfile.user.name}
        </p>

        <div className="mt-6 flex items-baseline gap-4 border-t border-line pt-6">
          <span className="text-2xl font-bold">
            ₩{service.price.toLocaleString()}
          </span>
          <span className="text-sm text-ink-subtle">
            {formatDuration(service.durationMinutes)}
          </span>
        </div>

        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-ink-muted">
          {service.description}
        </div>
      </article>

      {/* 예약 영역 — 로그인 여부에 따라 분기 */}
      <section className="mt-6">
        {user ? (
          <BookingForm
            serviceId={service.id}
            serviceTitle={service.title}
            price={service.price}
            durationMinutes={service.durationMinutes}
          />
        ) : (
          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <p className="mb-4 text-ink-muted">
              예약하려면 먼저 로그인이 필요합니다.
            </p>
            {/* from으로 현재 URL 전달 → 로그인 성공 후 이 페이지로 복귀 */}
            <Link
              href={`/login?from=${encodeURIComponent(`/services/${service.id}`)}`}
              className="inline-block rounded-lg bg-accent-bg px-5 py-2.5 font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
            >
              로그인하고 예약하기
            </Link>
          </div>
        )}
      </section>

      {/* 후기 섹션 (Day 25) — 공개 후기. 결정 보조 정보라 예약 영역 *아래* 배치.
          후기 0개 → "아직 후기가 없습니다" fallback.
          평균 별점은 _avg.rating?.toFixed(1) — _avg 가 *후기 0개 시 null* 가능성. */}
      <section className="mt-6 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-xl font-bold tracking-tight">후기</h2>

        {reviewStats._count > 0 ? (
          <>
            <div className="mt-2 flex items-baseline gap-2">
              {/* amber 는 *별점 의미색* 으로 라이트/다크 공통 유지 (액센트 인디고와 별개의 의미층) */}
              <span className="text-lg font-semibold text-amber-600">
                ★ {reviewStats._avg.rating?.toFixed(1)}
              </span>
              <span className="text-sm text-ink-subtle">
                후기 {reviewStats._count}개
              </span>
            </div>

            <ul className="mt-6 space-y-4">
              {recentReviews.map((r) => (
                <li
                  key={r.id}
                  className="border-t border-line pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-foreground">
                      {r.buyer.name}
                    </span>
                    <span className="text-xs text-ink-subtle">
                      {r.createdAt.toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-amber-600">★ {r.rating}</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                    {r.content}
                  </p>
                </li>
              ))}
            </ul>

            {reviewStats._count > 5 && (
              <p className="mt-6 text-center text-xs text-ink-subtle">
                최신 5개만 표시 (전체 {reviewStats._count}개)
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-ink-subtle">아직 후기가 없습니다.</p>
        )}
      </section>
    </main>
  )
}
