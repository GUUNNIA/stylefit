// /seller/bookings — 셀러가 받은 예약 목록 (Day 13, Day 21 액션 추가)
//
// buyer /bookings 의 *대칭형* — 같은 데이터를 받은 사람 시각에서.
// 정렬은 status 우선(pending 위) — 셀러가 *행동 필요* 건을 먼저 보게.
//
// Day 21: pending 카드에 [확정] / [거절] 액션 추가. confirmBookingAction + RejectBookingForm.
// STATUS_LABEL 도 BookingStatus enum 타입으로 — Day 19 의 *Record<Enum, ...>* 패턴 일관.
// cancelled 의 *셀러 거절* vs *buyer 취소* 는 rejectionReason 유무로 간접 구분 (라벨 분기).

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"
import { BookingStatus } from "@prisma/client"
import { confirmBookingAction, rejectBookingAction } from "./actions"
import ReasonForm from "@/app/components/ReasonForm"

// status → 한국어 라벨 + 색. Day 19 패턴 — enum 키화로 *모든 값 정의 보장* (?? fallback 불필요).
const STATUS_LABEL: Record<BookingStatus, { text: string; className: string }> = {
  pending: { text: "확인 대기", className: "bg-zinc-100 text-zinc-700" },
  confirmed: { text: "확정됨", className: "bg-emerald-100 text-emerald-700" },
  completed: { text: "완료", className: "bg-zinc-100 text-zinc-500" },
  cancelled: { text: "취소됨", className: "bg-red-100 text-red-700" },
}

// 셀러 행동 우선순위 — pending 위, cancelled 아래
const STATUS_ORDER: Record<BookingStatus, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
}

function formatBookingDatetime(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export default async function SellerBookingsPage() {
  const sellerProfile = await requireSellerProfile("/seller/bookings")

  // createdAt desc로 가져온 뒤 코드에서 status 우선 정렬.
  // Prisma orderBy로 status enum 정렬은 raw SQL 필요 — 학습 단계엔 코드 sort가 친숙.
  const bookings = await prisma.booking.findMany({
    where: { sellerProfileId: sellerProfile.id },
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
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // [...bookings].sort(...) — 원본 mutate 안 하려고 복사 (findMany 결과라 지금은 영향 없지만 습관).
  // 같은 status 안에선 createdAt desc 유지 (Array.prototype.sort는 stable).
  // STATUS_ORDER 가 enum 화돼서 *?? fallback 불필요* (Day 21 정리).
  const sorted = [...bookings].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  )

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">받은 예약</h1>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-zinc-600">아직 받은 예약이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((b) => {
            // cancelled 의 *3 분기* 라벨 (Day 22, /bookings 와 대칭):
            //   rejectionReason 있음   → 내가 거절 (rose, 강한 부정)
            //   cancellationReason 있음 → buyer 가 취소 (amber, 주의 신호)
            //   둘 다 없음               → 기본 cancelled (red, fallback)
            // *얇은 함수 추출 안 함* — Day 19 원칙. 다음 정리 Day 에 *세 분기 함수화* 후보.
            const status =
              b.status === BookingStatus.cancelled && b.rejectionReason
                ? { text: "거절됨", className: "bg-rose-100 text-rose-700" }
                : b.status === BookingStatus.cancelled && b.cancellationReason
                  ? { text: "취소됨", className: "bg-amber-100 text-amber-700" }
                  : STATUS_LABEL[b.status]
            return (
              <li
                key={b.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900"
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
                      from {b.buyer.name}
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
                  {b.confirmedDatetime && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-zinc-600">확정 일시</span>
                      <span>{formatBookingDatetime(b.confirmedDatetime)}</span>
                    </div>
                  )}
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

                {/* 거절 사유 표시 (Day 21) — 자기가 입력한 사유 reminder (admin/services 패턴 일관) */}
                {b.status === BookingStatus.cancelled && b.rejectionReason && (
                  <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                    <strong className="font-semibold">거절 사유:</strong>{" "}
                    {b.rejectionReason}
                  </div>
                )}

                {/* buyer 취소 사유 (Day 22) — 셀러가 *왜 취소됐는지* 알아야 함 (대칭 정보) */}
                {b.status === BookingStatus.cancelled && b.cancellationReason && (
                  <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
                    <strong className="font-semibold">취소 사유:</strong>{" "}
                    {b.cancellationReason}
                  </div>
                )}

                {/* 액션 — pending 일 때만 [확정] / [거절] (Day 21).
                    그 외 상태 (confirmed/completed/cancelled) 는 액션 없음 — 학습 단계 단순화. */}
                {b.status === BookingStatus.pending && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                    <form action={confirmBookingAction}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
                      >
                        확정
                      </button>
                    </form>
                    <ReasonForm
                      action={rejectBookingAction}
                      idName="bookingId"
                      idValue={b.id}
                      openLabel="거절하기"
                      submitLabel="거절 확정"
                      placeholder="거절 사유를 입력해 주세요. 구매자에게 표시됩니다."
                      color="rose"
                    />
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
