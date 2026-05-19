// /admin/sellers Server Actions (Day 14)
//
// /admin/services 와 동일 패턴 — Service → SellerProfile, serviceId → sellerProfileId.
// 패턴화는 *세 번째 사용처*에서 (Day 11 원칙) — 지금은 두 번째라 복붙.

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireAdmin } from "@/app/lib/dal"
import { revalidatePath } from "next/cache"

function extractSellerProfileId(formData: FormData): number | null {
  const raw = formData.get("sellerProfileId")
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// 승인 — pending/rejected → approved. approvedAt도 set, rejectionReason은 null로 정리.
export async function approveSellerAction(formData: FormData) {
  await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      verificationStatus: "approved",
      approvedAt: new Date(), // 승인 시각 기록
      rejectionReason: null,
    },
  })
  revalidatePath("/admin/sellers")
}

// 반려 — 사유 필수. 빈 사유면 조용히 무시 (UI required + 서버 안전망).
export async function rejectSellerAction(formData: FormData) {
  await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      verificationStatus: "rejected",
      rejectionReason: reason,
      // approvedAt은 유지 (과거 승인 이력 추적용) — Day 15+에 정책 재검토 가능
    },
  })
  revalidatePath("/admin/sellers")
}

// 검증 대기로 되돌리기 — 잘못 판단했거나 재검토 필요할 때.
export async function revertSellerAction(formData: FormData) {
  await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: {
      verificationStatus: "pending",
      rejectionReason: null,
      // approvedAt은 유지 (이력 추적)
    },
  })
  revalidatePath("/admin/sellers")
}
