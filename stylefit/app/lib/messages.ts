// 메시지 도메인 핵심 로직 (Day 30).
//
// Server Action 이 *권한 검증* 후 호출. 권한 검증과 비즈니스 로직 *책임 분리*:
//   - actions.ts (페이지마다 분기): 권한 — buyer 본인? seller 본인?
//   - 여기 (공유 헬퍼): thread find-or-create + message 생성 + lastMessageAt 갱신
//
// 트랜잭션 (Day 18/20/21 패턴 일관) — interactive transaction 사용:
//   $transaction(async (tx) => { ... })
//   각 step 의 결과를 다음 step 에 쓸 수 있음 (배열 형태와의 차이).
//   여기선 *upsert 결과의 thread.id* 를 message create 와 update 에서 재사용.
//
// 동시성 — relatedBookingId @unique 가 DB 레벨 race 안전 보장 (upsert 가 직렬화).
//   학습 단계의 실제 시나리오 (단일 사용자) 에선 발생 거의 없음.

import { prisma } from "@/app/lib/prisma"
import { emitMessage } from "@/app/lib/message-events"

export async function sendMessage({
  bookingId,
  senderUserId,
  content,
}: {
  bookingId: number
  senderUserId: number
  content: string
}) {
  // 2차 sanitize — UI maxLength=1000 + required 우회 대비 (Day 16 정신).
  // trim 후 빈 문자열은 silent return (form required 가 UI 1차).
  const cleanContent = content.trim().slice(0, 1000)
  if (!cleanContent) return

  // Booking 조회 — thread 생성 시 buyerId/sellerProfileId 필요.
  // 권한 검증은 호출자 (actions.ts) 가 끝낸 상태 — 여기선 *존재 확인* 만.
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { buyerId: true, sellerProfileId: true },
  })
  if (!booking) return

  await prisma.$transaction(async (tx) => {
    // thread find-or-create — relatedBookingId @unique 라 upsert 가 race 안전.
    // update: {} = 존재하면 아무것도 안 함 (lastMessageAt 는 아래에서 별도 update).
    const thread = await tx.messageThread.upsert({
      where: { relatedBookingId: bookingId },
      create: {
        buyerId: booking.buyerId,
        sellerProfileId: booking.sellerProfileId,
        relatedBookingId: bookingId,
      },
      update: {},
    })

    await tx.message.create({
      data: {
        threadId: thread.id,
        senderId: senderUserId,
        content: cleanContent,
      },
    })

    // 스레드 정렬·표시용 메타 — 모든 전송 시 동기 갱신.
    // 메시지 created 와 *원자성 보장* — race 시 thread 가 메시지 없는 상태로 보일 위험 0.
    await tx.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    })
  })

  // 트랜잭션 commit 후 emit — listener (SSE) 가 router.refresh 호출 시
  // *DB 반영 완료 상태* 라 새 메시지 정상 fetch (Day 34).
  // rollback 시엔 도달 X — listener 가 *잘못된 push* 받을 위험 0.
  emitMessage({ bookingId })
}
