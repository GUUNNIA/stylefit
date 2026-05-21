// metadata Json 필드의 *키 안전 추출* 헬퍼 (Day 23 추출)
//
// 세 호출 사이트의 *공통 패턴* 추출:
//   - admin/audit-log/page.tsx : extractRejectionReason (Day 18)
//   - seller/activity-log/page.tsx : extractRejectionReason (Day 21)
//   - seller/activity-log/page.tsx : extractToggleTo (Day 20)
//
// *얕은 추출* (Day 19 정신) — string / boolean *별도 함수*:
//   - generic `extractMetadataKey<T>(metadata, key, isT)` 도 가능하지만 *호출 측 verbose*
//   - 두 함수가 *시그니처 명확* + *type guard 캡슐화* (호출 측은 key 만 신경)
//   - 새 타입 (number 등) 필요 시 *얕게 함수 한 개 더 추가*
//
// 보안·안전 패턴:
//   - metadata 는 Prisma Json 이라 *unknown* 으로 받음 (런타임 타입 unknown 강제)
//   - key 존재 + 타입 검증 두 단계 — *외부 입력 신뢰 X* 의 일관 정신

export function extractMetadataString(
  metadata: unknown,
  key: string
): string | null {
  if (!metadata || typeof metadata !== "object") return null
  if (!(key in metadata)) return null
  const v = (metadata as Record<string, unknown>)[key]
  return typeof v === "string" ? v : null
}

export function extractMetadataBoolean(
  metadata: unknown,
  key: string
): boolean | null {
  if (!metadata || typeof metadata !== "object") return null
  if (!(key in metadata)) return null
  const v = (metadata as Record<string, unknown>)[key]
  return typeof v === "boolean" ? v : null
}
