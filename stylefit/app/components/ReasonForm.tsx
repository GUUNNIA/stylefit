// 사유 입력 토글 폼 (Client Component) — Day 23 추출
//
// 세 사용처의 *공통 패턴* 추출:
//   - admin/services 반려 (Day 14)
//   - seller/bookings 거절 (Day 21)
//   - buyer /bookings 취소 (Day 22)
//
// 진짜 같은 부분 (Day 19 정신 — 비교 후 추출):
//   - useState toggle (열기/닫기)
//   - hidden id input + textarea required + 제출/닫기 두 버튼
//   - 폼 action 호출 흐름 (Server Action 직접 호출)
//
// 다른 부분 = props:
//   - action / idName / idValue
//   - openLabel / submitLabel / placeholder / closeLabel (카피)
//   - color (rose 강한 부정 / amber 주의 신호 — Day 22 의 *부정 강도 색 시스템*)
//
// 색 처리 — *literal union + 컴포넌트 안 매핑*:
//   Tailwind 의 *동적 보간* (bg-${color}-500) 은 purge 시 클래스 안 잡힘.
//   COLOR_CLASSES Record 로 *정적 매핑* — purge 안전.
//
// 추출 안 한 영역 (얕은 추출 — Day 19 정신):
//   - rejectionReason / cancellationReason 박스 표시 — *각 페이지에 inline* 유지 (3분기 라벨도 inline)
//   - 사용자 카피의 *어휘 차이 (반려/거절/취소)* — props 로 받음, 함수 내부에서 결정 X

"use client"

import { useState } from "react"

type ReasonFormProps = {
  action: (formData: FormData) => void | Promise<void>
  idName: string
  idValue: number
  openLabel: string
  submitLabel: string
  placeholder: string
  closeLabel?: string
  color?: "rose" | "amber"
}

// 정적 매핑 — Tailwind purge 안전. 새 색 추가 시 여기에 키 추가.
const COLOR_CLASSES = {
  rose: {
    openButton: "border-rose-300 text-rose-700 hover:bg-rose-50",
    submitButton: "bg-rose-600 hover:bg-rose-700",
  },
  amber: {
    openButton: "border-amber-300 text-amber-700 hover:bg-amber-50",
    submitButton: "bg-amber-600 hover:bg-amber-700",
  },
} as const

export default function ReasonForm({
  action,
  idName,
  idValue,
  openLabel,
  submitLabel,
  placeholder,
  closeLabel = "취소",
  color = "rose",
}: ReasonFormProps) {
  const [open, setOpen] = useState(false)
  const cls = COLOR_CLASSES[color]

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border px-4 py-2 text-sm transition-colors ${cls.openButton}`}
      >
        {openLabel}
      </button>
    )
  }

  return (
    <form action={action} className="w-full space-y-2">
      <input type="hidden" name={idName} value={idValue} />
      <textarea
        name="reason"
        required
        minLength={1}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className={`rounded-lg px-4 py-2 text-sm text-white transition-colors ${cls.submitButton}`}
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          {closeLabel}
        </button>
      </div>
    </form>
  )
}
