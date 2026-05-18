// /login — 로그인 페이지 (Day 11 재구성)
//
// Server Component로 전환: searchParams를 *서버에서* 추출 → Client 자식에 props.
// (Day 10에서 page.tsx 자체를 Client로 두던 것보다 *idiomatic*.
//  useSearchParams를 Client에서 직접 쓰면 Next.js 16의 Suspense boundary 요구로 더 복잡해짐)
//
// 패턴: Server(searchParams 처리, 정적 마크업) + Client(폼 인터랙션)

import LoginForm from "./LoginForm"

export default async function LoginPage({
  searchParams,
}: {
  // searchParams도 Next.js 15+에서 *Promise* — await 필요
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">로그인</h1>
      <LoginForm from={from} />
    </main>
  )
}
