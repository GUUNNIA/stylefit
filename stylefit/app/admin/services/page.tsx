// /admin/services — 운영자 서비스 검증 화면 (Day 14)
//
// URL 쿼리(?status=)로 상태 필터링 — 한 화면 안에서 pending/approved/rejected 전환.
// 기본값 = pending (검증 대기가 *행동 유도* 화면이라).
// URL에 상태 박혀서 *북마크·공유* 가능 (CS 케어).
//
// 액션 분기:
//   - pending → 승인 / 반려
//   - approved/rejected → 검증 대기로 되돌리기 (P1: 번복 허용)

import Link from "next/link"
import { requireAdmin } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import { formatDuration } from "@/app/lib/format"
import { ServiceVerificationStatus } from "@prisma/client"
import { buildUrl, validateEnumParam } from "@/app/lib/url-filter"
import {
  approveServiceAction,
  rejectServiceAction,
  revertServiceAction,
} from "./actions"
import ReasonForm from "@/app/components/ReasonForm"

// 라벨 매핑 (Day 19 정리 — Day 18 ACTION_LABEL 패턴 일관).
// Day 17 의 ServiceVerificationStatus enum 활용 → 값은 enum, 라벨은 별 Record.
const STATUS_LABEL: Record<ServiceVerificationStatus, string> = {
  pending: "검증 대기",
  approved: "승인됨",
  rejected: "반려됨",
}

// 탭 map 용 + validateEnumParam 화이트리스트. Object.values 는 unknown[] 추론이라 명시 타입.
const STATUS_VALUES: readonly ServiceVerificationStatus[] = Object.values(
  ServiceVerificationStatus
)

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // 보호 — 비admin은 redirect (throw)
  await requireAdmin("/admin/services")

  const { status: rawStatus } = await searchParams
  // 화이트리스트 검증 — 외부 값을 *그대로 신뢰 X*. 잘못된 값이면 default "pending".
  const status =
    validateEnumParam(rawStatus, STATUS_VALUES) ?? ServiceVerificationStatus.pending

  // 필터된 목록 + 탭 카운트 동시 페치 (병렬)
  const [services, counts] = await Promise.all([
    prisma.service.findMany({
      where: { verificationStatus: status },
      include: {
        sellerProfile: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.service.groupBy({
      by: ["verificationStatus"],
      _count: true,
    }),
  ])

  // groupBy 결과를 *상태→카운트* 매핑으로 정리
  const countByStatus: Record<string, number> = Object.fromEntries(
    counts.map((c) => [c.verificationStatus, c._count])
  )

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">서비스 검증</h1>

      {/* 상태 필터 탭 — URL 쿼리 기반. Link 클릭으로 페이지 전환 (Server fetch).
          탭 스타일이라 url-filter 의 chipClass 안 씀 — 디자인 달라 *얕은 추출* 의 보존 영역. */}
      <div className="mb-6 flex gap-1 border-b border-zinc-200">
        {STATUS_VALUES.map((s) => (
          <Link
            key={s}
            href={buildUrl("/admin/services", { status: s })}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              status === s
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
          </Link>
        ))}
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-600">
          이 상태의 서비스가 없습니다.
        </div>
      ) : (
        <ul className="space-y-4">
          {services.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {s.category} ·{" "}
                    {s.serviceType === "online" ? "온라인" : "오프라인"}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    by {s.sellerProfile.user.name} ({s.sellerProfile.user.email})
                  </p>
                  <p className="mt-2 text-sm text-zinc-700">{s.description}</p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-semibold">
                    ₩{s.price.toLocaleString()}
                  </p>
                  <p className="text-zinc-500">
                    {formatDuration(s.durationMinutes)}
                  </p>
                </div>
              </div>

              {/* rejected 일 때 사유 표시 — admin 시각에서도 어떤 사유로 반려했는지 보임 */}
              {s.verificationStatus === "rejected" && s.rejectionReason && (
                <div className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                  <strong className="font-semibold">반려 사유:</strong>{" "}
                  {s.rejectionReason}
                </div>
              )}

              {/* 액션 영역 — 상태별 분기 */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
                {s.verificationStatus === "pending" && (
                  <>
                    <form action={approveServiceAction}>
                      <input type="hidden" name="serviceId" value={s.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
                      >
                        승인
                      </button>
                    </form>
                    <ReasonForm
                      action={rejectServiceAction}
                      idName="serviceId"
                      idValue={s.id}
                      openLabel="반려하기"
                      submitLabel="반려 확정"
                      placeholder="반려 사유를 입력해 주세요. 셀러에게 표시됩니다."
                      color="rose"
                    />
                  </>
                )}
                {s.verificationStatus !== "pending" && (
                  <form action={revertServiceAction}>
                    <input type="hidden" name="serviceId" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      검증 대기로 되돌리기
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
