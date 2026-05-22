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
  // 정확 매칭 vs 시작 매칭. 기본은 정확 매칭 — 너무 광범위한 강조를 피함.
  //   true   → href 자체로 startsWith (예: href="/services" → "/services/123" 도 활성)
  //   string → *별도 prefix* 로 startsWith. href 와 active 범위가 *다를 때* 사용.
  //            (예: href="/seller/services" matchPrefix="/seller" → 셀러 *모든* 페이지에서 활성)
  matchPrefix?: boolean | string
}

export default function NavLink({ href, children, matchPrefix }: NavLinkProps) {
  const pathname = usePathname()
  // matchPrefix 가 *문자열* 이면 그 값으로, *true* 면 href 로 startsWith.
  // *falsy* 면 정확 매칭.
  const isActive = matchPrefix
    ? pathname.startsWith(typeof matchPrefix === "string" ? matchPrefix : href)
    : pathname === href

  return (
    <Link
      href={href}
      className={
        isActive
          ? "font-semibold text-accent"
          : "text-ink-muted transition-colors hover:text-foreground"
      }
    >
      {children}
    </Link>
  )
}
