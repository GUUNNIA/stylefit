// 메시지 SSE Route Handler (Day 34).
//
// 한 endpoint 가 buyer + seller 양쪽 — 권한은 OR 절로 *bookingId 의 buyer 본인
// 또는 seller 본인* 검증. 페이지 경로 (app/bookings/[id]/messages/) 와 대칭.
//
// SSE 응답 — ReadableStream + text/event-stream.
//   - 초기 `connected` 이벤트: client 확인 + proxy keepalive
//   - emitMessage 발생 시: data 이벤트로 push
//   - client disconnect (req.signal abort) 시: listener off + controller close
//
// 형식 — Server-Sent Events 표준:
//   data: <JSON>\n\n  (한 이벤트는 \n\n 으로 종료)
//   event: <name>\ndata: <value>\n\n  (이름 있는 이벤트)

import { NextRequest } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { messageEvents, type MessageEvent } from "@/app/lib/message-events"

const encoder = new TextEncoder()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession()
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const bookingId = Number(id)

  // 권한 — buyer 본인 OR seller 본인. NaN bookingId 도 매칭 실패로 자연 처리.
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { buyerId: session.userId },
        { sellerProfile: { userId: session.userId } },
      ],
    },
    select: { id: true },
  })
  if (!booking) return new Response("Not Found", { status: 404 })

  const channel = `message:${bookingId}`

  const stream = new ReadableStream({
    start(controller) {
      // 초기 connected — client 확인 + proxy keepalive 시작
      controller.enqueue(encoder.encode("event: connected\ndata: ok\n\n"))

      const onMessage = (event: MessageEvent) => {
        const payload = JSON.stringify(event)
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`))
      }
      messageEvents.on(channel, onMessage)

      // client disconnect — listener off + controller close
      req.signal.addEventListener("abort", () => {
        messageEvents.off(channel, onMessage)
        controller.close()
      })
    },
    cancel() {
      // consumer 가 명시 cancel — listener 정리는 abort 핸들러가 이미 함
      // (Next.js 가 disconnect 시 abort + cancel 둘 다 호출 가능)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
