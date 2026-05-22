// /bookings/[id]/messages — 구매자 메시지 페이지 (Day 30).
//
// Booking 종속 — bookingId 로 진입, *권한 + 존재* 를 한 쿼리에 결합 (findFirst with buyerId).
// findUnique 는 단일 PK 만 가능하지만 findFirst 는 *조건 매칭* 으로 권한 필터를 DB 단에 위임.
//
// 데이터 흐름:
//   1. 세션 확인 → 비로그인 redirect
//   2. Booking + relation deep include (service / sellerProfile.user / messageThread.messages.sender)
//      - thread 가 null 일 수 있음 (첫 메시지 전 상태) — messages = [] fallback
//   3. MessageThread 컴포넌트에 messages + currentUserId + bookingId + action 전달

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import MessageThread from "@/app/components/MessageThread"
import MessageStream from "@/app/components/MessageStream"
import MarkAsReadOnMount from "@/app/components/MarkAsReadOnMount"
import { sendMessageAction, markAsReadAction } from "./actions"

export default async function BuyerMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bookingId = Number(id)

  const session = await verifySession()
  if (!session) redirect("/login")

  // 권한 + 존재 결합 — NaN bookingId 도 매칭 실패로 자연 처리.
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, buyerId: session.userId },
    include: {
      service: { select: { title: true, category: true } },
      sellerProfile: {
        include: { user: { select: { name: true } } },
      },
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

  // 읽음 처리는 *Server Component render 중* 못 함 (Next.js 16+ 차단).
  // → MarkAsReadOnMount 가 Client 측 useEffect 에서 markAsReadAction 호출.

  const messages = booking.messageThread?.messages ?? []

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/bookings"
        className="mb-6 inline-block text-sm text-ink-muted hover:text-foreground"
      >
        ← 내 예약으로
      </Link>

      {/* Booking 요약 — 어떤 예약의 메시지인지 항상 보이게 */}
      <div className="mb-6 rounded-xl border border-line bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          {booking.service.category}
        </p>
        <p className="mt-1 text-lg font-semibold">{booking.service.title}</p>
        <p className="mt-1 text-sm text-ink-muted">
          with {booking.sellerProfile.user.name}
        </p>
      </div>

      <h1 className="mb-4 text-2xl font-bold tracking-tight">메시지</h1>

      <MessageStream bookingId={booking.id} />
      <MarkAsReadOnMount bookingId={booking.id} action={markAsReadAction} />
      <MessageThread
        bookingId={booking.id}
        messages={messages}
        currentUserId={session.userId}
        action={sendMessageAction}
      />
    </main>
  )
}
