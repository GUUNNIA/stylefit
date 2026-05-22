// /bookings/[id]/messages — 구매자 메시지 Server Action (Day 30).
//
// 책임 분리 (Day 30 결정):
//   - 여기: 권한 검증 (booking.buyerId === session.userId) + revalidatePath
//   - app/lib/messages.ts: thread find-or-create + message create + lastMessageAt 트랜잭션
//
// 권한 정책:
//   - 비로그인 → /login (Server Action 에서도 redirect)
//   - 본인 아닌 booking → notFound (404, *권한 없음* 을 *존재 안 함* 으로 가림 — 정보 노출 방지)

"use server"

import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { sendMessage } from "@/app/lib/messages"

export async function sendMessageAction(formData: FormData) {
  const session = await verifySession()
  if (!session) redirect("/login")

  const bookingId = Number(formData.get("bookingId"))
  const content = String(formData.get("content") ?? "")

  // 권한 — 본인 booking 인지 확인. NaN bookingId 도 findUnique null 로 자연 처리.
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { buyerId: true },
  })
  if (!booking || booking.buyerId !== session.userId) notFound()

  await sendMessage({
    bookingId,
    senderUserId: session.userId,
    content,
  })

  revalidatePath(`/bookings/${bookingId}/messages`)
}

// Day 31 — 메시지 페이지 마운트 시 *상대방 (seller)* 메시지 읽음 처리.
// Server Component 안에서 호출하면 Next.js 16+ 차단 → Client (MarkAsReadOnMount) 가 useEffect 에서 호출.
// 권한: 본인 booking 만. mutation 후 /bookings 목록 캐시 무효화 → 뱃지 즉시 갱신.
export async function markAsReadAction(bookingId: number) {
  const session = await verifySession()
  if (!session) return // 비로그인은 어차피 메시지 페이지 도달 X — silent return

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      buyerId: true,
      messageThread: { select: { id: true } },
    },
  })
  if (!booking || booking.buyerId !== session.userId) return
  if (!booking.messageThread) return

  const result = await prisma.message.updateMany({
    where: {
      threadId: booking.messageThread.id,
      senderId: { not: session.userId },
      isRead: false,
    },
    data: { isRead: true },
  })

  if (result.count > 0) {
    revalidatePath("/bookings")
  }
}
