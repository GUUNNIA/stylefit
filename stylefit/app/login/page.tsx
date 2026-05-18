// /login — 로그인 폼 (Day 10)
//
// "use client" 지시어:
// - 이 파일이 *Client Component*임을 명시.
// - 폼 인터랙션(입력·제출 상태 추적)에 useActionState 같은 *React 훅* 필요.
// - 훅은 클라이언트에서만 작동 → "use client" 필수.
//
// Server Component(Day 9 /services)와의 차이:
// - Server Component: 서버에서 렌더, async 가능, DB 직접 접근.
// - Client Component: 브라우저에서 인터랙티브, 훅 사용 가능, DB 직접 X.
// - 둘 다 필요한 페이지는 *Server를 부모, Client를 자식*으로 합성.

"use client"

import { useActionState } from "react"
import { loginAction, type LoginState } from "./actions"

export default function LoginPage() {
  // useActionState 시그니처:
  //   const [state, formAction, pending] = useActionState(actionFn, initialState)
  // - state: 직전 호출 결과 (loginAction의 반환값)
  // - formAction: <form action={...}>에 넘길 wrapped 함수
  // - pending: 제출 중 여부 (버튼 비활성화·"로그인 중..." 표시용)
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  )

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">로그인</h1>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            이메일
          </label>
          {/*
            key + defaultValue 트릭:
            - 폼 제출 시 React가 form을 자동 reset → uncontrolled input은 빈 상태가 됨
            - 그 직후 state.email이 채워져서 *이 input만 새 mount* → defaultValue 새 값 반영
            - 비번 input엔 이걸 안 줘서 *form reset에 그대로 따라가 빈 상태* 유지 (보안적 표준)
          */}
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

        {/* state.error가 있으면 빨간 메시지. 첫 렌더(state=undefined)에선 안 보임 */}
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
      </form>

      <p className="mt-6 text-sm text-zinc-500">
        아직 계정이 없으신가요?{" "}
        <a href="/signup" className="font-medium text-zinc-900 underline">
          회원가입
        </a>
      </p>
    </main>
  )
}
