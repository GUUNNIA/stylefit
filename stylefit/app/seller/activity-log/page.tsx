// /seller/activity-log — 셀러 본인 활동 이력 (Day 20, Day 29 페이지네이션)
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
//
// 페이지네이션 (Day 29) — audit-log (Day 27) 의 *두 번째 사용처*. 차이점:
//   - audit-log: 두 축 보존 (action + targetType) — buildUrl 인자 3개.
//   - activity-log: 한 축 보존 (activity 만) — buildUrl 인자 2개.
//   - Promise.all([findMany, count]) / PAGE_SIZE / displayPage 클램프 / nav 마크업은 *동일*.
//   세 번째 사용처 도달 시 paginate 헬퍼 추출 검토 (extraction threshold).

import Link from "next/link"
import { requireSellerProfile } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import { SellerActivity } from "@prisma/client"
import { buildUrl, chipClass, validateEnumParam } from "@/app/lib/url-filter"
import {
  extractMetadataBoolean,
  extractMetadataString,
} from "@/app/lib/metadata"
import PageTabs from "@/app/components/PageTabs"
import { SELLER_TABS } from "@/app/lib/page-tabs"

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
  created: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  updated: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  toggled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  bookingConfirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  bookingRejected: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  bookingCompleted: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
}

// 명시 타입 — Object.values 가 unknown[] 으로 추론되어 validateEnumParam 시그니처와 안 맞음 (Day 19 학습).
const ACTIVITY_VALUES: readonly SellerActivity[] = Object.values(SellerActivity)

// 페이지당 항목 수 — *모듈 상수* 로 한 곳에서 관리. UI 와 Prisma skip 둘 다 참조.
// audit-log 와 동일 값(20) — 페이지네이션 두 번째 사용처에서도 *일관 정책*.
const PAGE_SIZE = 20

export default async function SellerActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; page?: string }>
}) {
  const sellerProfile = await requireSellerProfile("/seller/activity-log")

  const { activity: rawActivity, page: rawPage } = await searchParams
  const activity = validateEnumParam(rawActivity, ACTIVITY_VALUES)

  // page 파싱 — audit-log (Day 27) 와 동일 *얕은 인라인*. 세 번째 사용처 도달 시 url-filter.ts 로 추출.
  // 잘못된 값(음수/NaN/문자열) 은 *조용히 1* (validateEnumParam 의 number 버전).
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

  // where 동적 조립 — Day 16 의 *빈 객체 spread*.
  // sellerProfileId 는 *항상 들어감* (필터와 무관한 본인 격리).
  const where = {
    sellerProfileId: sellerProfile.id,
    ...(activity ? { activity } : {}),
  }

  const isFiltered = !!activity

  // findMany + count 동시 — Promise.all 로 두 쿼리 병렬.
  // count 는 *필터 + 본인 격리 동일* (where) — 본인의 필터링된 전체 갯수가 진실.
  const [logs, totalCount] = await Promise.all([
    prisma.sellerActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        service: { select: { id: true, title: true } },
      },
    }),
    prisma.sellerActivityLog.count({ where }),
  ])

  // 총 페이지 수 — 0건일 땐 1 페이지로 표시 (빈 상태 카피와 합).
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // page > totalPages 인 *stale URL / hack* 대응 — 표시만 마지막 페이지로 클램프.
  // fetch 는 이미 잘못된 skip 으로 수행되어 결과는 빈 배열 → 빈 상태 카피가 자연스럽게 뜸.
  const displayPage = Math.min(page, totalPages)

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <PageTabs items={SELLER_TABS} />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">활동 이력</h1>
      <p className="mb-6 text-sm text-ink-muted">
        내 서비스의 변경 이력.{" "}
        {isFiltered ? `결과 ${totalCount}건` : `전체 ${totalCount}건`}.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
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
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-ink-muted">
          {isFiltered
            ? "이 조건의 활동 이력이 없습니다."
            : "아직 기록된 활동이 없습니다. 서비스를 등록·수정하면 표시됩니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-muted text-left text-xs font-medium uppercase tracking-wider text-ink-subtle">
              <tr>
                <th className="px-4 py-3">시각</th>
                <th className="px-4 py-3">활동</th>
                <th className="px-4 py-3">서비스</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-foreground">
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
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : toggledTo === false
                      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : ACTIVITY_BADGE[log.activity]

                // 비고 — bookingRejected 의 metadata.rejectionReason 만 (Day 21).
                // 다른 활동은 빈 셀. Day 18 audit-log 와 *동일 패턴*.
                const reason =
                  log.activity === SellerActivity.bookingRejected
                    ? extractMetadataString(log.metadata, "rejectionReason")
                    : null

                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
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
                        className="text-foreground hover:underline"
                      >
                        {log.service.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{reason ?? ""}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 — audit-log (Day 27) 와 *동일 마크업*. 다른 점은 buildUrl 의 축 1개 (activity).
          totalPages 1 이하 미렌더 / page=1 은 URL 에서 생략 / 필터 축 보존 — 세 가지 정책 동일. */}
      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">
            {(displayPage - 1) * PAGE_SIZE + 1}–{Math.min(displayPage * PAGE_SIZE, totalCount)} / {totalCount}건
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {displayPage > 1 ? (
              <Link
                href={buildUrl("/seller/activity-log", {
                  activity,
                  page: displayPage - 1 > 1 ? String(displayPage - 1) : undefined,
                })}
                className="rounded-md border border-line px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
              >
                ← 이전
              </Link>
            ) : (
              <span
                aria-disabled
                className="rounded-md border border-line px-3 py-1.5 text-ink-subtle/60"
              >
                ← 이전
              </span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl("/seller/activity-log", {
                  activity,
                  page: p > 1 ? String(p) : undefined,
                })}
                aria-current={p === displayPage ? "page" : undefined}
                className={
                  p === displayPage
                    ? "rounded-md bg-accent-bg px-3 py-1.5 font-medium text-white dark:text-zinc-900"
                    : "rounded-md border border-line px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
                }
              >
                {p}
              </Link>
            ))}

            {displayPage < totalPages ? (
              <Link
                href={buildUrl("/seller/activity-log", {
                  activity,
                  page: String(displayPage + 1),
                })}
                className="rounded-md border border-line px-3 py-1.5 text-ink-muted transition-colors hover:bg-surface-muted"
              >
                다음 →
              </Link>
            ) : (
              <span
                aria-disabled
                className="rounded-md border border-line px-3 py-1.5 text-ink-subtle/60"
              >
                다음 →
              </span>
            )}
          </div>
        </nav>
      )}
    </main>
  )
}
