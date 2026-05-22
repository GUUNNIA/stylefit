// 서비스 수정 폼 (Client Component) — Day 15 — 2단계
//
// CreateServiceForm 과 거의 동일. 차이:
//   1. action = updateServiceAction (시그니처 동일 — useActionState 호환)
//   2. defaultValue 가 *초기값 객체*에서 옴 (등록 폼은 빈 문자열에서 시작)
//      검증 실패 후 재렌더 시엔 *state.values* 가 우선 — 사용자가 쓰던 값 우선.
//   3. hidden input 으로 serviceId 전달 — 서버는 이걸 받되 *재검증* (액션 참고).
//
// 15-5 에서 두 폼 합칠지 판단 예정.

"use client"

import { useActionState } from "react"
import {
  updateServiceAction,
  type UpdateServiceState,
} from "./actions"
import { SERVICE_CATEGORIES } from "@/app/lib/service-categories"

function blockNonInteger(e: React.KeyboardEvent<HTMLInputElement>) {
  if ([".", "e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault()
  }
}

// 페이지에서 분해해 넘긴 초기값. 모두 string — defaultValue 가 FormData 와 같은 형태.
export type EditServiceInitialValues = {
  title: string
  description: string
  serviceType: string
  category: string
  price: string
  days: string
  hours: string
  minutes: string
}

export default function EditServiceForm({
  serviceId,
  initial,
}: {
  serviceId: number
  initial: EditServiceInitialValues
}) {
  const [state, formAction, pending] = useActionState<
    UpdateServiceState,
    FormData
  >(updateServiceAction, undefined)

  // 검증 실패 후엔 사용자가 쓰던 값 우선. 첫 렌더엔 DB initial.
  // ?? 가 아닌 || — state.values 의 빈 문자열도 *비어있는 입력*으로 통과시키지 않게
  //   (등록 폼 패턴과 일치: 사용자가 지웠으면 그 빈 상태 유지).
  const v = state?.values ?? initial

  return (
    <form action={formAction} noValidate className="space-y-4">
      {/* serviceId — 클라가 조작 가능. 서버 액션이 *본인 소유 재검증*. */}
      <input type="hidden" name="serviceId" value={serviceId} />

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={80}
          defaultValue={v.title}
          placeholder="예: 포트폴리오 리뷰 1:1"
          className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium"
        >
          설명
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          maxLength={500}
          defaultValue={v.description}
          placeholder="이 서비스가 무엇을 제공하는지 간단히 설명해 주세요."
          className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
        />
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium">유형</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="serviceType"
              value="online"
              defaultChecked={v.serviceType !== "offline"}
            />
            <span>온라인</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="serviceType"
              value="offline"
              defaultChecked={v.serviceType === "offline"}
            />
            <span>오프라인</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          카테고리
        </label>
        {/* key + defaultValue 트릭 — select 는 uncontrolled 재렌더 시 값 유지 불안정. */}
        <select
          id="category"
          name="category"
          required
          key={v.category || "initial"}
          defaultValue={v.category}
          className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
        >
          <option value="" disabled>
            선택해 주세요
          </option>
          {SERVICE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium">
          가격 (원)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min={100}
          step={100}
          required
          onKeyDown={blockNonInteger}
          defaultValue={v.price}
          placeholder="50000"
          className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">소요 시간</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <input
              id="days"
              name="days"
              type="number"
              min={0}
              max={365}
              step={1}
              onKeyDown={blockNonInteger}
              defaultValue={v.days}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
            />
            <p className="mt-1 text-center text-xs text-ink-subtle">일</p>
          </div>
          <div>
            <input
              id="hours"
              name="hours"
              type="number"
              min={0}
              max={23}
              step={1}
              onKeyDown={blockNonInteger}
              defaultValue={v.hours}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
            />
            <p className="mt-1 text-center text-xs text-ink-subtle">시간</p>
          </div>
          <div>
            <input
              id="minutes"
              name="minutes"
              type="number"
              min={0}
              max={59}
              step={15}
              onKeyDown={blockNonInteger}
              defaultValue={v.minutes}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
            />
            <p className="mt-1 text-center text-xs text-ink-subtle">분 (15분 단위)</p>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent-bg py-2.5 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 dark:text-zinc-900"
      >
        {pending ? "저장 중..." : "수정 저장"}
      </button>

      <p className="text-xs text-ink-subtle">
        수정 후엔 *심사 중* 상태로 돌아가 운영자 재검증을 거칩니다.
      </p>
    </form>
  )
}
