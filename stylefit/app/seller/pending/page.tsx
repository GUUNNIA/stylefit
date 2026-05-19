// /seller/pending — 셀러 등록 상태 안내 페이지 (Day 14)
//
// requireSellerProfile에서 *pending/rejected 셀러*를 이리로 redirect.
// 자체 보호 — requireSellerProfile 사용 X (무한 루프 방지). verifySession + 직접 분기.
//
// 분기:
//   - 비로그인 → /login
//   - SellerProfile 없음 (구매자만) → /services (혹시 우연히 도달했을 때)
//   - approved → /seller/services (이미 검증 완료, 안내 보일 필요 X)
//   - pending → 노란 안내 박스
//   - rejected → 빨간 안내 박스 + 사유

import { redirect } from "next/navigation"
import { verifySession } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"

export default async function SellerPendingPage() {
  const session = await verifySession()
  if (!session) {
    redirect("/login?from=/seller/pending")
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.userId },
  })

  // SellerProfile 없으면 → 구매자 페이지로 (안내 보일 필요 X)
  if (!profile) {
    redirect("/services")
  }

  // 이미 approved면 → 셀러 페이지로 (안내 보일 필요 X)
  if (profile.verificationStatus === "approved") {
    redirect("/seller/services")
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        셀러 등록 상태
      </h1>

      {profile.verificationStatus === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="text-lg font-semibold">심사 중입니다.</p>
          <p className="mt-2 text-sm">
            운영자가 셀러 정보를 검토하고 있습니다. 승인되면 셀러 페이지에 접근할 수 있어요.
          </p>
          <p className="mt-2 text-xs text-amber-700">
            ※ 학습용 프로젝트 — 실제 이메일 알림은 추후 도입 예정.
          </p>
        </div>
      )}

      {profile.verificationStatus === "rejected" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <p className="text-lg font-semibold">셀러 등록이 반려되었습니다.</p>
          {profile.rejectionReason && (
            <div className="mt-3 rounded-md bg-white p-3 text-sm text-rose-800">
              <strong className="font-semibold">사유:</strong>{" "}
              {profile.rejectionReason}
            </div>
          )}
          <p className="mt-3 text-sm">
            반려 사유를 확인하시고 추후 셀러 정보 수정·재제출 기능을 통해 다시 신청해 주세요.
          </p>
          <p className="mt-2 text-xs text-rose-700">
            ※ 셀러 정보 수정·재제출은 Day 15+에 도입 예정.
          </p>
        </div>
      )}
    </main>
  )
}
