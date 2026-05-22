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
import NavLink from "./NavLink"
import ThemeToggle from "./ThemeToggle"

// inline Server Action: 함수 내부에 "use server" 지시
async function logoutAction() {
  "use server"
  await deleteSession()
  redirect("/")
}

export default async function Header() {
  const user = await getCurrentUser()

  // Day 28: 셀러/관리자 메뉴 분기 — 권한 있는 사용자만 진입 링크 노출.
  //   isSeller: SellerProfile 있고 approved 상태만. pending/rejected/none 은 X.
  //   isAdmin: User.role === "admin".
  const isSeller = user?.sellerProfile?.verificationStatus === "approved"
  const isAdmin = user?.role === "admin"

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          Stylefit
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {/* /services 와 /services/[id] 둘 다에서 "서비스" 강조 → matchPrefix */}
          <NavLink href="/services" matchPrefix>
            서비스
          </NavLink>

          <ThemeToggle />

          {user ? (
            <>
              <NavLink href="/bookings">내 예약</NavLink>
              {/* 셀러: /seller/* 전체 강조 (services/bookings/activity-log 등 모두 활성).
                  href 는 진입지 (services), matchPrefix 는 *active 범위* (seller 전체) — 분리. */}
              {isSeller && (
                <NavLink href="/seller/services" matchPrefix="/seller">
                  셀러 메뉴
                </NavLink>
              )}
              {/* 관리자: /admin/* 전체 강조 — 같은 분리 패턴 */}
              {isAdmin && (
                <NavLink href="/admin/audit-log" matchPrefix="/admin">
                  관리자
                </NavLink>
              )}
              <span className="text-ink-muted">{user.name}님</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-line px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-line px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
              >
                로그인
              </Link>
              {/* primary 버튼 — Day 28 인디고 통일 */}
              <Link
                href="/signup"
                className="rounded-md bg-accent-bg px-3 py-1.5 font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
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
