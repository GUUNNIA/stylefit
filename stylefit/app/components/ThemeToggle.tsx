// 다크/라이트 테마 토글 버튼 (Day 26)
//
// Client Component인 이유:
// - useTheme() 훅이 클라이언트 상태(localStorage + system 감지) 를 다룸
// - 클릭 핸들러로 setTheme 호출
//
// hydration 안전 패턴:
// - 서버 렌더에선 theme 이 undefined → 마운트 전까지는 *불투명한 placeholder*만 그림
// - 마운트 후 실제 아이콘 렌더. 이렇게 안 하면 SSR HTML 과 클라 첫 렌더가 어긋나
//   React hydration mismatch 경고가 뜸.
"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 마운트 전: 같은 크기의 빈 박스 (레이아웃 점프 방지).
  // aria-hidden 으로 스크린리더에도 노출 안 함.
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="h-9 w-9 rounded-md border border-zinc-200 dark:border-zinc-800"
      />
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {isDark ? (
        // Sun 아이콘 — 다크일 때 보임 (클릭하면 라이트로)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // Moon 아이콘 — 라이트일 때 보임 (클릭하면 다크로)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  )
}
