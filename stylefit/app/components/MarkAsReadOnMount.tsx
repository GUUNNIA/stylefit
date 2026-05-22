// MarkAsReadOnMount — 메시지 페이지 마운트 시 *읽음 처리 Server Action* 호출 (Day 31).
//
// 왜 Client 가 필요한가:
//   Next.js 16+ 는 *Server Component render 중 mutation* (revalidatePath 등) 을 *명시적으로 차단*.
//   "revalidatePath used during render which is unsupported." (실제 에러)
//   따라서 mutation 은 *render 밖* (Server Action 또는 Route Handler) 에서만 호출 가능.
//
// 패턴:
//   Server Component 페이지가 *Server Action ref* 와 bookingId 를 props 로 전달 →
//   Client Component 가 마운트 시 useEffect 에서 호출 →
//   Server Action 안에서 권한 검증 + updateMany + revalidatePath 까지 안전 실행.

"use client"

import { useEffect } from "react"

export default function MarkAsReadOnMount({
  bookingId,
  action,
}: {
  bookingId: number
  action: (bookingId: number) => Promise<void>
}) {
  useEffect(() => {
    // 마운트 시 1회 호출. 의존성 변화 (다른 booking 페이지 이동) 시에도 재호출.
    action(bookingId)
  }, [bookingId, action])

  return null
}
