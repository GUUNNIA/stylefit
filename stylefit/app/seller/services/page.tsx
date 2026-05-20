// /seller/services — 본인이 등록한 서비스 목록 (Day 13)
//
// 첫 셀러 보호 페이지 — requireSellerProfile()로
// 비로그인 / 구매자만 / 미승인 셀러를 모두 차단.
//
// 카드는 buyer 측 ServiceCard와 *다른 정보 우선순위*로 inline 마크업:
//   - "by ..." 셀러 표시 제거 (어차피 본인 페이지)
//   - 활성 여부 라벨 + 받은 예약 수 추가 (셀러 관점에서 중요)

import Link from "next/link"
import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { formatDuration } from "@/app/lib/format"
import { setServiceVisibilityAction } from "./actions"

// 검증 상태 라벨 (Day 13). approved는 *기본*이라 null — 라벨 안 그림.
// pending/rejected만 셀러에게 시각적으로 표시.
const VERIFICATION_LABEL: Record<
  string,
  { text: string; className: string } | null
> = {
  pending: { text: "심사 중", className: "bg-amber-100 text-amber-700" },
  rejected: { text: "반려됨", className: "bg-rose-100 text-rose-700" },
  approved: null,
}

export default async function SellerServicesPage() {
  // 보호 + SellerProfile 한 줄로 — redirect()는 throw라 아래는 NonNull
  const sellerProfile = await requireSellerProfile("/seller/services")

  // 본인 등록 서비스 + 각 예약의 status (총합 + pending 카운트 계산용)
  // include로 *bookings의 status만* 가져옴 — 학습 단계 친숙 패턴.
  // 데이터 양 많아지면 _count.where로 최적화 가능.
  const myServices = await prisma.service.findMany({
    where: { sellerProfileId: sellerProfile.id },
    include: {
      bookings: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">내 서비스</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/seller/activity-log"
            className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            활동 이력
          </Link>
          <Link
            href="/seller/services/new"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white transition-colors hover:bg-zinc-800"
          >
            + 새 서비스 등록
          </Link>
        </div>
      </div>

      {myServices.length === 0 ? (
        // 빈 상태 — B 단계에서 "새 서비스 등록" 버튼 추가 예정
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center">
          <p className="text-zinc-600">아직 등록한 서비스가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {myServices.map((s) => {
            // 이 서비스에 묶인 *대기(pending)* 예약 수 — 셀러가 확정/거절 결정해야 할 행동 유도 지표.
            // status별 상세는 A-2(/seller/bookings)에서 다룸. 여기선 시각 위계 강조용 한 숫자만.
            const pendingCount = s.bookings.filter(
              (b) => b.status === "pending"
            ).length

            // 검증 상태 라벨 (Day 13). approved면 null이라 라벨 안 그림.
            const verifLabel = VERIFICATION_LABEL[s.verificationStatus] ?? null

            return (
              <li
                key={s.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {s.category} · {s.serviceType === "online" ? "온라인" : "오프라인"}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{s.title}</p>
                  </div>
                  {/* 우상단 라벨 모음 — 검증(있을 때) + 대기 배지(있을 때) + 활성/비활성
                      *왼쪽이 더 우선순위 높은 정보*: 검증 미통과 → 행동 필요 → 상태 */}
                  <div className="flex shrink-0 items-center gap-2">
                    {verifLabel && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${verifLabel.className}`}
                      >
                        {verifLabel.text}
                      </span>
                    )}
                    {pendingCount > 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        대기 {pendingCount}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {s.isActive ? "활성" : "비활성"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 text-sm">
                  <div>
                    <p className="text-zinc-500">가격</p>
                    <p className="mt-0.5 font-semibold">
                      ₩{s.price.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">소요</p>
                    <p className="mt-0.5">{formatDuration(s.durationMinutes)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">받은 예약</p>
                    <p className="mt-0.5">{s.bookings.length}건</p>
                  </div>
                </div>

                {/* 반려 사유 박스 (Day 14) — rejected 상태일 때만 노출.
                    셀러한테 *왜 반려됐는지* 알려야 수정·재제출 행동 가능. */}
                {s.verificationStatus === "rejected" && s.rejectionReason && (
                  <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                    <strong className="font-semibold">반려 사유:</strong>{" "}
                    {s.rejectionReason}
                  </div>
                )}

                {/* 액션 바 (Day 15) — 카드 맨 아래 우측 정렬.
                    수정은 *모든 검증 상태에서 허용* (반려 셀러의 재제출 흐름 포함).
                    숨기기/노출은 isActive 의 *반대값* 을 명시 set — 토글이 아니라
                    race-safe 패턴 (actions.ts 의 설명 참고). */}
                <div className="mt-4 flex justify-end gap-2">
                  <Link
                    href={`/seller/services/${s.id}/edit`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    수정
                  </Link>
                  {/* 단일 액션·검증 없는 폼이라 Client component 없이 inline.
                      nextActive 는 *현재의 반대값* 을 hidden 으로 박아 보냄. */}
                  <form action={setServiceVisibilityAction}>
                    <input type="hidden" name="serviceId" value={s.id} />
                    <input
                      type="hidden"
                      name="nextActive"
                      value={s.isActive ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        s.isActive
                          ? "rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                          : "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white transition-colors hover:bg-zinc-800"
                      }
                    >
                      {s.isActive ? "숨기기" : "다시 노출"}
                    </button>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
