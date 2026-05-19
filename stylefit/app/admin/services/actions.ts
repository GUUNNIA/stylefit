// /admin/services Server Actions (Day 14)
//
// 세 액션 모두:
//   1. 권한 재확인 (requireAdmin) — 클라이언트 신뢰 X, 서버에서 매번 검증
//   2. serviceId 안전 변환 (Number + 정수 + 양수 검증)
//   3. prisma.service.update
//   4. revalidatePath — 화면 자동 새로고침 (Next.js 캐시 무효화)
//
// reject만 *사유 필수*. approve·revert는 사유 없음 (revert는 *이전 reject 사유 지움*).

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireAdmin } from "@/app/lib/dal"
import { revalidatePath } from "next/cache"

// 공통 — FormData에서 serviceId 안전하게 추출. 잘못된 값이면 null.
function extractServiceId(formData: FormData): number | null {
  const raw = formData.get("serviceId")
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// 승인 — pending/rejected → approved. rejectionReason은 null로 정리 (재승인 케이스).
export async function approveServiceAction(formData: FormData) {
  await requireAdmin("/admin/services")
  const serviceId = extractServiceId(formData)
  if (serviceId === null) return

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      verificationStatus: "approved",
      rejectionReason: null,
    },
  })
  revalidatePath("/admin/services")
}

// 반려 — 사유 필수 (셀러에게 표시). 빈 사유면 *조용히 무시* (UI 측 required + 서버 측 안전망).
export async function rejectServiceAction(formData: FormData) {
  await requireAdmin("/admin/services")
  const serviceId = extractServiceId(formData)
  if (serviceId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return // 사유 없이는 반려 차단

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      verificationStatus: "rejected",
      rejectionReason: reason,
    },
  })
  revalidatePath("/admin/services")
}

// 검증 대기로 되돌리기 — 잘못 판단했거나 재검토 필요할 때.
// approved/rejected → pending. rejectionReason도 지움 (다음 검증을 깨끗한 상태에서).
export async function revertServiceAction(formData: FormData) {
  await requireAdmin("/admin/services")
  const serviceId = extractServiceId(formData)
  if (serviceId === null) return

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      verificationStatus: "pending",
      rejectionReason: null,
    },
  })
  revalidatePath("/admin/services")
}
