// 셀러 반려 토글 폼 (Client Component) — Day 14
//
// /admin/services 의 RejectForm 과 동일 패턴 — serviceId → sellerProfileId.
// 패턴 두 번째 사용. 세 번째 사용처 등장 시 공통 모듈로 추출 검토.

"use client"

import { useState } from "react"
import { rejectSellerAction } from "./actions"

export default function RejectForm({
  sellerProfileId,
}: {
  sellerProfileId: number
}) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-50"
      >
        반려하기
      </button>
    )
  }

  return (
    <form action={rejectSellerAction} className="w-full space-y-2">
      <input
        type="hidden"
        name="sellerProfileId"
        value={sellerProfileId}
      />
      <textarea
        name="reason"
        required
        minLength={1}
        rows={2}
        placeholder="반려 사유를 입력해 주세요. 셀러에게 표시됩니다."
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm text-white transition-colors hover:bg-rose-700"
        >
          반려 확정
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
