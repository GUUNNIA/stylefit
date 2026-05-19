// Root not-found UI — Next.js App Router 규약 파일.
//
// 어떤 페이지든 notFound() 가 호출되면 *가장 가까운* not-found.tsx 가 렌더됨.
// 라우트별 별도 not-found.tsx 없으면 이 root 파일이 fallback.
//
// 학습 포인트: dev 모드에서 not-found.tsx 가 없으면 *빈 화면* 으로 떨어짐.
// notFound() 자체는 작동(터미널 404 로그)하지만 UI 가 없을 뿐 — 둘은 별개.
//
// 시각 톤: 다른 페이지들은 내부 카드에 bg-white 가 명시돼 있어 다크모드에서도
// 카드만 라이트 톤으로 살아남음. 이 페이지도 *카드 패턴* 으로 감싸서 동일 처리.

import Link from "next/link"

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-20">
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-900">
        <p className="text-6xl font-bold tracking-tight text-zinc-300">404</p>
        <h1 className="mt-4 text-xl font-semibold">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          주소가 잘못되었거나, 접근 권한이 없을 수 있습니다.
        </p>
        <Link
          href="/services"
          className="mt-8 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
        >
          서비스 둘러보기
        </Link>
      </div>
    </main>
  )
}
