// /signup — 회원가입 페이지 (Day 11 재구성)
//
// Server Component로 전환: searchParams에서 from 추출 → Client 자식에 props.

import SignupForm from "./SignupForm"

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">회원가입</h1>
      <SignupForm from={from} />
    </main>
  )
}
