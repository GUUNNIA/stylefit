// 예약 거절 토글 폼 (Client Component) — Day 21
//
// admin/services 의 RejectForm 의 *셀러판*. 두 번째 사용처라 *복붙 OK* (Day 11 원칙).
// 셀러 카피("거절") + admin 카피("반려") 진화 여지 보존.
//
// useState 만 사용 (toggle). 서버 결과는 revalidatePath 로 자동 갱신.

"use client"

import { useState } from "react"
import { rejectBookingAction } from "./actions"

export default function RejectBookingForm({ bookingId }: { bookingId: number }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-50"
      >
        거절하기
      </button>
    )
  }

  return (
    <form action={rejectBookingAction} className="w-full space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <textarea
        name="reason"
        required
        minLength={1}
        rows={2}
        placeholder="거절 사유를 입력해 주세요. 구매자에게 표시됩니다."
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm text-white transition-colors hover:bg-rose-700"
        >
          거절 확정
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          취소
        </button>
      </div>
    </form>
  )
}
