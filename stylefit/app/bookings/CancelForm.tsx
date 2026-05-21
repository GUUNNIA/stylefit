// 예약 취소 토글 폼 (Client Component) — Day 22
//
// admin/services/RejectForm + seller/bookings/RejectBookingForm 의 *세 번째 사용처* — 복붙.
// [[feedback-extraction-threshold]] 의 *세 번째 도달 시 추출 트리거*. Day 22 안에선 *추출 보류*
// (관찰 비교 가능 상태 만들어두기) — 다음 정리 Day 의 추출 대상.
//
// 카피·색 차별:
//   admin (반려 / rose) — 공식 절차, 강한 부정
//   seller booking (거절 / rose) — 셀러 거절, 강한 부정
//   buyer cancel (취소 / amber) — 본인 결정, *주의 신호* 정도. 부정 강도 ↓
//
// useState 만 사용. 서버 결과는 revalidatePath 로 자동 갱신.

"use client"

import { useState } from "react"
import { cancelBookingAction } from "./actions"

export default function CancelForm({ bookingId }: { bookingId: number }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-amber-300 px-4 py-2 text-sm text-amber-700 transition-colors hover:bg-amber-50"
      >
        취소하기
      </button>
    )
  }

  return (
    <form action={cancelBookingAction} className="w-full space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <textarea
        name="reason"
        required
        minLength={1}
        rows={2}
        placeholder="취소 사유를 입력해 주세요. 셀러에게 표시됩니다."
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700"
        >
          취소 확정
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          닫기
        </button>
      </div>
    </form>
  )
}
