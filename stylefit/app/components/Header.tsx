// 글로벌 헤더 (Day 10)
//
// Server Component로 만든 이유:
// - getCurrentUser()로 *서버에서* 로그인 여부 판단 → 클라이언트에 JS 안 보냄
// - 비로그인 사용자는 *애초에 로그인 UI*만 받음 (보안·번들 사이즈)
//
// 로그아웃은 inline Server Action — Client Component 필요 없음.
// <form action={logoutAction}>이 *기본 HTML form submission* 위에서 작동.

import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/app/lib/dal"
import { deleteSession } from "@/app/lib/session"

// inline Server Action: 함수 내부에 "use server" 지시
async function logoutAction() {
  "use server"
  await deleteSession()
  redirect("/")
}

export default async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-zinc-900">
          Stylefit
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/services"
            className="text-zinc-600 transition-colors hover:text-zinc-900"
          >
            서비스
          </Link>

          {user ? (
            <>
              <span className="text-zinc-700">{user.name}님</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-zinc-200 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-white transition-colors hover:bg-zinc-800"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
