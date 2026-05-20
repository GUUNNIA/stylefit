// URL 기반 필터의 공통 헬퍼 (Day 19)
//
// *세 사용처 도달* 후 추출:
//   - Day 14 /admin/services?status=
//   - Day 16 /services?category=&q=
//   - Day 18 /admin/audit-log?action=&targetType=
//
// [[feedback-extraction-threshold]] 의 정신: *세 코드를 나란히 비교한 후* 추출.
// 즉시 추출 X — Day 18 끝나고 Day 19 에 *일괄* 모음.
//
// 추출 안 한 것:
//   - Prisma where 의 *빈 객체 spread* 패턴 (`...(x ? { x } : {})`) — 너무 짧아 함수화 시 오히려 노이즈
//   - Day 14 의 *탭 스타일* (border-b-2) — chipClass 와 디자인 다름, 묶지 않음

/**
 * URL 빌더 — basePath + truthy 인 params 만 쿼리스트링으로 조립.
 *
 * 빈 값은 *키 자체가 안 들어감* → 다축 필터에서 *축 간 상호 보존* 자연 표현.
 * 모든 값 비어있으면 *깔끔한 basePath* 반환.
 *
 * @example
 * buildUrl("/services", { category: "디자인", q: "" })  → "/services?category=디자인"
 * buildUrl("/services", { category: undefined, q: undefined })  → "/services"
 */
export function buildUrl(
  basePath: string,
  params: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value)
  }
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/**
 * 외부 URL 쿼리 값을 *enum/literal union 의 안전한 값* 으로 변환.
 *
 * 매칭되지 않으면 *undefined* — 호출 측이 default 처리 (`?? "pending"` 등) 또는
 * *필터 미적용* 의미로 사용.
 *
 * 화이트리스트 검증 — 외부 입력을 *명시 목록* 과만 매칭. 임의 값 그대로
 * 쿼리에 흘리지 않는 보안·UX 패턴 (Day 14 부터 일관).
 *
 * @example
 * validateEnumParam(rawAction, Object.values(AuditAction))  → AuditAction | undefined
 * validateEnumParam(rawCategory, SERVICE_CATEGORIES)        → ServiceCategory | undefined
 */
export function validateEnumParam<T extends string>(
  raw: string | null | undefined,
  valid: readonly T[]
): T | undefined {
  return raw && (valid as readonly string[]).includes(raw)
    ? (raw as T)
    : undefined
}

/**
 * 칩 (둥근 토글 버튼) 스타일 — 활성/비활성 두 상태.
 *
 * Day 16 services 와 Day 18 audit-log 의 칩 UI 두 곳에서 동일하게 사용.
 * Day 14 admin/services 의 *탭 스타일* 과는 디자인이 달라 묶지 않음 — 얕은 추상화.
 *
 * 미래에 *진짜 컴포넌트* (Link 까지 감싸는) 로 진화하면 그때 분리.
 */
export const chipClass = (isActive: boolean) =>
  isActive
    ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white"
    : "rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
