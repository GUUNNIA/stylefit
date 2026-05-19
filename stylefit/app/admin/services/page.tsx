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
import {
  approveServiceAction,
  revertServiceAction,
} from "./actions"
import RejectForm from "./RejectForm"

// URL ?status= 값 화이트리스트. 다른 값 들어오면 default "pending".
const STATUS_OPTIONS = [
  { value: "pending", label: "검증 대기" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "반려됨" },
] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  // 보호 — 비admin은 redirect (throw)
  await requireAdmin("/admin/services")

  const { status: rawStatus } = await searchParams
  // 화이트리스트 검증 — 외부 값을 *그대로 신뢰 X*
  const isValid = STATUS_OPTIONS.some((o) => o.value === rawStatus)
  const status: StatusFilter = isValid
    ? (rawStatus as StatusFilter)
    : "pending"

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

      {/* 상태 필터 탭 — URL 쿼리 기반. Link 클릭으로 페이지 전환 (Server fetch) */}
      <div className="mb-6 flex gap-1 border-b border-zinc-200">
        {STATUS_OPTIONS.map((o) => (
          <Link
            key={o.value}
            href={`/admin/services?status=${o.value}`}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              status === o.value
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {o.label} ({countByStatus[o.value] ?? 0})
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
                    <RejectForm serviceId={s.id} />
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
