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

  // 서비스 + 셀러 정보를 *병렬*로 — 사용자 정보와 동시에 가져옴
  const [service, user] = await Promise.all([
    prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        sellerProfile: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    getCurrentUser(),
  ])

  if (!service || !service.isActive) notFound()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* ⑥ 명시적 뒤로가기 — from에 따라 라벨·href 동적. 어디로 갈지 명시 */}
      <Link
        href={backLink.href}
        className="mb-4 inline-block text-sm text-zinc-600 transition-colors hover:text-zinc-900"
      >
        {backLink.label}
      </Link>

      {/* 서비스 정보 영역 */}
      <article className="rounded-xl border border-zinc-200 bg-white p-8 text-zinc-900">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {service.category} ·{" "}
          {service.serviceType === "online" ? "온라인" : "오프라인"}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {service.title}
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          by {service.sellerProfile.user.name}
        </p>

        <div className="mt-6 flex items-baseline gap-4 border-t border-zinc-100 pt-6">
          <span className="text-2xl font-bold">
            ₩{service.price.toLocaleString()}
          </span>
          <span className="text-sm text-zinc-500">
            {formatDuration(service.durationMinutes)}
          </span>
        </div>

        <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-zinc-700">
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
          <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
            <p className="mb-4 text-zinc-700">
              예약하려면 먼저 로그인이 필요합니다.
            </p>
            {/* from으로 현재 URL 전달 → 로그인 성공 후 이 페이지로 복귀 */}
            <Link
              href={`/login?from=${encodeURIComponent(`/services/${service.id}`)}`}
              className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-white transition-colors hover:bg-zinc-800"
            >
              로그인하고 예약하기
            </Link>
          </div>
        )}
      </section>
    </main>
  )
}
