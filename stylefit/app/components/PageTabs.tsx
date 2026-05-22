// 페이지 그룹 sub-nav (Day 28) — admin / seller 영역 내부에서 페이지 전환.
//
// NavLink (헤더용) 와 다른 점:
//   - 가로 탭 형태 (하단 보더 강조), 헤더의 인라인 링크와 시각 차별
//   - active 표시: 인디고 보더 + 액센트 텍스트 (Day 28 accent 토큰 활용)
//
// usePathname 은 Client Component 전용 → "use client".
// 3 사용처 도달 (admin 3, seller 3) 후 *직접* 추출 — Day 23 ReasonForm 추출 패턴 재현.

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export type PageTab = {
  href: string
  label: string
}

export default function PageTabs({ items }: { items: PageTab[] }) {
  const pathname = usePathname()

  return (
    // -mb-px: active 탭의 하단 보더가 부모 컨테이너 보더와 *겹쳐* 한 줄로 보이게 (탭 표준 패턴).
    <div className="mb-6 flex border-b border-line">
      {items.map(({ href, label }) => {
        // 정확 매칭 + 하위 경로 매칭 둘 다 — 예: /admin/sellers 와 /admin/sellers/123 모두 활성.
        const isActive = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={
              isActive
                ? "-mb-px border-b-2 border-accent px-4 py-2 text-sm font-semibold text-accent"
                : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm text-ink-muted transition-colors hover:text-foreground"
            }
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
