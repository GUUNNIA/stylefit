// /bookings — 내 예약 목록 (Day 11, Day 21 거절 사유 표시)
//
// 첫 *보호 페이지* — DAL의 verifySession()으로 세션 확인,
// 없으면 redirect("/login")으로 페이지 자체에 접근 차단.
//
// Day 21: 셀러 거절 사유 표시 + STATUS_LABEL 을 BookingStatus enum 타입으로 정리 (Day 19 패턴).
// cancelled + rejectionReason 있음 = 셀러가 거절 → "거절됨" 라벨 + 사유 표시.
// cancelled + rejectionReason 없음 = buyer 본인이 취소 → "취소됨" 라벨 (취소 액션은 미래 Day).

import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"
import SuccessBanner from "@/app/components/SuccessBanner"
import { BookingStatus } from "@prisma/client"
import CancelForm from "./CancelForm"

// status → 한국어 라벨 + 색. Day 19 패턴 — enum 키화로 *모든 값 정의 보장*.
const STATUS_LABEL: Record<BookingStatus, { text: string; className: string }> = {
  pending: { text: "확인 대기", className: "bg-zinc-100 text-zinc-700" },
  confirmed: { text: "확정됨", className: "bg-emerald-100 text-emerald-700" },
  completed: { text: "완료", className: "bg-zinc-100 text-zinc-500" },
  cancelled: { text: "취소됨", className: "bg-red-100 text-red-700" },
}

function formatBookingDatetime(d: Date): string {
  // 예: "2026-05-20 14:30"
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  // searchParams는 Next.js 15+에서 Promise — await 필요
  const { success } = await searchParams

  const session = await verifySession()
  if (!session) redirect("/login")

  const bookings = await prisma.booking.findMany({
    where: { buyerId: session.userId },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          category: true,
          durationMinutes: true,
          price: true,
        },
      },
      sellerProfile: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* 예약 성공 후 redirect 시 ?success=1 → 한 번 표시. URL이 바뀌면 자연스럽게 사라짐 */}
      {success && (
        <SuccessBanner message="예약이 접수되었습니다. 셀러 확인 후 확정됩니다." />
      )}

      <h1 className="mb-8 text-3xl font-bold tracking-tight">내 예약</h1>

      {bookings.length === 0 ? (
        // 빈 상태
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <p className="mb-4 text-zinc-600">아직 예약한 서비스가 없습니다.</p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm text-white transition-colors hover:bg-zinc-800"
          >
            서비스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            // cancelled 의 *3 분기* 라벨 (Day 22):
            //   rejectionReason 있음   → 셀러 거절 (rose, 강한 부정)
            //   cancellationReason 있음 → 내가 취소 (amber, 주의 신호)
            //   둘 다 없음               → 기본 cancelled (red, fallback)
            // *얇은 함수 추출 안 함* — Day 19 원칙 (inline ternary 가 함수 호출보다 직설).
            // 다음 정리 Day 에 *세 분기 함수화* 후보.
            const status =
              b.status === BookingStatus.cancelled && b.rejectionReason
                ? { text: "거절됨", className: "bg-rose-100 text-rose-700" }
                : b.status === BookingStatus.cancelled && b.cancellationReason
                  ? { text: "취소됨", className: "bg-amber-100 text-amber-700" }
                  : STATUS_LABEL[b.status]
            return (
              // Day 22: 카드 구조 변경 — *Link 안에 form 충돌 회피* 위해
              //   li 가 border + hover 가짐, Link 는 padding 만, 액션 영역은 *Link 밖*.
              //   pending 카드만 액션 영역 추가 — 그 외 상태는 단일 Link 카드.
              <li
                key={b.id}
                className="overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-zinc-300 hover:shadow-sm"
              >
                {/* ?from=/bookings → 상세 페이지의 뒤로가기가 "← 내 예약으로"로 동적 표시 */}
                <Link
                  href={`/services/${b.service.id}?from=${encodeURIComponent("/bookings")}`}
                  className="block p-5"
                >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {b.service.category}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {b.service.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      by {b.sellerProfile.user.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>

                <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">희망 일시</span>
                    <span>{formatBookingDatetime(b.preferredDatetime)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">소요</span>
                    <span>{formatDuration(b.service.durationMinutes)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">예상 금액</span>
                    <span className="font-semibold">
                      ₩{b.service.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {b.buyerMemo && (
                  <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                    {b.buyerMemo}
                  </p>
                )}

                {/* 셀러 거절 사유 (Day 21) */}
                {b.status === BookingStatus.cancelled && b.rejectionReason && (
                  <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                    <strong className="font-semibold">거절 사유:</strong>{" "}
                    {b.rejectionReason}
                  </div>
                )}

                {/* 내 취소 사유 (Day 22) — 본인 액션 reminder (Day 21 정신) */}
                {b.status === BookingStatus.cancelled && b.cancellationReason && (
                  <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                    <strong className="font-semibold">취소 사유:</strong>{" "}
                    {b.cancellationReason}
                  </div>
                )}
                </Link>

                {/* 액션 — pending 일 때만 [취소하기] (Day 22). *Link 밖* 영역.
                    학습 단계 정책: 셀러 확정 후엔 cancel X (별도 흐름 필요). */}
                {b.status === BookingStatus.pending && (
                  <div className="border-t border-zinc-100 px-5 py-3">
                    <CancelForm bookingId={b.id} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
