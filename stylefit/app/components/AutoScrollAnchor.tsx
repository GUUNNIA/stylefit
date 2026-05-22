// AutoScrollAnchor — 메시지 목록 마지막에 두는 *스크롤 닻* (Day 31).
//
// 카톡식 자동 스크롤 다운:
//   - 메시지 목록의 *마지막* 위치에 빈 div ref
//   - trigger props 변경 시 (메시지 수 변경 또는 마지막 메시지 id 변경)
//     useEffect 가 scrollIntoView 호출 → 페이지가 자동으로 *맨 아래로*
//
// Server Component (MessageThread) 가 messages 를 다시 fetch 하고 *리렌더*하면
//   Client 자식 (AutoScrollAnchor) 도 *trigger props 변경* 으로 반응 → 스크롤 발동.
//
// 학습 포인트 — *DOM 접근* 이 필요한 부수효과: useRef + scrollIntoView.
//   Day 30 의 MessagesPoller (setInterval + router.refresh) 가 *데이터 부수효과* 였다면
//   여기는 *DOM 부수효과*. 둘 다 Server Component 로는 못 함 → Client 가 필요한 이유.

"use client"

import { useEffect, useRef } from "react"

export default function AutoScrollAnchor({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // smooth — 부드러운 애니메이션 (즉시 점프 X).
    // block: "end" — anchor 가 *뷰포트 하단* 에 오도록 정렬 (자연 메시지 흐름).
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [trigger])

  return <div ref={ref} />
}
