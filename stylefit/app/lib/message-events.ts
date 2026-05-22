// 메시지 SSE 의 broadcasting 허브 (Day 34).
//
// EventEmitter module-level singleton — Node.js 단일 프로세스 안에서
// *쓰기 (sendMessage)* 와 *읽기 (SSE 연결)* 사이 in-memory push 채널.
//
// 한계 — *프로세스 간 통신 X*. 운영 환경의 다중 인스턴스 (서버리스 등) 에선
// Redis Pub/Sub 같은 외부 브로커 필요. 학습 단계 단일 dev 서버는 OK.
//
// 채널 분리 — bookingId 별 채널 (`message:${bookingId}`) 로 분리.
// 한 booking 의 listener 는 *자기 이벤트만* 수신. 전체 emit 후 client 필터
// 방식 대비 효율 ↑.
//
// globalThis 캐싱 — lib/prisma.ts 와 동일 패턴.
//   - dev HMR 시 모듈 재로딩되어도 *같은 인스턴스* 재사용
//   - 두 진입점 (Route Handler / Server Action) 이 *각자 module bundle* 로
//     로드되는 Next.js 의 module graph 분리 케이스도 보호
//   - 첫 도입 시 *listener 등록은 됐는데 emit 못 받음* 증상 (Day 34 발견) 해결

import { EventEmitter } from "events"

const globalForEvents = globalThis as unknown as {
  messageEvents: EventEmitter | undefined
}

class MessageEvents extends EventEmitter {}

export const messageEvents: EventEmitter =
  globalForEvents.messageEvents ?? new MessageEvents()

if (process.env.NODE_ENV !== "production") {
  globalForEvents.messageEvents = messageEvents
}

// 기본 10 → 100 — 한 booking 페이지를 여러 탭/디바이스에서 동시 열 가능.
messageEvents.setMaxListeners(100)

export type MessageEvent = {
  bookingId: number
}

// 메시지 전송 시 호출 — 해당 booking 의 모든 SSE listener 에 push.
export function emitMessage(event: MessageEvent) {
  messageEvents.emit(`message:${event.bookingId}`, event)
}
