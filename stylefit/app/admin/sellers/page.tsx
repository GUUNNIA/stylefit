// /admin/sellers — 운영자 셀러 검증 화면 (Day 14)
//
// /admin/services 와 동일 패턴 — URL 쿼리 status 필터 + P1 번복 허용.
// 카드 정보는 *셀러 시각*: 이름·이메일·전문분야·소개글·인스타·포트폴리오·등록일.

import Link from "next/link"
import { requireAdmin } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import {
  approveSellerAction,
  revertSellerAction,
} from "./actions"
import RejectForm from "./RejectForm"

const STATUS_OPTIONS = [
  { value: "pending", label: "검증 대기" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "반려됨" },
] as const
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]

// "2026-05-19" 형식 (검증 영역엔 일자만 충분)
function formatDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin("/admin/sellers")

  const { status: rawStatus } = await searchParams
  const isValid = STATUS_OPTIONS.some((o) => o.value === rawStatus)
  const status: StatusFilter = isValid
    ? (rawStatus as StatusFilter)
    : "pending"

  const [sellers, counts] = await Promise.all([
    prisma.sellerProfile.findMany({
      where: { verificationStatus: status },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sellerProfile.groupBy({
      by: ["verificationStatus"],
      _count: true,
    }),
  ])

  const countByStatus: Record<string, number> = Object.fromEntries(
    counts.map((c) => [c.verificationStatus, c._count])
  )

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">셀러 검증</h1>

      {/* 상태 필터 탭 */}
      <div className="mb-6 flex gap-1 border-b border-zinc-200">
        {STATUS_OPTIONS.map((o) => (
          <Link
            key={o.value}
            href={`/admin/sellers?status=${o.value}`}
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

      {sellers.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-600">
          이 상태의 셀러가 없습니다.
        </div>
      ) : (
        <ul className="space-y-4">
          {sellers.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-lg font-semibold">{s.user.name}</p>
                  <p className="text-sm text-zinc-600">{s.user.email}</p>
                  {s.specialty && (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      {s.specialty}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-zinc-500">
                  등록일 {formatDate(s.createdAt)}
                </p>
              </div>

              {s.bio && (
                <p className="mt-3 text-sm text-zinc-700">{s.bio}</p>
              )}

              {/* 인스타·포트폴리오 — 있으면 표시 (운영자가 클릭해서 검증 자료 확인) */}
              {(s.instagramHandle || s.portfolioUrls) && (
                <div className="mt-3 space-y-1 text-sm">
                  {s.instagramHandle && (
                    <p className="text-zinc-600">
                      <span className="font-medium">Instagram: </span>
                      <a
                        href={`https://instagram.com/${s.instagramHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-900 underline"
                      >
                        @{s.instagramHandle}
                      </a>
                    </p>
                  )}
                  {s.portfolioUrls && (
                    <p className="text-zinc-600">
                      <span className="font-medium">Portfolio: </span>
                      <span className="text-zinc-700">
                        {s.portfolioUrls}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* rejected 일 때 사유 표시 */}
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
                    <form action={approveSellerAction}>
                      <input
                        type="hidden"
                        name="sellerProfileId"
                        value={s.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700"
                      >
                        승인
                      </button>
                    </form>
                    <RejectForm sellerProfileId={s.id} />
                  </>
                )}
                {s.verificationStatus !== "pending" && (
                  <form action={revertSellerAction}>
                    <input
                      type="hidden"
                      name="sellerProfileId"
                      value={s.id}
                    />
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
