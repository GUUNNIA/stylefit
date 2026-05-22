// 메시지 SSE 클라이언트 (Day 34).
//
// PagePoller (Day 31, router.refresh interval) 의 *메시지 페이지 한정 대체*.
// 같은 트리거 (`router.refresh()`) 지만 *interval → push* 진화.
//
// EventSource API — HTTP 기반 server-sent events.
//   - 자동 재연결 (default 5초) — `onerror` 추가 동작 불필요
//   - 명시 종료 `close()` 후엔 재연결 X (unmount cleanup 에 사용)
//   - text/event-stream 응답 자동 파싱
//
// router.refresh() — Day 30 PagePoller 와 동일 패턴.
//   서버 fetch 재실행 + 클라이언트 상태 보존 (form 입력 등).
//
// 진화 경로 (필요 시):
//   - visibility API 통합: hidden 시 close, visible 시 reconnect + catch-up
//   - 일반화 (PageStream 등): 3 사용처 도달 시 추출 (Day 19 정신)
//   - payload 활용: 현재 bookingId 만 받아 router.refresh, 미래 부분 patch 가능

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MessageStream({ bookingId }: { bookingId: number }) {
  const router = useRouter()

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/bookings/${bookingId}/messages/stream`
    )

    eventSource.onmessage = () => {
      // 메시지 push 도착 — server fetch 재실행 → 새 메시지 자연 반영
      router.refresh()
    }

    // 자동 재연결 신뢰 — onerror 명시 처리 X.
    // 진짜 끊김은 cleanup 의 close() 가 담당.

    return () => {
      eventSource.close()
    }
  }, [bookingId, router])

  return null
}
