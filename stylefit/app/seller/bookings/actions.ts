// /seller/bookings Server Actions (Day 21)
//
// 셀러가 받은 예약의 *확정/거절*. Day 18 audit log + Day 20 활동 이력 패턴의 *세 번째 사용처*.
//
// 두 액션 모두:
//   1. requireSellerProfile — 본인 셀러 + 승인 상태 (클라 신뢰 X)
//   2. bookingId 안전 변환 (Day 14 extractServiceId 자매)
//   3. $transaction interactive callback — *분기 + 참조 의존성 동시*:
//      - findFirst 로 *본인 + pending* booking read (보안 + serviceId/preferredDatetime 획득)
//      - updateMany 의 where 에 status: "pending" 한 번 더 (*race-safe 최후 보루*)
//      - count > 0 일 때만 log create (분기 의존)
//      - log 에 serviceId/bookingId 채울 때 read 결과 참조 (참조 의존)
//   4. revalidatePath — 셀러 목록 + buyer 측 동시
//
// reject 만 *사유 필수* — admin/services reject 패턴 그대로.
//
// updateMany 의 data 에 *컬럼 값 참조 (preferredDatetime → confirmedDatetime)* 불가능 →
//   findFirst 로 read 후 *값으로* update 가 학습 단계 단순 패턴.
//   (raw SQL `SET confirmed = preferred` 도 가능하지만 오버스펙)

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { revalidatePath } from "next/cache"
import { BookingStatus, SellerActivity } from "@prisma/client"

// 공통 — FormData 에서 bookingId 안전 추출. 잘못된 값이면 null.
function extractBookingId(formData: FormData): number | null {
  const raw = formData.get("bookingId")
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

// 확정 — pending → confirmed. confirmedDatetime = preferredDatetime (학습 단계 단순화: 시간 협상 X).
export async function confirmBookingAction(formData: FormData) {
  const sellerProfile = await requireSellerProfile("/seller/bookings")
  const bookingId = extractBookingId(formData)
  if (bookingId === null) return

  await prisma.$transaction(async (tx) => {
    // 1) 본인 + pending booking read (3 조건 동시 — *보안 + 멱등* 한 쿼리에서)
    //    select 로 *필요한 필드만* — passwordHash 등 노출 위험 0
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        sellerProfileId: sellerProfile.id,
        status: BookingStatus.pending,
      },
      select: { id: true, serviceId: true, preferredDatetime: true },
    })
    if (!booking) return // 본인 X 또는 이미 처리됨 — 조용히 무시

    // 2) update — where 에 status: pending 한 번 더 (read 후 다른 트랜잭션이 바꿨을 경우 race-safe)
    const { count } = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.pending },
      data: {
        status: BookingStatus.confirmed,
        confirmedDatetime: booking.preferredDatetime,
      },
    })
    if (count === 0) return // race 충돌 — 누가 우리보다 먼저 처리

    // 3) 활동 로그 — serviceId 는 booking 의 service, metadata 에 bookingId 보존
    await tx.sellerActivityLog.create({
      data: {
        sellerProfileId: sellerProfile.id,
        activity: SellerActivity.bookingConfirmed,
        serviceId: booking.serviceId,
        metadata: { bookingId: booking.id },
      },
    })
  })

  // 셀러 화면 + buyer 측 동시 — buyer 가 *확정됨* 라벨을 봐야 함
  revalidatePath("/seller/bookings")
  revalidatePath("/bookings")
}

// 거절 — pending → cancelled + rejectionReason. 사유 없이는 차단 (admin reject 패턴).
export async function rejectBookingAction(formData: FormData) {
  const sellerProfile = await requireSellerProfile("/seller/bookings")
  const bookingId = extractBookingId(formData)
  if (bookingId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return // 사유 없이는 거절 차단 (UI required + 서버 안전망)

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        sellerProfileId: sellerProfile.id,
        status: BookingStatus.pending,
      },
      select: { id: true, serviceId: true },
    })
    if (!booking) return

    const { count } = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.pending },
      data: {
        status: BookingStatus.cancelled,
        rejectionReason: reason,
      },
    })
    if (count === 0) return

    // 사유는 *Booking 컬럼* (현재 상태) + *log metadata* (이력 보존) 이중 — Day 14/18 패턴 그대로
    await tx.sellerActivityLog.create({
      data: {
        sellerProfileId: sellerProfile.id,
        activity: SellerActivity.bookingRejected,
        serviceId: booking.serviceId,
        metadata: { bookingId: booking.id, rejectionReason: reason },
      },
    })
  })

  revalidatePath("/seller/bookings")
  revalidatePath("/bookings")
}
