// 서비스 카테고리 — 자유 입력 대신 *고정 목록*으로 데이터 일관성 확보 (Day 13)
//
// `as const`로 *literal tuple* 타입 생성 → ServiceCategory 타입이 5개 값 union으로 자동 추론.
// 같은 배열을:
//   - 폼의 <select> 옵션 렌더링에 사용
//   - Zod z.enum() 검증에 사용 (Server Action)
//   - Day 15 검색·필터 셀렉트박스에 재사용
// → "한 곳을 바꾸면 폼·검증·필터 다 자동 갱신" (single source of truth).
//
// 새 카테고리 추가는 이 배열에 한 줄 추가만 하면 됨.
// 대규모 운영 단계에선 Collection처럼 별도 테이블로 옮기는 게 자연스러움 (지금은 학습 단계 단순화).

export const SERVICE_CATEGORIES = [
  "디자인 컨설팅",
  "웹사이트 제작",
  "영상 편집",
  "영상 제작",
  "블로그·콘텐츠 운영",
] as const

// `(typeof X)[number]` = 배열의 *원소 타입* 추출. 결과: "디자인 컨설팅" | "웹사이트 제작" | ...
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]
