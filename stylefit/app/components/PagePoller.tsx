// PagePoller — Server Component 페이지의 *router.refresh 폴링* (Day 30 신규, Day 31 일반화).
//
// 책임: 일정 간격으로 router.refresh() 호출 → 페이지의 모든 server fetch 재실행
//        → 새 데이터 자연 반영. *어떤 페이지든 마운트만 하면* 작동.
//
// 사용처 히스토리:
//   - Day 30: 메시지 페이지 (구매자/셀러) 2 곳 — *MessagesPoller* 이름으로 도입.
//   - Day 31: Booking 목록 (구매자/셀러) 2 곳 추가 → 총 4 곳. extraction threshold (3) 초과 →
//             *PagePoller 일반화* 로 rename. 이름이 책임을 정확히 반영.
//
// "use client" 의 의미 — *브라우저에서 실행* 가능. useEffect / 브라우저 API 접근.
//   Server Component 는 *서버에서만* 실행 → 이런 hook 못 씀.
//
// router.refresh() — Next.js App Router 의 *서버 재페치 + 클라이언트 리렌더*.
//   브라우저 새로고침 (F5) 과 다름 — *클라이언트 상태 (form 입력 등) 는 보존*.
//   페이지의 모든 server fetch 가 재실행 → revalidatePath 와 동등 효과.
//
// visibility API 최적화 (Day 31):
//   - document.visibilityState === "visible" 일 때만 폴링 진행
//   - 탭 가려지면 setInterval 정리 → 브라우저 리소스 + 서버 부하 절약
//   - 탭 돌아오면 *즉시 새로고침* + 폴링 재시작 → 가려진 사이 변경사항 즉시 동기화
//
// 남은 약점:
//   - *전체 페이지* 데이터 매번 재페치 (특정 데이터만 가져오는 endpoint 분리 안 됨)
//   - 5초 지연감 — 진짜 실시간은 SSE/WebSocket 별도 Day

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PagePoller({
  intervalMs = 5000,
}: {
  intervalMs?: number
}) {
  const router = useRouter()

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    const start = () => {
      // 중복 시작 방지 — 이미 돌고 있으면 그대로.
      if (intervalId) return
      intervalId = setInterval(() => router.refresh(), intervalMs)
    }
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // 탭 돌아옴 — 가려진 사이 변경사항 즉시 동기화 + 폴링 재시작.
        router.refresh()
        start()
      } else {
        // 탭 가려짐 — 폴링 중단 (리소스 절약).
        stop()
      }
    }

    // 초기 상태에 맞춰 시작 (페이지 마운트 시 visible 이면 즉시 시작).
    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, intervalMs])

  // 렌더 출력 없음 — 부수 효과 (폴링) 만 담당.
  return null
}
