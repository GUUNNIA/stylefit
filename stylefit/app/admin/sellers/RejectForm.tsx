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
    // secondary (인디고 라인) — 보조 부정 액션
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-accent px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
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
        className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ink-subtle"
      />
      <div className="flex gap-2">
        {/* 반려 확정 = primary (확정은 항상 강조) */}
        <button
          type="submit"
          className="rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
        >
          반려 확정
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted"
        >
          취소
        </button>
      </div>
    </form>
  )
}
