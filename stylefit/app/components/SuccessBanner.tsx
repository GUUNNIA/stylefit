// 성공 알림 배너 (Day 11)
//
// 재사용 컴포넌트 — 페이지마다 다른 메시지를 props로.
// Server Component(JS 무관, 새로고침 시에도 그대로). 사용자가 다른 페이지로 이동하면 자연스럽게 사라짐.

export default function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
    </div>
  )
}
