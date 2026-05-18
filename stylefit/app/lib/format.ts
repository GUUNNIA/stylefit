// 사람이 읽기 좋은 포맷 헬퍼 + 안전한 URL 처리 (Day 9~)

// return URL 검증: 외부 사이트로의 open redirect 방지.
// - "/"로 시작 + "//"로 시작 안 함 → 내부 경로로 판단
// - 그 외(외부 URL, javascript:, 빈 값 등)는 fallback 반환
export function safeReturnUrl(
  candidate: string | null | undefined,
  fallback: string
): string {
  if (!candidate) return fallback
  if (!candidate.startsWith("/")) return fallback
  if (candidate.startsWith("//")) return fallback // protocol-relative 차단
  return candidate
}

// ─────────────────────────────────────────
//
// 시드 데이터의 durationMinutes는 *작업 시간* 의미 — 컨설팅 60·90분부터
// 웹사이트 제작 14400분(10일)까지 같은 컬럼에 들어감.
// UI에선 단위를 *자동 변환*해서 자연스럽게 보이게 한다.

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}분`

  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins === 0 ? `${hours}시간` : `${hours}시간 ${mins}분`
  }

  const days = Math.floor(minutes / 1440)
  const remainder = minutes % 1440
  if (remainder === 0) return `${days}일`

  const hours = Math.floor(remainder / 60)
  return `${days}일 ${hours}시간`
}
