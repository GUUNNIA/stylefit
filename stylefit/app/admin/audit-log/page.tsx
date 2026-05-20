// /admin/audit-log — 운영자 감사 로그 (Day 18)
//
// admin 액션의 *이력 (events)* 표시. snapshot 아닌 *추가 전용* 데이터 — 한번 들어가면 안 지움.
// 최신 50건만 표시 — 진짜 페이지네이션은 Day 19+ 분리.
//
// polymorphic target 표시 패턴 (Day 18 핵심 학습):
//   AuditLog 의 (targetType, targetId) 가 Service 또는 SellerProfile 을 가리킴.
//   각 row 마다 fetch 하면 *N+1 쿼리* — 50 row → 51 쿼리 (1 audit + 50 target).
//   대신 *종류별로 id 모아서 in:[...] 한 번씩* — 총 3 쿼리 (audit + Service in + Seller in).
//   Map 으로 attach → 렌더 시 O(1) lookup.
//
// 필터 (5 단계):
//   ?action=approved&targetType=Service — 두 축 동시. Day 14 의 화이트리스트 + Day 16 의
//   빈 객체 spread 패턴 *세 번째 사용처*. chipClass / URL 빌더 는 *복붙* — Day 19 에서
//   세 사용처 (admin/services 의 status, /services 의 category·q, audit-log 의 action·targetType)
//   공통 추출 예정.

import Link from "next/link"
import { requireAdmin } from "@/app/lib/dal"
import { prisma } from "@/app/lib/prisma"
import { AuditAction, AuditTargetType } from "@prisma/client"

// 칩 스타일 — Day 16 services/page.tsx 와 동일. Day 19 추출 대상.
const chipClass = (isActive: boolean) =>
  isActive
    ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white"
    : "rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"

// URL 빌더 — Day 16 buildSearchUrl 와 동일 결. truthy 인 축만 ?param= 으로 들어감.
// 빈 칩 (전체) = 해당 축 *생략* → 다른 축은 보존되어 *축 간 상호 보존* UX.
function buildLogUrl(opts: {
  action?: AuditAction
  targetType?: AuditTargetType
}): string {
  const params = new URLSearchParams()
  if (opts.action) params.set("action", opts.action)
  if (opts.targetType) params.set("targetType", opts.targetType)
  const qs = params.toString()
  return qs ? `/admin/audit-log?${qs}` : "/admin/audit-log"
}

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
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  reverted: "bg-zinc-100 text-zinc-700",
}

// metadata 의 rejectionReason 만 표시. 그 외 키는 *학습 단계엔 무시* — 미래 키 추가 시 case 늘림.
function extractRejectionReason(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null
  if (!("rejectionReason" in metadata)) return null
  const reason = (metadata as { rejectionReason: unknown }).rejectionReason
  return typeof reason === "string" ? reason : null
}

// 화이트리스트 — 외부 입력 (URL 쿼리) 을 *enum 값과 매칭* 통과한 것만 사용.
// Day 14·16 의 화이트리스트 패턴 그대로. enum 의 *런타임 const 객체* 가 source of truth.
const ACTION_VALUES = Object.values(AuditAction)
const TARGET_VALUES = Object.values(AuditTargetType)

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; targetType?: string }>
}) {
  await requireAdmin("/admin/audit-log")

  const { action: rawAction, targetType: rawTarget } = await searchParams

  // 화이트리스트 매칭 — 잘못된 값은 *조용히 undefined* (필터 미적용)
  const action: AuditAction | undefined = (ACTION_VALUES as string[]).includes(
    rawAction ?? ""
  )
    ? (rawAction as AuditAction)
    : undefined
  const targetType: AuditTargetType | undefined = (
    TARGET_VALUES as string[]
  ).includes(rawTarget ?? "")
    ? (rawTarget as AuditTargetType)
    : undefined

  // where 동적 조립 — Day 16 의 *빈 객체 spread* 패턴.
  // 값 없으면 *키 자체가 안 들어감* → Prisma 는 해당 컬럼 필터 적용 안 함.
  const where = {
    ...(action ? { action } : {}),
    ...(targetType ? { targetType } : {}),
  }

  const isFiltered = !!(action || targetType)

  // 최신 50건 + actor 동시 fetch (FK relation 으로 자연 join)
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  })

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
      <h1 className="mb-2 text-3xl font-bold tracking-tight">감사 로그</h1>
      <p className="mb-6 text-sm text-zinc-600">
        운영자 액션의 이력. {isFiltered ? `결과 ${logs.length}건` : `최신 ${logs.length}건 표시`}.
      </p>

      {/* 필터 — 두 축 (action / targetType) 칩 그룹.
          한 축 변경 시 다른 축은 *보존* (Day 16 의 다축 상호 보존 UX). */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          액션
        </span>
        <Link
          href={buildLogUrl({ targetType })}
          className={chipClass(!action)}
        >
          전체
        </Link>
        {ACTION_VALUES.map((a) => (
          <Link
            key={a}
            href={buildLogUrl({ action: a, targetType })}
            className={chipClass(action === a)}
          >
            {ACTION_LABEL[a]}
          </Link>
        ))}
      </div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          대상
        </span>
        <Link
          href={buildLogUrl({ action })}
          className={chipClass(!targetType)}
        >
          전체
        </Link>
        {TARGET_VALUES.map((t) => (
          <Link
            key={t}
            href={buildLogUrl({ action, targetType: t })}
            className={chipClass(targetType === t)}
          >
            {TARGET_LABEL[t]}
          </Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-600">
          {isFiltered
            ? "이 조건의 로그가 없습니다."
            : "아직 기록된 액션이 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">시각</th>
                <th className="px-4 py-3">액션</th>
                <th className="px-4 py-3">대상</th>
                <th className="px-4 py-3">수행자</th>
                <th className="px-4 py-3">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-900">
              {logs.map((log) => {
                const reason = extractRejectionReason(log.metadata)
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
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${ACTION_BADGE[log.action]}`}
                      >
                        {TARGET_LABEL[log.targetType]} {ACTION_LABEL[log.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {resolveTargetLabel(log.targetType, log.targetId)}
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {log.actor.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {reason ?? ""}
                    </td>
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
