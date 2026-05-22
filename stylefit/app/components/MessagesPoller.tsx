// MessagesPoller — 메시지 페이지 폴링 (Day 30).
//
// *Client Component 첫 도입*. Server Component 본체 (MessageThread) 와 책임 분리:
//   - MessageThread (server): UI 본체, form action 으로 메시지 전송
//   - MessagesPoller (client): 일정 간격으로 router.refresh() → 페이지 server 재실행
//                              → 새 메시지 자연 반영
//
// "use client" 의 의미 — *브라우저에서 실행* 가능. useEffect / useState / 브라우저 API 접근.
//   Server Component 는 *서버에서만* 실행 → 이런 hook 못 씀.
//
// router.refresh() — Next.js App Router 의 *서버 재페치 + 클라이언트 리렌더*.
//   브라우저 새로고침 (F5) 과 다름 — *클라이언트 상태 (form 입력 등) 는 보존*.
//   페이지의 모든 server fetch 가 재실행 → revalidatePath 와 동등 효과.
//
// 약점 (의도된):
//   - 탭 가려져도 폴링 지속 (visibility API 미사용)
//   - *전체 페이지* 데이터 매번 재페치 (메시지만 가져오는 endpoint 분리 안 됨)
//   - 5초 지연감 — 카톡식 즉시감 100% 는 아님. 3초로 조정 가능 (intervalMs props)

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MessagesPoller({
  intervalMs = 5000,
}: {
  intervalMs?: number
}) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, intervalMs)
    // unmount 시 cleanup — 페이지 이동 후에도 setInterval 살아있는 누수 방지.
    return () => clearInterval(id)
  }, [router, intervalMs])

  // 렌더 출력 없음 — 부수 효과 (폴링) 만 담당.
  return null
}
