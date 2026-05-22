// 페이지 내 *알림 박스* — 거절/취소 사유, 받은 후기 등 (Day 28).
//
// 디자인:
//   - 배경: bg-surface-muted (중립) — 의미색 버튼과 시각 분리
//   - 아이콘: 의미색 (variant 별), 텍스트도 의미색
//   - 좌측 보더 X — 디자이너 선호 (Day 28 결정)
//
// 9 사용처 도달 후 추출 (Day 23 ReasonForm 추출 패턴 재현):
//   bookings × 3 + seller/bookings × 3 + seller/services × 1 + admin × 2
//
// inline SVG — lucide-react 같은 라이브러리 도입 없이 가벼움 유지.
//   각 아이콘 viewBox 24, stroke-width 2 의 lucide 패턴.

type AlertVariant = "danger" | "warning" | "success"

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  danger: "text-rose-700 dark:text-rose-300",
  warning: "text-amber-700 dark:text-amber-300",
  success: "text-emerald-700 dark:text-emerald-300",
}

function VariantIcon({ variant }: { variant: AlertVariant }) {
  // 공통 SVG 속성 — class 만 따로
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "mt-0.5 h-4 w-4 shrink-0",
  }

  if (variant === "danger") {
    // AlertTriangle — 경고/거절
    return (
      <svg {...common}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    )
  }
  if (variant === "warning") {
    // Info — 주의/취소
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    )
  }
  // success — MessageSquare (후기)
  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export default function AlertBox({
  variant,
  children,
}: {
  variant: AlertVariant
  children: React.ReactNode
}) {
  return (
    <div
      className={`mt-3 flex gap-2 rounded-md bg-surface-muted p-3 text-sm ${VARIANT_CLASSES[variant]}`}
    >
      <VariantIcon variant={variant} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
