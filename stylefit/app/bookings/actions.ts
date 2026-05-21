// /bookings Server Actions (Day 22)
//
// buyer 의 *예약 취소*. Day 21 seller reject 의 *대칭 액션*.
//
// 액션:
//   1. verifySession — buyer 본인 (셀러와 달리 SellerProfile 검증 X. 일반 user)
//   2. bookingId 안전 변환
//   3. $transaction interactive callback — *분기 의존성* (Day 20/21 패턴 재사용)
//      - findFirst 로 *본인 buyer + pending* 검증
//      - updateMany 의 where 에 status: pending 한 번 더 (race-safe + 정책 표현)
//   4. revalidatePath — buyer 측 + 셀러 측 (셀러가 *내 예약 취소* 를 알아야)
//
// 활동 이력 *없음* — buyer 행동은 SellerActivityLog 에 안 들어감 (Day 20 도메인 분리 정신).
// 셀러는 /seller/bookings 에서 *cancelled + cancellationReason* 박스로 자연 인지.
//
// 사유는 *Booking 컬럼 cancellationReason* — Day 21 의 rejectionReason 과 *위치로 자동 구분*:
//   rejectionReason 채워짐 = 셀러 거절
//   cancellationReason 채워짐 = buyer 취소

"use server"

import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { BookingStatus } from "@prisma/client"

function extractBookingId(formData: FormData): number | null {
  const raw = formData.get("bookingId")
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function cancelBookingAction(formData: FormData) {
  const session = await verifySession()
  if (!session) {
    redirect("/login")
  }

  const bookingId = extractBookingId(formData)
  if (bookingId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return // 사유 없이는 차단 (UI required + 서버 안전망)

  await prisma.$transaction(async (tx) => {
    // buyer 본인 + pending 인 booking 만 처리.
    // *셀러가 이미 confirm 한 booking* 은 cancel 불가 (학습 단계 정책 — 미래에 *확정 후 취소* 별도 흐름).
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        buyerId: session.userId,
        status: BookingStatus.pending,
      },
      select: { id: true },
    })
    if (!booking) return // 본인 X / 이미 처리됨 / pending 아님 — 조용히 무시

    const { count } = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.pending },
      data: {
        status: BookingStatus.cancelled,
        cancellationReason: reason,
      },
    })
    if (count === 0) return // race 충돌 (셀러가 그 사이 confirm)
  })

  revalidatePath("/bookings")
  revalidatePath("/seller/bookings")
}
