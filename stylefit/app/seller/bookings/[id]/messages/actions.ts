// /seller/bookings/[id]/messages — 셀러 메시지 Server Action (Day 30).
//
// 구매자 actions.ts 의 *대칭형* — 권한만 다름:
//   - 구매자: booking.buyerId === session.userId
//   - 셀러:   booking.sellerProfileId === sellerProfile.id
//
// 본체 (sendMessage) 는 공유 — Day 30 책임 분리 정신.
// 두 사용처라 *추출 임계 미도달* 이지만 *비즈니스 로직 동일 + 트랜잭션 일관성* 위험 때문에
// 처음부터 헬퍼 추출. extraction threshold 는 *비즈니스 로직 자체* 의 기준.

"use server"

import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { sendMessage } from "@/app/lib/messages"

export async function sendMessageAction(formData: FormData) {
  // 셀러 자격 자체는 dal 이 보장. returnUrl 은 *목록* 으로 — 메시지 페이지 자체는 권한 차단된 상태에서 의미 없음.
  const sellerProfile = await requireSellerProfile("/seller/bookings")

  const bookingId = Number(formData.get("bookingId"))
  const content = String(formData.get("content") ?? "")

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { sellerProfileId: true },
  })
  if (!booking || booking.sellerProfileId !== sellerProfile.id) notFound()

  await sendMessage({
    bookingId,
    senderUserId: sellerProfile.userId,
    content,
  })

  revalidatePath(`/seller/bookings/${bookingId}/messages`)
}

// Day 31 — 메시지 페이지 마운트 시 *상대방 (buyer)* 메시지 읽음 처리.
// buyer actions 의 대칭형 — sellerProfile.userId 기준. /seller/bookings 목록 캐시 무효화.
export async function markAsReadAction(bookingId: number) {
  const sellerProfile = await requireSellerProfile("/seller/bookings")

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      sellerProfileId: true,
      messageThread: { select: { id: true } },
    },
  })
  if (!booking || booking.sellerProfileId !== sellerProfile.id) return
  if (!booking.messageThread) return

  const result = await prisma.message.updateMany({
    where: {
      threadId: booking.messageThread.id,
      senderId: { not: sellerProfile.userId },
      isRead: false,
    },
    data: { isRead: true },
  })

  if (result.count > 0) {
    revalidatePath("/seller/bookings")
  }
}
