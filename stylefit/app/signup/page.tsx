// /signup — 회원가입 폼 (Day 10)
//
// 로그인 폼과 같은 패턴이지만 *필드별 에러*를 표시하는 점이 추가.
// (로그인: "이메일 또는 비번이 틀렸습니다" 한 줄 / 회원가입: 어느 필드가 어떻게 잘못됐는지 명시)

"use client"

import { useActionState } from "react"
import { signupAction, type SignupState } from "./actions"

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    undefined
  )

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">회원가입</h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            이메일
          </label>
          {/* key + defaultValue 트릭: state.values.email이 채워지면 *이 input만 새 mount* → 입력값 복원.
              비밀번호는 의도적으로 이 처리 안 함 → form auto reset에 따라 빈 상태 유지. */}
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            key={state?.values?.email ?? "initial"}
            defaultValue={state?.values?.email ?? ""}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={20}
            key={state?.values?.name ?? "initial"}
            defaultValue={state?.values?.name ?? ""}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="agreedTerms"
            name="agreedTerms"
            type="checkbox"
            required
            className="h-4 w-4 rounded border-zinc-300"
          />
          <label htmlFor="agreedTerms" className="text-sm">
            이용약관에 동의합니다.
          </label>
        </div>
        {state?.fieldErrors?.agreedTerms && (
          <p className="text-xs text-red-600">{state.fieldErrors.agreedTerms}</p>
        )}

        {/* 전체 에러 (이메일 중복 등) */}
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-foreground py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {pending ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="font-medium text-zinc-900 underline">
          로그인
        </a>
      </p>
    </main>
  )
}
