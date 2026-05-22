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
  // Day 28: 의미색 폐기. 위계는 *형태* 로만 구분.
  //   primary  = 핵심/유일 액션 (인디고 surface) — buyer 취소 같이
  //   secondary = 보조 부정 액션 (인디고 라인) — 거절/반려 같이
  tone?: "primary" | "secondary"
}

// Day 28: 의미색 제거. 모든 액션 = 인디고. 위계는 형태로.
//   primary  = 인디고 채워진 surface
//   secondary = 인디고 라인 (보더 + 옅은 호버)
// submit 은 *항상 primary* — 폼 안 확정 액션은 강조.
const TONE_OPEN: Record<"primary" | "secondary", string> = {
  primary: "bg-accent-bg font-medium text-white hover:opacity-90 dark:text-zinc-900",
  secondary: "border border-accent text-accent hover:bg-accent/10",
}

export default function ReasonForm({
  action,
  idName,
  idValue,
  openLabel,
  submitLabel,
  placeholder,
  closeLabel = "취소",
  tone = "secondary",
}: ReasonFormProps) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg px-4 py-2 text-sm transition-colors ${TONE_OPEN[tone]}`}
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
        className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ink-subtle"
      />
      <div className="flex gap-2">
        {/* submit = primary 인디고 (확정은 항상 강조) */}
        <button
          type="submit"
          className="rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
        >
          {submitLabel}
        </button>
        {/* 닫기 = tertiary (모노톤 라인) — 폼 흐름 보조 */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-muted"
        >
          {closeLabel}
        </button>
      </div>
    </form>
  )
}
