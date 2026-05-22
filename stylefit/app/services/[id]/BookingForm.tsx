// 예약 폼 (Day 11)
//
// "use client" 필요: useActionState 훅 사용.
// 부모(/services/[id]/page.tsx)에서 *최소한의 props*만 받음 —
// user.id 같은 인증 정보는 *서버 action에서 다시 DAL로 확인*하므로 props에 안 둠.

"use client"

import { useActionState, useEffect, useState } from "react"
import { bookServiceAction, type BookingState } from "./actions"
import { formatDuration } from "@/app/lib/format"

type BookingFormProps = {
  serviceId: number
  serviceTitle: string  // ④ 폼 컨텍스트 — "무엇을 예약하는지" 명시
  price: number
  durationMinutes: number
}

// datetime-local input 포맷 ("YYYY-MM-DDTHH:MM")으로 변환
function toLocalInputValue(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function BookingForm({
  serviceId,
  serviceTitle,
  price,
  durationMinutes,
}: BookingFormProps) {
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    bookServiceAction,
    undefined
  )

  // ③ 과거 날짜 차단 — 클라이언트 마운트 후 min 설정.
  // 왜 useEffect? Date.now()를 서버/클라이언트에서 둘 다 호출하면 시간 차이로
  // hydration mismatch 경고. useEffect는 *클라이언트에서만* 실행 → 안전.
  // 첫 렌더에는 minDate 빈 문자열 → 마운트 직후 set → 짧은 깜빡임이 있지만
  // 사용자가 폼에 접근하기 전에 갱신 완료.
  const [minDate, setMinDate] = useState("")
  useEffect(() => {
    // 최소 1시간 뒤 — 너무 임박한 예약 막기 (셀러 준비 시간)
    setMinDate(toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)))
  }, [])

  return (
    <div className="rounded-xl border border-line bg-surface p-6 text-foreground">
      {/* ④ 폼 컨텍스트 — "{서비스 제목} 예약" */}
      <p className="mb-1 text-xs text-ink-subtle">예약 서비스</p>
      <h2 className="mb-4 text-lg font-semibold">{serviceTitle}</h2>

      <form action={formAction} className="space-y-4">
        {/* serviceId는 hidden으로 함께 전송. 클라이언트 변조 가능성 → 서버에서 *DB 조회*로 검증 */}
        <input type="hidden" name="serviceId" value={serviceId} />

        <div>
          <label
            htmlFor="preferredDatetime"
            className="mb-1 block text-sm font-medium"
          >
            희망 일시
          </label>
          {/* 입력 필드는 *카드 안* 이라 surface-muted (한 단 깊이) — 카드 surface 와 시각 분리 */}
          <input
            id="preferredDatetime"
            name="preferredDatetime"
            type="datetime-local"
            required
            min={minDate}
            className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
          />
        </div>

        <div>
          <label htmlFor="buyerMemo" className="mb-1 block text-sm font-medium">
            셀러에게 전할 메모 <span className="text-ink-subtle">(선택)</span>
          </label>
          <textarea
            id="buyerMemo"
            name="buyerMemo"
            rows={3}
            maxLength={500}
            placeholder="기대하는 내용이나 사전 정보가 있으면 알려주세요."
            className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
          />
        </div>

        <div className="space-y-1 border-t border-line pt-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-ink-muted">예상 소요</span>
            <span>{formatDuration(durationMinutes)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-ink-muted">예상 금액</span>
            <span className="text-lg font-semibold">
              ₩{price.toLocaleString()}
            </span>
          </div>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        {/* primary 버튼 — Header/services 패턴과 동일한 opacity hover 로 통일 */}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent-bg py-2.5 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 dark:text-zinc-900"
        >
          {pending ? "예약 처리 중..." : "예약하기"}
        </button>

        <p className="text-center text-xs text-ink-subtle">
          예약은 셀러 확인 후 확정됩니다. 결제는 확정 후에 진행됩니다.
        </p>
      </form>
    </div>
  )
}
