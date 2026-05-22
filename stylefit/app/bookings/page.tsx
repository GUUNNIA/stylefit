// /bookings — 내 예약 목록 (Day 11, Day 21 거절 사유 표시)
//
// 첫 *보호 페이지* — DAL의 verifySession()으로 세션 확인,
// 없으면 redirect("/login")으로 페이지 자체에 접근 차단.
//
// Day 21: 셀러 거절 사유 표시 + STATUS_LABEL 을 BookingStatus enum 타입으로 정리 (Day 19 패턴).
// cancelled + rejectionReason 있음 = 셀러가 거절 → "거절됨" 라벨 + 사유 표시.
// cancelled + rejectionReason 없음 = buyer 본인이 취소 → "취소됨" 라벨 (취소 액션은 미래 Day).

import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"
import SuccessBanner from "@/app/components/SuccessBanner"
import PagePoller from "@/app/components/PagePoller"
import { BookingStatus } from "@prisma/client"
import { cancelBookingAction } from "./actions"
import ReasonForm from "@/app/components/ReasonForm"
import ReviewForm from "./ReviewForm"
import AlertBox from "@/app/components/AlertBox"

// status → 한국어 라벨 + 색. Day 19 패턴 — enum 키화로 *모든 값 정의 보장*.
// 다크 분기: bg 는 *진한 색 + 투명도*, text 는 *옅은 톤* (대비 유지). Day 28.
const STATUS_LABEL: Record<BookingStatus, { text: string; className: string }> = {
  pending: { text: "확인 대기", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  confirmed: { text: "확정됨", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  completed: { text: "완료", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  cancelled: { text: "취소됨", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
}

function formatBookingDatetime(d: Date): string {
  // 예: "2026-05-20 14:30"
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  // searchParams는 Next.js 15+에서 Promise — await 필요
  const { success } = await searchParams

  const session = await verifySession()
  if (!session) redirect("/login")

  const bookings = await prisma.booking.findMany({
    where: { buyerId: session.userId },
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
      sellerProfile: {
        include: { user: { select: { name: true } } },
      },
      // Day 24: 내 후기 (1:1, 선택). completed booking 의 *후기 작성 여부* 분기에 사용.
      review: { select: { rating: true, content: true } },
      // Day 31: 안 읽은 메시지 수 — *상대방 (seller)* 이 보낸 isRead=false 만 카운트.
      // _count with where (filtered relation count) — Prisma 5+ 정식 기능.
      messageThread: {
        select: {
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: session.userId },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Day 31: 실시간 뱃지 갱신 — 안 읽은 메시지 수가 5초마다 자동 동기화. */}
      <PagePoller />

      {/* 예약 성공 후 redirect 시 ?success=1 → 한 번 표시. URL이 바뀌면 자연스럽게 사라짐 */}
      {success && (
        <SuccessBanner message="예약이 접수되었습니다. 셀러 확인 후 확정됩니다." />
      )}

      <h1 className="mb-8 text-3xl font-bold tracking-tight">내 예약</h1>

      {bookings.length === 0 ? (
        // 빈 상태
        <div className="rounded-xl border border-line bg-surface p-10 text-center">
          <p className="mb-4 text-ink-muted">아직 예약한 서비스가 없습니다.</p>
          <Link
            href="/services"
            className="inline-block rounded-lg bg-accent-bg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 dark:text-zinc-900"
          >
            서비스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {
            // cancelled 의 *3 분기* 라벨 (Day 22):
            //   rejectionReason 있음   → 셀러 거절 (rose, 강한 부정)
            //   cancellationReason 있음 → 내가 취소 (amber, 주의 신호)
            //   둘 다 없음               → 기본 cancelled (red, fallback)
            // *얇은 함수 추출 안 함* — Day 19 원칙 (inline ternary 가 함수 호출보다 직설).
            // 다음 정리 Day 에 *세 분기 함수화* 후보.
            const status =
              b.status === BookingStatus.cancelled && b.rejectionReason
                ? { text: "거절됨", className: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" }
                : b.status === BookingStatus.cancelled && b.cancellationReason
                  ? { text: "취소됨", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" }
                  : STATUS_LABEL[b.status]
            return (
              // Day 22: 카드 구조 변경 — *Link 안에 form 충돌 회피* 위해
              //   li 가 border + hover 가짐, Link 는 padding 만, 액션 영역은 *Link 밖*.
              //   pending 카드만 액션 영역 추가 — 그 외 상태는 단일 Link 카드.
              <li
                key={b.id}
                className="overflow-hidden rounded-xl border border-line bg-surface text-foreground transition hover:shadow-sm"
              >
                {/* ?from=/bookings → 상세 페이지의 뒤로가기가 "← 내 예약으로"로 동적 표시 */}
                <Link
                  href={`/services/${b.service.id}?from=${encodeURIComponent("/bookings")}`}
                  className="block p-5"
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
                      by {b.sellerProfile.user.name}
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

                {/* Day 28: AlertBox 추출 — bg-surface-muted + 의미색 아이콘/텍스트. 버튼(opacity surface)과 패턴 차별. */}
                {b.status === BookingStatus.cancelled && b.rejectionReason && (
                  <AlertBox variant="danger">
                    <strong className="font-semibold">거절 사유:</strong>{" "}
                    {b.rejectionReason}
                  </AlertBox>
                )}

                {/* 내 취소 사유 (Day 22) — 본인 액션 reminder (Day 21 정신) */}
                {b.status === BookingStatus.cancelled && b.cancellationReason && (
                  <AlertBox variant="warning">
                    <strong className="font-semibold">취소 사유:</strong>{" "}
                    {b.cancellationReason}
                  </AlertBox>
                )}

                {/* 내 후기 (Day 24) — completed + review 있음. *본인 액션 reminder* 패턴 일관. */}
                {b.status === BookingStatus.completed && b.review && (
                  <AlertBox variant="success">
                    <strong className="font-semibold">내 후기:</strong>{" "}
                    {b.review.rating}점 — {b.review.content}
                  </AlertBox>
                )}
                </Link>

                {/* 액션 + 메시지 (Day 30) — 모든 카드에 영역 표시.
                    좌측: 상태별 액션 (취소/후기, 없으면 빈 자리)
                    우측: 메시지 링크 — *모든 상태* 에서 노출 (cancelled 도 사후 협의 가능). */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
                  <div className="flex-1">
                    {b.status === BookingStatus.pending && (
                      <ReasonForm
                        action={cancelBookingAction}
                        idName="bookingId"
                        idValue={b.id}
                        openLabel="취소하기"
                        submitLabel="취소 확정"
                        placeholder="취소 사유를 입력해 주세요. 셀러에게 표시됩니다."
                        closeLabel="닫기"
                        tone="primary"
                      />
                    )}
                    {b.status === BookingStatus.completed && !b.review && (
                      <ReviewForm bookingId={b.id} />
                    )}
                  </div>
                  <Link
                    href={`/bookings/${b.id}/messages`}
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    메시지 →
                    {/* Day 31: 안 읽은 메시지 N 뱃지 — 카운트 > 0 일 때만 표시. */}
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
