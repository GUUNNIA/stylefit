// MessageThread — Booking 종속 메시지 스레드 UI (Day 30).
//
// 카톡식 말풍선 + 입력 폼. Server Component — form action 으로 Server Action 호출.
//
// 설계 결정:
//   - 말풍선 분기: senderId === currentUserId 면 *내 메시지* (오른쪽 + accent),
//     아니면 *상대 메시지* (왼쪽 + surface-muted, 이름 라벨 위에).
//   - threadId 는 *없을 수 있음* — 첫 메시지 보낼 때 server action 이 생성.
//     컴포넌트는 *bookingId* 만 받음 → action 안에서 thread find-or-create.
//   - input type="text" (textarea 아님) — form 안 single text input 의 표준 동작으로
//     *Enter 키 = 자동 submit*. 카톡식 UX 자연 완성, Client Component 없이 가능.
//     멀티라인 입력은 *학습 단계엔 거절* (UX 단순화). 필요해지면 textarea 로 진화.
//   - 자동 스크롤 다운은 여전히 Client 필요 → Day 31+ 진화 후보.
//   - input value reset 은 Next.js 15+ form action 의 *자동 동작* (defaultValue 없으면).
//
// 시간 표시 — HH:MM 만 (학습 단계). 날짜 분리 / "어제" 같은 친절은 추후 진화.

type MessageWithSender = {
  id: number
  senderId: number
  content: string
  createdAt: Date
  sender: { name: string }
}

export default function MessageThread({
  bookingId,
  messages,
  currentUserId,
  action,
}: {
  bookingId: number
  messages: MessageWithSender[]
  currentUserId: number
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* 메시지 목록 — 오래된 위, 최신 아래 (카톡식). 자연 스크롤. */}
      <div className="min-h-[200px] space-y-3 rounded-xl border border-line bg-surface p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            아직 메시지가 없어요. 첫 메시지를 보내보세요.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUserId
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {/* 상대 메시지일 때만 이름 라벨 — 내 거는 자명 */}
                {!isMine && (
                  <p className="mb-1 text-xs text-ink-muted">{m.sender.name}</p>
                )}
                {/* 위계 (Day 30 디자인 결정): *액션 vs 메시지* 강도 분리.
                    - 전송 버튼 (primary 액션) = 채움 인디고 (bg-accent-bg)
                    - 내 메시지 (말 자체, 액션 아님) = 옅은 인디고 알파 (bg-accent/15)
                    - 상대 메시지 = 중성 회색 (bg-surface-muted)
                    내/상대는 *색조 차이* (인디고 vs 회색), 메시지/액션은 *강도 차이* (알파 vs 채움). */}
                <div
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${
                    isMine
                      ? "bg-accent/15 text-foreground"
                      : "bg-surface-muted text-foreground"
                  }`}
                >
                  {m.content}
                </div>
                <p className="mt-1 text-[10px] text-ink-subtle">
                  {formatTime(m.createdAt)}
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* 입력 폼 — 단일 라인 input + 우측 수직 중앙 버튼.
          input (textarea 아님) 의 *bonus*: form 안 single text input 의 표준 동작으로
          *Enter 키 = 자동 submit*. 카톡식 UX 자연 완성.
          maxLength=1000 — UI 1차 방어. 백엔드 slice 는 server action 에서 2차. */}
      <form action={action} className="relative">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input
          type="text"
          name="content"
          required
          maxLength={1000}
          placeholder="메시지를 입력하세요..."
          className="w-full rounded-lg border border-line bg-surface py-5 pl-3 pr-24 text-sm text-foreground outline-none focus:border-ink-subtle"
        />
        <button
          type="submit"
          className="absolute right-5 top-1/2 flex h-[34px] -translate-y-1/2 items-center rounded-md bg-accent-bg px-5 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
        >
          전송
        </button>
      </form>
    </div>
  )
}

// HH:MM 만. 한 군데서만 쓰니 inline. 두 번째 사용처 도달 시 lib/format 으로.
function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${hh}:${min}`
}
