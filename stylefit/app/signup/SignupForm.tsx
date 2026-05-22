// 회원가입 폼 (Client Component) — Day 11 분리
//
// page.tsx(Server)가 searchParams에서 from을 추출해 props로 전달.

"use client"

import Link from "next/link"
import { useActionState } from "react"
import { signupAction, type SignupState } from "./actions"

export default function SignupForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(
    signupAction,
    undefined
  )

  // 로그인 링크에도 from 보존
  const loginHref = from ? `/login?from=${encodeURIComponent(from)}` : "/login"

  return (
    <>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="from" value={from ?? ""} />

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            key={state?.values?.email ?? "initial"}
            defaultValue={state?.values?.email ?? ""}
            className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
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
            className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
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
            className="w-full rounded-lg border border-line bg-surface-muted px-3 py-2 text-foreground outline-none focus:border-ink-subtle"
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
            className="h-4 w-4 rounded border-line"
          />
          <label htmlFor="agreedTerms" className="text-sm">
            이용약관에 동의합니다.
          </label>
        </div>
        {state?.fieldErrors?.agreedTerms && (
          <p className="text-xs text-red-600">{state.fieldErrors.agreedTerms}</p>
        )}

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-accent-bg py-2.5 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60 dark:text-zinc-900"
        >
          {pending ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-subtle">
        이미 계정이 있으신가요?{" "}
        <Link href={loginHref} className="font-medium text-foreground underline">
          로그인
        </Link>
      </p>
    </>
  )
}
