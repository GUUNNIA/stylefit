// /seller/bookings — 셀러가 받은 예약 목록 (Day 13, Day 21 액션 추가)
//
// buyer /bookings 의 *대칭형* — 같은 데이터를 받은 사람 시각에서.
// 정렬은 status 우선(pending 위) — 셀러가 *행동 필요* 건을 먼저 보게.
//
// Day 21: pending 카드에 [확정] / [거절] 액션 추가. confirmBookingAction + RejectBookingForm.
// STATUS_LABEL 도 BookingStatus enum 타입으로 — Day 19 의 *Record<Enum, ...>* 패턴 일관.
// cancelled 의 *셀러 거절* vs *buyer 취소* 는 rejectionReason 유무로 간접 구분 (라벨 분기).

import Link from "next/link"
import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import PagePoller from "@/app/components/PagePoller"
import { formatDuration } from "@/app/lib/format"
import { BookingStatus } from "@prisma/client"
import {
  confirmBookingAction,
  rejectBookingAction,
  completeBookingAction,
} from "./actions"
import ReasonForm from "@/app/components/ReasonForm"
import PageTabs from "@/app/components/PageTabs"
import { SELLER_TABS } from "@/app/lib/page-tabs"
import AlertBox from "@/app/components/AlertBox"

// status → 한국어 라벨 + 색. Day 19 패턴 — enum 키화로 *모든 값 정의 보장* (?? fallback 불필요).
const STATUS_LABEL: Record<BookingStatus, { text: string; className: string }> = {
  pending: { text: "확인 대기", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  confirmed: { text: "확정됨", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  completed: { text: "완료", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  cancelled: { text: "취소됨", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

// 셀러 행동 우선순위 — pending 위, cancelled 아래
const STATUS_ORDER: Record<BookingStatus, number> = {
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
      // Day 25: 받은 후기 (1:1, 선택). completed 카드의 *받은 후기 박스* 표시.
      review: { select: { rating: true, content: true } },
      // Day 31: 안 읽은 메시지 수 — *상대방 (buyer)* 이 보낸 isRead=false 만 카운트.
      // sellerProfile.userId 기준 — seller user 가 *받은* 메시지가 안 읽은 것.
      messageThread: {
        select: {
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: sellerProfile.userId },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // [...bookings].sort(...) — 원본 mutate 안 하려고 복사 (findMany 결과라 지금은 영향 없지만 습관).
  // 같은 status 안에선 createdAt desc 유지 (Array.prototype.sort는 stable).
  // STATUS_ORDER 가 enum 화돼서 *?? fallback 불필요* (Day 21 정리).
  const sorted = [...bookings].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  )

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Day 31: 실시간 뱃지 갱신 — 안 읽은 메시지 수가 5초마다 자동 동기화. */}
      <PagePoller />

      <PageTabs items={SELLER_TABS} />
      <h1 className="mb-8 text-3xl font-bold tracking-tight">받은 예약</h1>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="text-ink-muted">아직 받은 예약이 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((b) => {
            // cancelled 의 *3 분기* 라벨 (Day 22, /bookings 와 대칭):
            //   rejectionReason 있음   → 내가 거절 (rose, 강한 부정)
            //   cancellationReason 있음 → buyer 가 취소 (amber, 주의 신호)
            //   둘 다 없음               → 기본 cancelled (red, fallback)
            // *얇은 함수 추출 안 함* — Day 19 원칙. 다음 정리 Day 에 *세 분기 함수화* 후보.
            const status =
              b.status === BookingStatus.cancelled && b.rejectionReason
                ? { text: "거절됨", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" }
                : b.status === BookingStatus.cancelled && b.cancellationReason
                  ? { text: "취소됨", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" }
                  : STATUS_LABEL[b.status]
            return (
              <li
                key={b.id}
                className="rounded-xl border border-line bg-surface p-5 text-foreground"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                      {b.service.category}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {b.service.title}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      from {b.buyer.name}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.text}
                  </span>
                </div>

                <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-muted">희망 일시</span>
                    <span>{formatBookingDatetime(b.preferredDatetime)}</span>
                  </div>
                  {b.confirmedDatetime && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-ink-muted">확정 일시</span>
                      <span>{formatBookingDatetime(b.confirmedDatetime)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-muted">소요</span>
                    <span>{formatDuration(b.service.durationMinutes)}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink-muted">예상 금액</span>
                    <span className="font-semibold">
                      ₩{b.service.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {b.buyerMemo && (
                  <p className="mt-3 rounded-md bg-surface-muted p-3 text-sm text-ink-muted">
                    {b.buyerMemo}
                  </p>
                )}

                {/* Day 28: AlertBox 추출 — buyer /bookings 와 대칭 */}
                {b.status === BookingStatus.cancelled && b.rejectionReason && (
                  <AlertBox variant="danger">
                    <strong className="font-semibold">거절 사유:</strong>{" "}
                    {b.rejectionReason}
                  </AlertBox>
                )}

                {/* buyer 취소 사유 (Day 22) — 셀러가 *왜 취소됐는지* 알아야 함 (대칭 정보) */}
                {b.status === BookingStatus.cancelled && b.cancellationReason && (
                  <AlertBox variant="warning">
                    <strong className="font-semibold">취소 사유:</strong>{" "}
                    {b.cancellationReason}
                  </AlertBox>
                )}

                {/* 받은 후기 (Day 25) — completed + review 있음. buyer 측 *내 후기* 와 대칭. */}
                {b.status === BookingStatus.completed && b.review && (
                  <AlertBox variant="success">
                    <strong className="font-semibold">받은 후기:</strong>{" "}
                    {b.review.rating}점 — {b.review.content}
                  </AlertBox>
                )}

                {/* 액션 + 메시지 (Day 30) — 모든 카드에 영역 표시.
                    좌측: 상태별 액션 (확정/거절/완료, 없으면 빈 자리)
                    우측: 메시지 링크 — *모든 상태* 에서 노출 (cancelled 도 사후 협의 가능). */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex flex-wrap gap-2">
                    {b.status === BookingStatus.pending && (
                      <>
                        <form action={confirmBookingAction}>
                          <input type="hidden" name="bookingId" value={b.id} />
                          {/* 확정 = primary (긍정 핵심 결정) */}
                          <button
                            type="submit"
                            className="rounded-lg bg-accent-bg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
                          >
                            확정
                          </button>
                        </form>
                        <ReasonForm
                          action={rejectBookingAction}
                          idName="bookingId"
                          idValue={b.id}
                          openLabel="거절하기"
                          submitLabel="거절 확정"
                          placeholder="거절 사유를 입력해 주세요. 구매자에게 표시됩니다."
                          tone="secondary"
                        />
                      </>
                    )}
                    {b.status === BookingStatus.confirmed && (
                      <form action={completeBookingAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        {/* 완료 처리 = secondary (흐름 진행 액션) */}
                        <button
                          type="submit"
                          className="rounded-lg border border-accent px-4 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
                        >
                          완료 처리
                        </button>
                      </form>
                    )}
                  </div>
                  <Link
                    href={`/seller/bookings/${b.id}/messages`}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    메시지 →
                    {/* Day 31: 안 읽은 메시지 N 뱃지 — buyer /bookings 와 대칭. */}
                    {(b.messageThread?._count.messages ?? 0) > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-bg px-1.5 text-xs font-medium text-white no-underline dark:text-zinc-900">
                        {b.messageThread!._count.messages}
                      </span>
                    )}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
