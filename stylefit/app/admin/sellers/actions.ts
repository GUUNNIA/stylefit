// /admin/sellers Server Actions (Day 14 / Day 18 audit log)
//
// /admin/services 와 동일 패턴 — Service → SellerProfile, serviceId → sellerProfileId.
// 패턴화는 *세 번째 사용처*에서 (Day 11 원칙) — 지금은 두 번째라 복붙.
//
// Day 18: 각 액션에 $transaction 으로 AuditLog 기록 추가.
//   - sequential array — sellerProfile.update + auditLog.create 두 query 가 독립
//     (sellerProfileId 이미 알고 있어 참조 의존성 없음 → interactive callback 오버스펙)
//   - 둘 다 성공해야 commit. 한쪽 실패 시 *둘 다 rollback* — 액션은 했는데 로그 안 남는 사고 방지

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireAdmin } from "@/app/lib/dal"
import { revalidatePath } from "next/cache"
import {
  SellerVerificationStatus,
  AuditAction,
  AuditTargetType,
} from "@prisma/client"

function extractSellerProfileId(formData: FormData): number | null {
  const raw = formData.get("sellerProfileId")
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// 승인 — pending/rejected → approved. approvedAt도 set, rejectionReason은 null로 정리.
export async function approveSellerAction(formData: FormData) {
  const admin = await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        verificationStatus: SellerVerificationStatus.approved,
        approvedAt: new Date(), // 승인 시각 기록
        rejectionReason: null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: AuditAction.approved,
        targetType: AuditTargetType.Seller,
        targetId: sellerProfileId,
        // approved 는 추가 컨텍스트 없음 → metadata null
      },
    }),
  ])
  revalidatePath("/admin/sellers")
}

// 반려 — 사유 필수. 빈 사유면 조용히 무시 (UI required + 서버 안전망).
export async function rejectSellerAction(formData: FormData) {
  const admin = await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return

  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        verificationStatus: SellerVerificationStatus.rejected,
        rejectionReason: reason,
        // approvedAt은 유지 (과거 승인 이력 추적용) — Day 15+에 정책 재검토 가능
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: AuditAction.rejected,
        targetType: AuditTargetType.Seller,
        targetId: sellerProfileId,
        metadata: { rejectionReason: reason }, // 사유는 metadata 에만 — sellerProfile 컬럼은 현재 상태, 로그는 이력
      },
    }),
  ])
  revalidatePath("/admin/sellers")
}

// 검증 대기로 되돌리기 — 잘못 판단했거나 재검토 필요할 때.
export async function revertSellerAction(formData: FormData) {
  const admin = await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        verificationStatus: SellerVerificationStatus.pending,
        rejectionReason: null,
        // approvedAt은 유지 (이력 추적)
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: AuditAction.reverted,
        targetType: AuditTargetType.Seller,
        targetId: sellerProfileId,
        // reverted 도 metadata 없음 — 이전 상태는 *이전 audit log entry* 조회로 알 수 있음
      },
    }),
  ])
  revalidatePath("/admin/sellers")
}
