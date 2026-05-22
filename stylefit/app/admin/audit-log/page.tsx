// /admin/audit-log — 운영자 감사 로그 (Day 18, Day 27 페이지네이션)
//
// admin 액션의 *이력 (events)* 표시. snapshot 아닌 *추가 전용* 데이터 — 한번 들어가면 안 지움.
//
// polymorphic target 표시 패턴 (Day 18 핵심 학습):
//   AuditLog 의 (targetType, targetId) 가 Service 또는 SellerProfile 을 가리킴.
//   각 row 마다 fetch 하면 *N+1 쿼리* — 50 row → 51 쿼리 (1 audit + 50 target).
//   대신 *종류별로 id 모아서 in:[...] 한 번씩* — 총 3 쿼리 (audit + Service in + Seller in).
//   Map 으로 attach → 렌더 시 O(1) lookup.
//
// 필터 + 페이지네이션:
//   ?action=approved&targetType=Service&page=2 — 세 축. 한 축 변경 시 다른 축 *보존*.
//   chipClass / buildUrl / validateEnumParam 은 Day 19 에 `app/lib/url-filter.ts` 로 추출.
//   page 파싱은 *얕은 인라인* — 세 번째 사용처 도달 시 헬퍼 추출 (Day 23 패턴).

import Link from "next/link"
import { requireAdmin } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import { AuditAction, AuditTargetType } from "@prisma/client"
import { buildUrl, chipClass, validateEnumParam } from "@/app/lib/url-filter"
import { extractMetadataString } from "@/app/lib/metadata"
import PageTabs from "@/app/components/PageTabs"
import { ADMIN_TABS } from "@/app/lib/page-tabs"

const ACTION_LABEL: Record<AuditAction, string> = {
  approved: "승인",
  rejected: "반려",
  reverted: "되돌림",
}

const TARGET_LABEL: Record<AuditTargetType, string> = {
  Seller: "셀러",
  Service: "서비스",
}

// 액션별 배지 색 — 의미 강조: 승인=초록(긍정), 반려=빨강(부정), 되돌림=회색(중립).
const ACTION_BADGE: Record<AuditAction, string> = {
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  reverted: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
}

// 칩 그룹 map 용 — enum 의 런타임 값 목록. validateEnumParam 호출에도 재사용.
// 명시 타입 — Object.values 가 unknown[] 으로 추론되어 validateEnumParam 시그니처와 안 맞음.
const ACTION_VALUES: readonly AuditAction[] = Object.values(AuditAction)
const TARGET_VALUES: readonly AuditTargetType[] = Object.values(AuditTargetType)

// 페이지당 항목 수 — *모듈 상수* 로 한 곳에서 관리. UI 와 Prisma skip 둘 다 참조.
const PAGE_SIZE = 20

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; targetType?: string; page?: string }>
}) {
  await requireAdmin("/admin/audit-log")

  const { action: rawAction, targetType: rawTarget, page: rawPage } = await searchParams

  // 화이트리스트 매칭 — 잘못된 값은 *조용히 undefined* (필터 미적용)
  const action = validateEnumParam(rawAction, ACTION_VALUES)
  const targetType = validateEnumParam(rawTarget, TARGET_VALUES)

  // page 파싱 — 잘못된 값(음수/NaN/문자열) 은 *조용히 1*. validateEnumParam 의 number 버전.
  // 학습 단계 = 인라인. 세 번째 사용처 도달 시 url-filter.ts 로 추출.
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

  // where 동적 조립 — Day 16 의 *빈 객체 spread* 패턴.
  // 값 없으면 *키 자체가 안 들어감* → Prisma 는 해당 컬럼 필터 적용 안 함.
  const where = {
    ...(action ? { action } : {}),
    ...(targetType ? { targetType } : {}),
  }

  const isFiltered = !!(action || targetType)

  // findMany + count 동시 — Promise.all 로 두 쿼리 병렬.
  // count 는 *필터 동일* (where) — 필터링된 전체 갯수가 진실.
  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  // 총 페이지 수 — 0건일 땐 1 페이지로 표시 (빈 상태 카피와 합).
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // page > totalPages 인 *stale URL / hack* 대응 — 표시만 마지막 페이지로 클램프.
  // fetch 는 이미 잘못된 skip 으로 수행되어 결과는 빈 배열 → "이 조건의 로그가 없습니다" 가 자연스럽게 뜸.
  // 깊은 정상화(마지막 페이지 데이터까지 보여주기) 는 count 를 먼저 받아야 해서 Promise.all 이 깨짐 — 학습 단계에선 보류.
  const displayPage = Math.min(page, totalPages)

  // polymorphic target N+1 회피 — id 종류별로 모아서 한 번씩 fetch
  const serviceIds = logs
    .filter((l) => l.targetType === AuditTargetType.Service)
    .map((l) => l.targetId)
  const sellerIds = logs
    .filter((l) => l.targetType === AuditTargetType.Seller)
    .map((l) => l.targetId)

  const [services, sellers] = await Promise.all([
    serviceIds.length > 0
      ? prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, title: true },
        })
      : [],
    sellerIds.length > 0
      ? prisma.sellerProfile.findMany({
          where: { id: { in: sellerIds } },
          select: {
            id: true,
            user: { select: { name: true } },
          },
        })
      : [],
  ])

  // Map 으로 O(1) lookup
  const serviceTitleMap = new Map(services.map((s) => [s.id, s.title]))
  const sellerNameMap = new Map(sellers.map((s) => [s.id, s.user.name]))

  // target 이 *삭제된 경우* 조용한 fallback — audit log 의 본질 (이력 유지) 정신
  function resolveTargetLabel(
    targetType: AuditTargetType,
    targetId: number
  ): string {
    if (targetType === AuditTargetType.Service) {
      return serviceTitleMap.get(targetId) ?? `(삭제됨 #${targetId})`
    }
    return sellerNameMap.get(targetId) ?? `(삭제됨 #${targetId})`
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <PageTabs items={ADMIN_TABS} />
      <h1 className="mb-2 text-3xl font-bold tracking-tight">감사 로그</h1>
      <p className="mb-6 text-sm text-ink-muted">
        운영자 액션의 이력. {isFiltered ? `결과 ${totalCount}건` : `전체 ${totalCount}건`}.
      </p>

      {/* 필터 — 두 축 (action / targetType) 칩 그룹.
          한 축 변경 시 다른 축은 *보존* (Day 16 의 다축 상호 보존 UX). */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          액션
        </span>
        <Link
          href={buildUrl("/admin/audit-log", { targetType })}
          className={chipClass(!action)}
        >
          전체
        </Link>
        {ACTION_VALUES.map((a) => (
          <Link
            key={a}
            href={buildUrl("/admin/audit-log", { action: a, targetType })}
            className={chipClass(action === a)}
          >
            {ACTION_LABEL[a]}
          </Link>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
          대상
        </span>
        <Link
          href={buildUrl("/admin/audit-log", { action })}
          className={chipClass(!targetType)}
        >
          전체
        </Link>
        {TARGET_VALUES.map((t) => (
          <Link
            key={t}
            href={buildUrl("/admin/audit-log", { action, targetType: t })}
            className={chipClass(targetType === t)}
          >
            {TARGET_LABEL[t]}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-ink-muted">
          {isFiltered
            ? "이 조건의 로그가 없습니다."
            : "아직 기록된 액션이 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-muted text-left text-xs font-medium uppercase tracking-wider text-ink-subtle">
              <tr>
                <th className="px-4 py-3">시각</th>
                <th className="px-4 py-3">액션</th>
                <th className="px-4 py-3">대상</th>
                <th className="px-4 py-3">수행자</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-foreground">
              {logs.map((log) => {
                const reason = extractMetadataString(log.metadata, "rejectionReason")
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
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[log.action]}`}
                      >
                        {TARGET_LABEL[log.targetType]} {ACTION_LABEL[log.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {resolveTargetLabel(log.targetType, log.targetId)}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {log.actor.name}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {reason ?? ""}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 — totalPages 가 1 이하면 안 그림 (불필요).
          page > 1 일 때만 ?page=N 을 URL 에 넣음 → 1 페이지는 깔끔한 URL.
          필터 칩과 *축 보존* 동일 패턴 (action/targetType 같이 넘김). */}
      {totalPages > 1 && (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-ink-muted">
            {(displayPage - 1) * PAGE_SIZE + 1}–{Math.min(displayPage * PAGE_SIZE, totalCount)} / {totalCount}건
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {displayPage > 1 ? (
              <Link
                href={buildUrl("/admin/audit-log", {
                  action,
                  targetType,
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
                href={buildUrl("/admin/audit-log", {
                  action,
                  targetType,
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
                href={buildUrl("/admin/audit-log", {
                  action,
                  targetType,
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
