// /seller/bookings/[id]/messages — 셀러 메시지 페이지 (Day 30).
//
// 구매자 페이지의 *대칭형* — 권한 매칭이 sellerProfileId 로 다름.
// 상대방 표시도 buyer.name (구매자 측은 seller.user.name).

import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import MessageThread from "@/app/components/MessageThread"
import MessagesPoller from "@/app/components/MessagesPoller"
import { sendMessageAction } from "./actions"

export default async function SellerMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bookingId = Number(id)

  // returnUrl 은 *목록* — 메시지 페이지 자체는 권한 차단 상태에서 의미 없음.
  const sellerProfile = await requireSellerProfile("/seller/bookings")

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, sellerProfileId: sellerProfile.id },
    include: {
      service: { select: { title: true, category: true } },
      buyer: { select: { name: true } },
      messageThread: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { name: true } } },
          },
        },
      },
    },
  })
  if (!booking) notFound()

  const messages = booking.messageThread?.messages ?? []

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/seller/bookings"
        className="mb-6 inline-block text-sm text-ink-muted hover:text-foreground"
      >
        ← 받은 예약으로
      </Link>

      <div className="mb-6 rounded-xl border border-line bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {booking.service.category}
        </p>
        <p className="mt-1 text-lg font-semibold">{booking.service.title}</p>
        <p className="mt-1 text-sm text-ink-muted">
          from {booking.buyer.name}
        </p>
      </div>

      <h1 className="mb-4 text-2xl font-bold tracking-tight">메시지</h1>

      <MessagesPoller />
      <MessageThread
        bookingId={booking.id}
        messages={messages}
        currentUserId={sellerProfile.userId}
        action={sendMessageAction}
      />
    </main>
  )
}
