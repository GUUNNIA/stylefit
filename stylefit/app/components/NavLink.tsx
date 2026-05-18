// 현재 경로 강조 nav 링크 (Day 11)
//
// usePathname은 Client Component 전용 → Header(Server)에서는 못 씀.
// 그래서 *작은 NavLink만* Client로 분리. Header가 부모(Server),
// NavLink가 자식(Client)으로 합성. Day 11 BookingForm 패턴과 동일.

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLinkProps = {
  href: string
  children: React.ReactNode
  // 정확 매칭 vs 시작 매칭. /services와 /services/123 둘 다 강조하려면 startsWith.
  // 기본은 정확 매칭 — 너무 광범위한 강조를 피함.
  matchPrefix?: boolean
}

export default function NavLink({ href, children, matchPrefix }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = matchPrefix
    ? pathname.startsWith(href)
    : pathname === href

  return (
    <Link
      href={href}
      className={
        isActive
          ? "font-semibold text-zinc-900"
          : "text-zinc-600 transition-colors hover:text-zinc-900"
      }
    >
      {children}
    </Link>
  )
}
