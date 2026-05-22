// 후기 작성 토글 폼 (Client Component) — Day 24
//
// completed booking 의 *후기 없음* 카드에서 호출. ReasonForm 의 *네 번째 사용처 X* — 구조 다름:
//   - rating radio (1~5) 추가 — 새 필드
//   - 색 emerald (긍정 액션) — ReasonForm 의 rose/amber 와 다른 의미
//   - 제출 후 *폼 안 닫음* (revalidatePath 로 자동 카드 전환 — review 있음 표시)
//
// 다음 정리 Day 후보:
//   - ReasonForm + ReviewForm 의 *공통 토글 패턴* 더 깊이 추출 (slot pattern, children prop 등)
//   - 단 *지금은 두 사용처* — Day 23 의 *세 번째 도달 후 추출* 원칙 따라 *복붙 유지*

"use client"

import { useState } from "react"
import { createReviewAction } from "./actions"

export default function ReviewForm({ bookingId }: { bookingId: number }) {
  const [open, setOpen] = useState(false)

  if (!open) {
    // primary (인디고 surface) — completed booking 의 *유일+긍정* 액션
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
      >
        후기 작성
      </button>
    )
  }

  return (
    <form action={createReviewAction} className="w-full space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-muted">별점</legend>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                required
                className="text-accent focus:ring-accent"
              />
              <span>{n}점</span>
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        name="content"
        required
        minLength={1}
        rows={3}
        placeholder="서비스에 대한 후기를 작성해 주세요. 다른 분들의 선택에 도움이 됩니다."
        className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ink-subtle"
      />
      <div className="flex gap-2">
        {/* 후기 등록 = primary (확정은 항상 강조) */}
        <button
          type="submit"
          className="rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
        >
          후기 등록
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted"
        >
          닫기
        </button>
      </div>
    </form>
  )
}
