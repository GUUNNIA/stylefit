// 로그인 폼 (Client Component) — Day 11 분리
//
// page.tsx(Server)가 searchParams에서 from을 추출해서 props로 전달.
// 폼은 from을 hidden input으로 함께 제출 → actions.ts가 safeReturnUrl로 검증 후 redirect.

"use client"

import Link from "next/link"
import { useActionState } from "react"
import { loginAction, type LoginState } from "./actions"

export default function LoginForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  )

  // signup 링크에도 from을 보존 — 사용자가 로그인↔회원가입 왔다 갔다 해도 복귀 위치 유지
  const signupHref = from
    ? `/signup?from=${encodeURIComponent(from)}`
    : "/signup"

  return (
    <form action={formAction} className="space-y-4">
      {/* return URL은 hidden input으로 — 빈 값이면 actions의 fallback("/services")이 작동 */}
      <input type="hidden" name="from" value={from ?? ""} />

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          이메일
        </label>
        {/* key + defaultValue 트릭(Day 10): 실패 시 이메일 input만 새 mount → 값 복원 */}
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          key={state?.email ?? "initial"}
          defaultValue={state?.email ?? ""}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
        />
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
          autoComplete="current-password"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-400"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-foreground py-2.5 text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>

      <p className="mt-6 text-sm text-zinc-500">
        아직 계정이 없으신가요?{" "}
        <Link href={signupHref} className="font-medium text-zinc-900 underline">
          회원가입
        </Link>
      </p>
    </form>
  )
}
