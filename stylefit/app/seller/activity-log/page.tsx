// /seller/activity-log — 셀러 본인 활동 이력 (Day 20)
//
// Day 18 admin /audit-log 의 셀러 버전 — 구분:
//   - admin /audit-log: 운영자 *심사 결정* 추적. polymorphic target (Service|Seller).
//   - seller /activity-log: *내 서비스 변경 이력*. 단일 도메인 (Service) → FK 직결.
//
// 본인 격리:
//   where: { sellerProfileId: sellerProfile.id } — *절대 빠지면 안 됨*. 셀러 화면의 1순위 안전장치.
//   복합 인덱스 (sellerProfileId, createdAt) 가 정확히 이 쿼리에 매칭 — Day 18 인덱스 설계의 첫 검증.
//
// Service FK Restrict — 로그 남은 서비스는 *삭제 불가*. polymorphic N+1 회피 패턴 불필요.
//   → audit-log 의 manual id resolve + Map 대신 *자연스러운 include relation*.
//
// 필터 한 축 (activity) — chipClass / buildUrl / validateEnumParam 은 Day 19 헬퍼 재사용.

import Link from "next/link"
import { requireSellerProfile } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import { SellerActivity } from "@prisma/client"
import { buildUrl, chipClass, validateEnumParam } from "@/app/lib/url-filter"
import {
  extractMetadataBoolean,
  extractMetadataString,
} from "@/app/lib/metadata"

// 칩 필터용 라벨 — toggled 는 한 단어 (방향은 badge 에서 분리 표시)
const ACTIVITY_LABEL: Record<SellerActivity, string> = {
  created: "등록",
  updated: "수정",
  toggled: "토글",
  bookingConfirmed: "예약 확정",
  bookingRejected: "예약 거절",
  bookingCompleted: "예약 완료",
}

// 활동별 기본 배지 색. toggled 는 metadata.to 따라 아래에서 분기.
//   stone (bookingCompleted) — *마침 의미의 중립 + 따뜻한 회색*. emerald (시작) 과 시각 차별.
const ACTIVITY_BADGE: Record<SellerActivity, string> = {
  created: "bg-emerald-50 text-emerald-700",
  updated: "bg-sky-50 text-sky-700",
  toggled: "bg-zinc-100 text-zinc-700",
  bookingConfirmed: "bg-emerald-50 text-emerald-700",
  bookingRejected: "bg-rose-50 text-rose-700",
  bookingCompleted: "bg-stone-100 text-stone-700",
}

// 명시 타입 — Object.values 가 unknown[] 으로 추론되어 validateEnumParam 시그니처와 안 맞음 (Day 19 학습).
const ACTIVITY_VALUES: readonly SellerActivity[] = Object.values(SellerActivity)

export default async function SellerActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string }>
}) {
  const sellerProfile = await requireSellerProfile("/seller/activity-log")

  const { activity: rawActivity } = await searchParams
  const activity = validateEnumParam(rawActivity, ACTIVITY_VALUES)

  // where 동적 조립 — Day 16 의 *빈 객체 spread*.
  // sellerProfileId 는 *항상 들어감* (필터와 무관한 본인 격리).
  const where = {
    sellerProfileId: sellerProfile.id,
    ...(activity ? { activity } : {}),
  }

  const isFiltered = !!activity

  const logs = await prisma.sellerActivityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      service: { select: { id: true, title: true } },
    },
  })

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">활동 이력</h1>
      <p className="mb-6 text-sm text-zinc-600">
        내 서비스의 변경 이력.{" "}
        {isFiltered ? `결과 ${logs.length}건` : `최신 ${logs.length}건 표시`}.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          활동
        </span>
        <Link
          href={buildUrl("/seller/activity-log", {})}
          className={chipClass(!activity)}
        >
          전체
        </Link>
        {ACTIVITY_VALUES.map((a) => (
          <Link
            key={a}
            href={buildUrl("/seller/activity-log", { activity: a })}
            className={chipClass(activity === a)}
          >
            {ACTIVITY_LABEL[a]}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-600">
          {isFiltered
            ? "이 조건의 활동 이력이 없습니다."
            : "아직 기록된 활동이 없습니다. 서비스를 등록·수정하면 표시됩니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">시각</th>
                <th className="px-4 py-3">활동</th>
                <th className="px-4 py-3">서비스</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-900">
              {logs.map((log) => {
                // toggled 는 metadata.to 로 *방향* (활성화/비활성화) 표시.
                // 다른 활동(created/updated) 은 metadata 안 봄.
                const toggledTo =
                  log.activity === SellerActivity.toggled
                    ? extractMetadataBoolean(log.metadata, "to")
                    : null
                const badgeLabel =
                  toggledTo === true
                    ? "활성화"
                    : toggledTo === false
                      ? "비활성화"
                      : ACTIVITY_LABEL[log.activity]
                const badgeClass =
                  toggledTo === true
                    ? "bg-emerald-50 text-emerald-700"
                    : toggledTo === false
                      ? "bg-zinc-100 text-zinc-700"
                      : ACTIVITY_BADGE[log.activity]

                // 비고 — bookingRejected 의 metadata.rejectionReason 만 (Day 21).
                // 다른 활동은 빈 셀. Day 18 audit-log 와 *동일 패턴*.
                const reason =
                  log.activity === SellerActivity.bookingRejected
                    ? extractMetadataString(log.metadata, "rejectionReason")
                    : null

                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                      {log.createdAt.toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/seller/services/${log.service.id}/edit`}
                        className="text-zinc-900 hover:underline"
                      >
                        {log.service.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{reason ?? ""}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
