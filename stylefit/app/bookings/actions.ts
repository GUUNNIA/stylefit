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

// 후기 작성 (Day 24) — completed booking 에만 가능. buyer 본인 + review 없음 조건.
//   - $transaction 안 씀 — *단일 create*. 분기 의존성 없음.
//   - 본인 격리 + status: completed + review null 조건 = 한 findFirst 로 확인.
//   - bookingId @unique 가 *중복 review FK 차단* — 명시 findFirst 검증으로 *UX 명확* (조용히 무시).
//   - Review 모델 활성화 (Day 13 부터 시드만, 액션 없었음).
export async function createReviewAction(formData: FormData) {
  const session = await verifySession()
  if (!session) {
    redirect("/login")
  }

  const bookingId = extractBookingId(formData)
  if (bookingId === null) return

  // rating 안전 변환 — 1~5 정수만
  const rating = Number(formData.get("rating"))
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return

  const content = ((formData.get("content") as string | null) ?? "").trim()
  if (content.length < 1) return // 내용 없이는 차단 (UI required + 서버 안전망)

  // booking 검증 — buyer 본인 + completed + review 없음 (review: null = 1:1 관계 필터)
  // sellerProfileId 비정규화 위해 read — Review 모델의 비정규화 컬럼 채움.
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      buyerId: session.userId,
      status: BookingStatus.completed,
      review: null,
    },
    select: { id: true, sellerProfileId: true },
  })
  if (!booking) return // 조건 안 맞음 — 조용히 무시

  await prisma.review.create({
    data: {
      bookingId: booking.id,
      buyerId: session.userId,
      sellerProfileId: booking.sellerProfileId,
      rating,
      content,
    },
  })

  revalidatePath("/bookings")
  // 셀러 측 / service 상세 페이지 후기 노출은 *미래 Day* — 학습 범위 관리
}
