// /seller/bookings — 셀러가 받은 예약 목록 (Day 13 — A-2)
//
// buyer /bookings 의 *대칭형* — 같은 데이터를 받은 사람 시각에서.
// 정렬은 status 우선(pending 위) — 셀러가 *행동 필요* 건을 먼저 보게.
// 액션(수락/거절)은 *읽기 전용 단계*라 제외 — Day 14+에서 Server Action으로.
//
// TODO(Day 14+): STATUS_LABEL, formatBookingDatetime 을 lib/booking.ts 등 공통 모듈로 추출.
// 지금은 buyer /bookings 와 동일 객체를 복붙 — 셀러 시각에서 라벨 텍스트가 진화할 여지 보존.

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"

// status → 한국어 라벨 + 색
const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  pending: { text: "확인 대기", className: "bg-zinc-100 text-zinc-700" },
  confirmed: { text: "확정됨", className: "bg-emerald-100 text-emerald-700" },
  completed: { text: "완료", className: "bg-zinc-100 text-zinc-500" },
  cancelled: { text: "취소됨", className: "bg-red-100 text-red-700" },
}

// 셀러 행동 우선순위 — pending 위, cancelled 아래
const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  completed: 2,
  cancelled: 3,
}

function formatBookingDatetime(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export default async function SellerBookingsPage() {
  const sellerProfile = await requireSellerProfile("/seller/bookings")

  // createdAt desc로 가져온 뒤 코드에서 status 우선 정렬.
  // Prisma orderBy로 status enum 정렬은 raw SQL 필요 — 학습 단계엔 코드 sort가 친숙.
  const bookings = await prisma.booking.findMany({
    where: { sellerProfileId: sellerProfile.id },
    include: {
      service: {
        select: {
          id: true,
          title: true,
          category: true,
          durationMinutes: true,
          price: true,
        },
      },
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  // [...bookings].sort(...) — 원본 mutate 안 하려고 복사 (findMany 결과라 지금은 영향 없지만 습관).
  // 같은 status 안에선 createdAt desc 유지 (Array.prototype.sort는 stable).
  const sorted = [...bookings].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
  )

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">받은 예약</h1>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-zinc-600">아직 받은 예약이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((b) => {
            const status =
              STATUS_LABEL[b.status] ?? {
                text: b.status,
                className: "bg-zinc-100 text-zinc-700",
              }
            return (
              <li
                key={b.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {b.service.category}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {b.service.title}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      from {b.buyer.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>

                <div className="mt-4 space-y-1 border-t border-zinc-100 pt-4 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">희망 일시</span>
                    <span>{formatBookingDatetime(b.preferredDatetime)}</span>
                  </div>
                  {b.confirmedDatetime && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-zinc-600">확정 일시</span>
                      <span>{formatBookingDatetime(b.confirmedDatetime)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">소요</span>
                    <span>{formatDuration(b.service.durationMinutes)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-zinc-600">예상 금액</span>
                    <span className="font-semibold">
                      ₩{b.service.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {b.buyerMemo && (
                  <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">
                    {b.buyerMemo}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
