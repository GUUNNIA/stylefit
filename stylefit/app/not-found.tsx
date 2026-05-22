// Root not-found UI — Next.js App Router 규약 파일.
//
// 어떤 페이지든 notFound() 가 호출되면 *가장 가까운* not-found.tsx 가 렌더됨.
// 라우트별 별도 not-found.tsx 없으면 이 root 파일이 fallback.
//
// 학습 포인트: dev 모드에서 not-found.tsx 가 없으면 *빈 화면* 으로 떨어짐.
// notFound() 자체는 작동(터미널 404 로그)하지만 UI 가 없을 뿐 — 둘은 별개.
//
// 시각 톤: Day 28 토큰화 — bg-surface 로 다크 분기 자동 적용. 라이트=흰 카드, 다크=zinc-900 카드.

import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-20">
      <div className="rounded-xl border border-line bg-surface p-10 text-center text-foreground">
        {/* 큰 "404" — 옅은 잉크로 시각 위계 약화 (메시지 위에 보조 정보) */}
        <p className="text-6xl font-bold tracking-tight text-ink-subtle/50">404</p>
        <h1 className="mt-4 text-xl font-semibold">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-ink-subtle">
          주소가 잘못되었거나, 접근 권한이 없을 수 있습니다.
        </p>
        <Link
          href="/services"
          className="mt-8 inline-block rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
        >
          서비스 둘러보기
        </Link>
      </div>
    </main>
  )
}
