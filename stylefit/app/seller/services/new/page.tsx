// /seller/services/new — 서비스 등록 페이지 (Day 13 — B 단계)
//
// Server Component: 보호만 담당.
// 폼 자체는 Client Component (CreateServiceForm) — useActionState 때문.
// 보호와 UI 분리 패턴 — Day 10 /login 페이지와 동일.

import { requireSellerProfile } from "@/app/lib/dal"
import CreateServiceForm from "./CreateServiceForm"

export default async function NewServicePage() {
  // 보호 — 비로그인/구매자/미승인 셀러 모두 차단 (redirect throw)
  await requireSellerProfile("/seller/services/new")

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">새 서비스 등록</h1>
      <CreateServiceForm />
    </main>
  )
}
