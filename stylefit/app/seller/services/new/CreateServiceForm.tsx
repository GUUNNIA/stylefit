// 서비스 등록 폼 (Client Component) — Day 13 B 단계
//
// LoginForm 패턴 그대로: useActionState로 server action 결과 받음.
// 실패 시 state.error 노출 + state.values로 입력값 복원 (defaultValue 트릭).
//
// SERVICE_CATEGORIES를 import해서 select 옵션 자동 생성 — actions.ts의 Zod와 *같은 배열* 공유.
// 한 곳(constants 파일)을 바꾸면 폼·검증 모두 자동 갱신.

"use client"

import { useActionState } from "react"
import {
  createServiceAction,
  type CreateServiceState,
} from "./actions"
import { SERVICE_CATEGORIES } from "@/app/lib/service-categories"

// 정수 input에서 *입력 시점*에 비정수 키 차단 — 소수점(.), 지수(e/E), 부호(+/-).
// 컴포넌트 외부 정의 → 매 렌더마다 재생성 안 됨.
function blockNonInteger(e: React.KeyboardEvent<HTMLInputElement>) {
  if ([".", "e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault()
  }
}

export default function CreateServiceForm() {
  const [state, formAction, pending] = useActionState<
    CreateServiceState,
    FormData
  >(createServiceAction, undefined)

  return (
    // noValidate — 브라우저 자동 메시지(영문 직역체) 차단, 검증은 *Zod (서버)*에서만.
    // step·required는 *UX 가이드*로 유지 (드롭다운 화살표 단위 등).
    <form action={formAction} noValidate className="space-y-4">
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
          defaultValue={state?.values?.title ?? ""}
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
          defaultValue={state?.values?.description ?? ""}
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
              defaultChecked={state?.values?.serviceType !== "offline"}
            />
            <span>온라인</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="serviceType"
              value="offline"
              defaultChecked={state?.values?.serviceType === "offline"}
            />
            <span>오프라인</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">
          카테고리
        </label>
        {/* key + defaultValue 트릭 (Day 10 LoginForm과 동일):
            state.values.category 변경 시 select가 *새 mount* → defaultValue 재적용.
            select 는 text input과 달리 uncontrolled 재렌더 시 값 유지가 불안정 → key 필수. */}
        <select
          id="category"
          name="category"
          required
          key={state?.values?.category ?? "initial"}
          defaultValue={state?.values?.category ?? ""}
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
          defaultValue={state?.values?.price ?? ""}
          placeholder="50000"
          className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">소요 시간</label>
        {/* 세 단위(일/시간/분) 분리 입력 → 서버에서 합산 후 durationMinutes로 저장.
            입력 단위·표시 단위(formatDuration) 일치 — 셀러 변환 부담 없음. */}
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
              defaultValue={state?.values?.days ?? ""}
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
              defaultValue={state?.values?.hours ?? ""}
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
              defaultValue={state?.values?.minutes ?? ""}
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
        {pending ? "등록 중..." : "등록하기"}
      </button>

      <p className="text-xs text-ink-subtle">
        등록 후 운영자 검증을 거쳐 서비스가 노출됩니다 (등록 직후 *심사 중* 상태).
      </p>
    </form>
  )
}
