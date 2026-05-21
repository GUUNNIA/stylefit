# Phase 1A — Day 22 완료 보고서

> 작성일: 2026-05-21
> 작업 범위: buyer 예약 취소 액션 — cancelled 의 양방향 대칭 완성 + RejectForm 세 번째 사용처 도달
> 학습자: 디자인 전공 / 코딩 22일째

---

## 🎯 큰 그림 — Day 22가 한 일

```
[Day 13] /seller/bookings 읽기 전용 (TODO 마커)
[Day 21] 셀러 *거절* 액션 + rejectionReason — 한 방향
   ↓
[Day 22] buyer *취소* 액션 + cancellationReason — 대칭 완성  ← 지금
   ↓
[Day 23+ 예정] 복붙 추출 (RejectForm + extractMetadataString + STATUS_LABEL 3분기 함수화)
```

기능 ↔ 정리 리듬의 *연속 다섯 번째 기능 Day* (Day 18→19→20→21→22 중 19 만 정리). **계획 재검토 두 번째** — Day 21 의 *Day 22 = 복붙 추출 권장* 을 *두 사용처라 시기상조* 라는 근거로 다시 뒤집고 buyer 취소로 갈아탐. Day 21 의 *계획 재검토 정신* 의 *자기 적용*.

---

## 📅 Day 22 작업 요약

### 작업 단계 (8)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 계획 재검토 — Day 21 권장 (복붙 추출) 뒤집기 | 사용처 카운트 정확성, *재검토 정신의 자기 적용* |
| 1 | 스키마: `Booking.cancellationReason String?` (rejectionReason 옆) | *의미 분기를 컬럼 위치로* — Day 21 정신 확장 |
| 2 | 마이그레이션 | `add_booking_cancellation_reason` |
| 3 | `/bookings/actions.ts` 신규 — `cancelBookingAction`. `$transaction` 분기 의존성 (Day 20 패턴) | buyer 본인 격리 + status pending 멱등 |
| 4 | `/bookings/CancelForm.tsx` 신규 — RejectBookingForm *세 번째 사용처* 복붙 (색·카피만 다름) | 색 분기 (amber) = *부정 강도 시각화* |
| 5 | `/bookings/page.tsx` — 카드 구조 변경 (Link 와 form 분리) + 라벨 3분기 + 사유 박스 + 액션 영역 | *Link 안에 form 충돌 회피* |
| 6 | `/seller/bookings/page.tsx` — 라벨 3분기 + cancellationReason 박스 (셀러 측 buyer 취소 사유 표시) | 양방향 대칭 정보 |
| 7 | 시드 보강 — 박서연 → GUUN cancelled+cancellationReason 1개 | *자기 충족 시드* + *과거 + 신규 공존* |
| 8 | 학습 문서 + 메모리 + 커밋 | |

### 환경 트러블슈팅 부수 학습

검증 중 **HMR WebSocket failure on LAN IP** 발견 — Day 21 EPERM + TS Server 캐시 + Day 22 HMR fail = 환경 카테고리 누적.

---

## 🐛 Day 22 핵심 발견·논의

### 발견 1: ***계획 재검토 정신의 자기 적용*** — Day 21 가 Day 20 권장을 뒤집은 흐름의 재현

Day 21 plan 의 Day 22 권장 = *복붙 추출 (정리 Day)*. 이번엔 Day 22 진입 시 *그 권장도 재검토*.

**검토 결과 — 후보 정확 카운트**:

| 후보 | 사용처 갯수 | 추출 시점? |
|---|---|---|
| `extractRejectionReason` | 2 (audit-log + activity-log) | X — 두 사용처 |
| `extractToggleTo` | 1 (activity-log 만) | X — 한 사용처 |
| `RejectForm` | 2 (admin + seller booking) | X — 두 사용처 |
| `STATUS_LABEL` cancelled 분기 | 2 (seller + buyer) | X — 두 사용처 |

**모두 *두 사용처 이하*** — Day 19 의 *세 번째 도달 후 추출* 원칙 위반. Day 21 plan 의 권장은 *작성 시점 사용처 카운트 부정확*.

**Day 21 → Day 22 흐름의 메타 학습**:
- Day 20 → Day 21: 페이지네이션 권장 뒤집기 (체감 X + 두 사용처 추출 모순)
- Day 21 → Day 22: 복붙 추출 권장 뒤집기 (정확 카운트 = 두 사용처)

→ **재검토는 *예외* 가 아니라 *기본 절차*** 가 됨. *plan 의 권장 = 추정* + *진입 시 재검토 = 검증*.

**원칙**: "*계획 재검토는 반복 가능한 정신*. *어제 적은 권장* 을 *오늘 다시 따져* 뒤집는 게 *예외적 결정* 이 아니라 *기본 procedure*. *재검토 자체* 가 *plan 의 진짜 가치* — *근거 있는 변경 = 진보, 근거 없는 고수 = 정체*."

---

### 발견 2: ***사용처 카운트의 정확성*** — *추출 시점* 의 명확한 판별

[[feedback-extraction-threshold]] 의 *세 번째 사용처에서 추출* 원칙. 단 *사용처 갯수* 가 *모호하게 카운트* 되면 *기준 자체 무력화*.

**Day 22 의 카운트 점검**:
- `extractRejectionReason` 의 *복제본* — 두 파일에 *같은 코드 line-by-line identical*. 하지만 *사용처 = 2* (각 파일 1번씩 사용)
- *함수가 같은 모양인 것* != *같은 사용처 갯수*. *호출 사이트 갯수* 가 정확한 카운트

**Day 19 의 url-filter 추출 시점** 회고:
- buildUrl: Day 14 (1) + Day 16 (1) + Day 18 (1) = 3 호출 사이트 (각 다른 파일)
- chipClass: Day 16 (1) + Day 18 (1) = 2 호출 사이트 (Day 14 의 *탭* 은 디자인 달라 카운트 X)
- *진짜 3 도달 후* 추출

**Day 22 의 *비슷한 듯 다른* 함정**:
- `extractRejectionReason` 함수가 두 파일에 *복제* 존재 → *2 사용처*. *세 번째 호출 사이트 도달 시* 추출 가능
- 만약 이게 *Day 22 안에서 booking-reject 비고* 라는 *추가 사용처 도달*? → 그건 *같은 파일 안 두 번째 호출* — 사용처 카운트 *별도 파일* 만 의미 있는지 *같은 파일 안 두 번도* 카운트인지 결정 필요

채택 — *호출 사이트 갯수* 가 카운트 (같은 파일 안 두 번도 +1). 그래도 `extractRejectionReason` 은 Day 22 의 activity-log 안 *한 번* 호출 (비고 컬럼). 총 2.

**원칙**: "*추출 트리거 = 사용처 갯수 정확 카운트*. *모호한 추정* 으로 *시기상조 추출* 안 함. *plan 작성 시 권장* 도 *카운트 명시* 가 *검증 가능* 의 핵심. *세 번째 도달 이라는 명확한 기준* 이 *제멋대로 추출* 회피의 정신."

---

### 발견 3: ***양방향 대칭 액션*** — cancelled 의 *진짜 양방향* 완성

Day 21 까지 cancelled 상태는 *셀러 거절* 만 가능. buyer 는 booking 만들고 *취소 못 함* — *비대칭 도메인*.

Day 22 에 buyer 취소 도입 → cancelled 가 *양방향 발생 가능*:

| 액션 | 주체 | 사유 컬럼 | UI 표시 |
|---|---|---|---|
| 셀러 거절 (Day 21) | seller | rejectionReason | rose "거절됨" |
| buyer 취소 (Day 22) | buyer | cancellationReason | amber "취소됨" |
| 둘 다 없음 (legacy 시드) | (시스템) | 둘 다 null | red "취소됨" |

**`cancelled` enum 의 의미가 *행동 주체로 분기***:
- Day 21 plan 에 적은 *cancelled 의 의미 분기를 enum 분리 X* 정신 그대로
- *컬럼 위치로 자동 구분* — 데이터 모델 일반화 X, *간접 구분 가능*

**buyer 와 seller 의 *행동 권한 차이*** 도 자연:
- seller 만 *confirm* 가능 (status pending → confirmed)
- buyer 만 *cancel* 가능 (status pending → cancelled + cancellationReason)
- seller 만 *reject* 가능 (status pending → cancelled + rejectionReason)
- 권한이 *컬럼 위치로 자동 표현*

**원칙**: "*도메인 액션의 양방향* 은 *enum 분리 X + 컬럼 위치로* 자연 표현 가능. *행동 주체별 컬럼* = *그 컬럼이 채워졌으면 그 주체가 한 행동*. *데이터 모델의 우아함* — 새 enum 도입 부담 없이 *양방향 의미* 보존."

---

### 발견 4: ***의미 분기를 컬럼 위치로*** — Day 21 정신의 확장

Day 21 의 *cancelled 의 의미 분기* (셀러 거절 vs buyer 취소) 를 *enum 분리 X* 로 결정.

Day 22 에서 *두 번째 사유 컬럼* 도입 시 두 선택:

**A) 통합 컬럼 (cancelReason) + cancelledBy enum** — 데이터 일반화:
```prisma
cancelReason  String?
cancelledBy   CancelActor?  // enum: seller | buyer
```

**B) 별도 컬럼 (rejectionReason + cancellationReason)** — 명명으로 명시:
```prisma
rejectionReason     String?  // 셀러 거절 (Day 21)
cancellationReason  String?  // buyer 취소 (Day 22)
```

**B 채택 이유**:
- *위치로 자동 구분* — 채워진 컬럼이 *어느 주체* 알림
- *enum 추가 부담 X* — 데이터 마이그레이션·UI 분기·검증 모두 *단순*
- *Day 21 의 rejectionReason 이미 있음* — A 채택 시 *컬럼 이름 변경 + 데이터 이동* 마이그레이션 부담
- *기존 데이터 무영향* — Day 21 booking 의 rejectionReason 데이터 그대로 의미 유지

**A 의 가치 — 미래 확장 시**:
- *제 3 주체 (admin?)* 도입 시 enum 한 값 추가
- *공통 처리 코드* (cancellation 흐름 통일) 가능

학습 단계엔 *B 의 단순성* 우선. *세 주체 cancellation 도입* 시점에 A 로 마이그레이션 고려.

**원칙**: "*의미 분기의 표현* 은 *데이터 일반화 vs 명명 명시* 중 선택. *학습 단계 = 명명 명시* + *확장 가능성 보존*. *지금 일반화* 는 *추측적 추상화*, *세 주체 도달 시 일반화* 는 *근거 있는 리팩터*."

---

### 발견 5: ***Link 안에 form 충돌*** — buyer 카드의 구조 변경

buyer /bookings 의 카드는 *전체 Link 로 감쌈* — 카드 클릭 → service 상세로 이동.

Day 22 에 [취소하기] 폼 추가 시 충돌 발생 가능:
- Link 안에 button 있으면 *button 클릭이 Link navigation 도 trigger* 가능 (브라우저 default behavior)
- *button 의 click 이 form 처리* + *Link 가 페이지 이동* → 경합

**해결 — 카드 구조 변경**:

```tsx
// ❌ Before — Link 가 카드 전체
<li>
  <Link className="block rounded-xl border ... p-5 hover:...">
    <헤더 + 본문 + 사유 박스>
  </Link>
</li>

// ✅ After — li 가 border + Link 는 padding 만 + 액션은 Link 밖
<li className="overflow-hidden rounded-xl border ... hover:...">
  <Link className="block p-5">
    <헤더 + 본문 + 사유 박스>
  </Link>
  {pending && (
    <div className="border-t border-zinc-100 px-5 py-3">
      <CancelForm bookingId={b.id} />
    </div>
  )}
</li>
```

**핵심 결정**:
- *border + hover transition* 은 `li` 로 이동 → 카드 통일감 유지
- *padding* 만 `Link` 에 (a 태그가 padding 영역 클릭 가능)
- 액션 영역 = `Link` 밖 `div` — *button 클릭이 navigation trigger 안 함*
- `border-t border-zinc-100` 으로 액션 영역 *시각적 분리*

**미세 디자인 — overflow-hidden**:
- li 의 border-radius + 자식 영역 모서리 처리. `overflow-hidden` 없으면 액션 영역 *모서리가 li 밖으로 튀어나옴*. 작은 디테일.

**원칙**: "*상호작용 영역의 nesting* 은 *브라우저 default behavior 의 함정* 필수 점검. *Link 안 form, button 안 button, label 안 link* 모두 *event bubbling 충돌* 가능. *해결 = 구조 분리* (CSS 트릭 X, *HTML 의미 그대로*)."

---

### 발견 6: ***부정 강도의 색 분기*** — rose / amber / red 의 의미 시스템

Day 21 의 색:
- rose (rejection) = 강한 부정 — 셀러가 *내 booking 거절*

Day 22 에 두 색 추가:
- amber (cancellation) = 주의 신호 — *내가 취소* 또는 *상대가 취소*
- red (기본 cancelled) = 중립 부정 — *legacy 데이터 fallback*

**색 의미 시스템**:

| 색 | 강도 | 의미 |
|---|---|---|
| rose | 강한 부정 | rejection (외부 거부) |
| amber | 주의 | cancellation (의도된 취소) |
| red | 기본 | cancelled fallback |
| emerald | 긍정 | confirmation |
| zinc | 중립 | completed / pending |
| sky | 정보 | update |

**Day 21 의 *카피 차이 (반려 vs 거절 vs 취소)* + Day 22 의 *색 차이 (rose vs amber vs red)*** 가 *함께 부정 강도 표현*. *시각 + 어휘* 의 *2 축 시스템*.

**디자이너의 디자인 토큰 관점과 같은 결**:
- *컬러 토큰* = 의미 (semantic) 기반 — `color-error`, `color-warning`, `color-info`
- *현재 코드의 색* 은 *Tailwind utility* 라 *직접 매핑 X* — 다음 정리 Day 에 토큰화 후보? *과도한 추상화 X* 일관 (Day 19 정신)

**원칙**: "*색의 의미* 는 *부정 강도의 시각화* 같은 *축* 으로 정리 가능. *rose > amber > red* 처럼 *내부적 의미 시스템* 보유. *디자인 토큰 도입* 은 *세 사용처 도달 + 진짜 같은 패턴 발견* 후 고려 — 지금은 *Tailwind utility inline* 으로 충분."

---

### 발견 7: ***3분기 라벨 inline ternary*** — 얇은 함수 추출 안 함 (Day 19 정신 일관)

```ts
const status =
  b.status === BookingStatus.cancelled && b.rejectionReason
    ? { text: "거절됨", className: "bg-rose-100 text-rose-700" }
    : b.status === BookingStatus.cancelled && b.cancellationReason
      ? { text: "취소됨", className: "bg-amber-100 text-amber-700" }
      : STATUS_LABEL[b.status]
```

*중첩 ternary 3분기* — *함수 추출 유혹*:

```ts
// 유혹 — 함수화
function resolveBookingStatus(b: { status, rejectionReason, cancellationReason }) {
  if (b.status === BookingStatus.cancelled) {
    if (b.rejectionReason) return { text: "거절됨", ...rose }
    if (b.cancellationReason) return { text: "취소됨", ...amber }
  }
  return STATUS_LABEL[b.status]
}
```

**채택 안 함** — Day 19 의 *얇은 함수 안 추출* 원칙:
- *세 사용처 (seller + buyer + 미래) 도달 X* — 현재 2
- *함수 추출 시 호출 측에서 *함수 이름 → 동작* 두 번 매핑* 인지 부하 ↑
- *inline 표현이 *직설적* — 코드 읽으며 *지금 if-else 가 뭐 하는지* 즉시 보임

**원칙 일관 — *얇은 함수 안 추출 + 세 번째 도달 후 추출*** 의 *합리적 조합*:
- 두 사용처 + 추출 가능 함수 → *복붙 유지 (inline)*
- 세 사용처 + 함수 가치 ↑ → 추출 (Day 19 의 url-filter 처럼)

→ Day 22 안의 *3분기 라벨* 은 *3 사용처 도달 시* 추출 후보 — 현재 보존.

**원칙**: "*복잡 inline* vs *함수 추출* 의 결정은 *사용처 갯수 + 함수 의미* 의 *2 축 평가*. *세 분기 inline* 이 *2 사용처에선* 직설적, *3 사용처에선* 추출 가치 ↑. *현재 코드의 인지 부하* 보다 *미래 사용처에서의 일관성* 이 *추출 가치*."

---

### 발견 8: ***RejectForm 세 번째 사용처 도달*** — 추출 보류 결정의 가치

Day 22 에 CancelForm 추가 → RejectForm-like 의 *세 번째 사용처 도달*:
1. admin/services/RejectForm.tsx (Day 14)
2. seller/bookings/RejectBookingForm.tsx (Day 21)
3. bookings/CancelForm.tsx (Day 22)

**세 번째 도달 = 추출 가능 시점**. 하지만 Day 22 안에서 *추출 보류*:

**왜 보류**:
- *Day 22 범위 = buyer 취소 액션* — *기능 도입* 이 1순위
- *추출은 정리 작업* — *기능 작업에 묶으면 범위 넓어짐*
- *세 사용처 비교 가능 상태 도달* 자체가 *다음 정리 Day 의 자산*
- *지금 즉시 추출* 보다 *나란히 비교 후 추출* 이 *더 깊은 추상화*

**Day 19 의 url-filter 추출 패턴**:
- Day 14 → 16 → 18 = 세 사용처 도달
- *Day 18 안에서 추출 안 함* — 그 자리는 *audit-log 기능 도입*
- *Day 19 정리 Day* 에서 *세 코드 나란히 보고* 추출
- 결과 — *얕은 추출* (chipClass 2/3 만), *깊은 잘못된 추상화 회피*

**Day 22 의 동일 흐름**:
- Day 14 → 21 → 22 = 세 사용처 도달
- *Day 22 안에서 추출 안 함* — 그 자리는 *buyer 취소 기능 도입*
- *다음 정리 Day (Day 23?)* 에서 *세 코드 비교 후* 추출

**원칙**: "*세 번째 도달 = 추출 의무 X, 추출 가능 시점*. *그 Day 의 범위* 와 *추출 작업의 깊이* 가 따로. *기능 도입 Day 안에서 추출 묶기* 는 *Day 19 의 정신과 모순*. *정리 Day 분리 = 비교 + 판별 + 추출* 의 *세 단계 보장*."

---

### 발견 9: ***HMR WebSocket failure on LAN IP*** — Next.js dev server 함정

검증 중 [취소하기] 버튼 *클릭 무반응* 발견. 원인 진단:

**증상**:
- 페이지 HTML 정상 렌더링 (카드 보임)
- 버튼 클릭 → onClick 무반응
- 콘솔에 `WebSocket connection to 'ws://192.168.130.119:3001/_next/webpack-hmr...' failed` 반복

**진단 흐름**:
1. 코드 확인 — `"use client"`, useState, onClick 모두 정상
2. 다른 가능성 — dev server 캐시 → 재시작
3. 재시작 후도 동일 — WebSocket 에러 그대로
4. **URL 확인 — `192.168.130.119:3001` (LAN IP)**
5. → Next.js HMR WebSocket 이 *LAN IP origin 으로 받은 요청* 의 *WebSocket upgrade* 거부
6. *Client Component 의 JS chunk 가 정상 로드 안 됨* → onClick 등록 X

**해결**: `localhost:3001` 로 접속 (같은 PC 면 그대로)

**Day 21 / 22 의 환경 트러블슈팅 누적**:

| Day | 환경 문제 | 진단 키 |
|---|---|---|
| 21 | EPERM on dll rename | dev server 가 dll 잡고 있음 |
| 21 | TS Server 캐시 | 디스크 .d.ts vs IDE 메모리 불일치 |
| 22 | HMR WebSocket failure on LAN IP | dev server 의 origin 검증 |

**공통 패턴**:
- *코드는 정상* 인데 *증상은 코드 문제처럼 보임*
- *환경 도구의 부분 실패* 가 *기능 마비* 로 보임
- *증상 → 원인* 의 직관적 매핑 어려움

**해결의 공통 흐름**:
1. *콘솔 에러* 가 첫 단서 (Day 22 의 WebSocket fail)
2. *증상의 부분성* 확인 (Day 21 의 *DB 성공 + Client 실패* 분리)
3. *환경 도구 재시작* 으로 클린 상태

**원칙**: "*개발 환경의 부분 실패* 가 *코드 문제로 위장* 하는 경우 많음. *증상 → 코드* 직진 X, *콘솔 + 네트워크 + 부분 성공 여부* 점검이 *진단의 첫 단계*. *환경 트러블슈팅 = 코딩 학습의 부분* — *AI 도 모르는 환경별 함정* 누적이 *실무 가치*."

---

### 발견 10: ***시드의 과거 + 신규 공존*** — fallback 분기의 자연 보호

검증 중 사용자가 *한태민 1분 광고 영상 (cancelled, 사유 없음)* 발견 후 *"왜 사유 없음?"* 질문.

**원인** — 시드의 *시간적 의미*:
- booking 6번 시드 = Day 11 시점 작성 (사유 컬럼 도입 전)
- Day 21 / 22 에 *기존 시드 안 건드림* — *과거 데이터 보존*
- → cancelled + 사유 모두 null = *legacy cancelled* (시드 의도)

**3분기 fallback 의 *자연 대응***:
- rejectionReason 있음 → "거절됨" rose
- cancellationReason 있음 → "취소됨" amber
- 둘 다 없음 → 기본 "취소됨" red (legacy 또는 미래 *시스템 자동 취소*)

**시드 정신**:
- *Day 마다 시드 *그대로* 보존* — Day 21 의 정수아 거절 시드만 추가, 한태민 cancelled 는 그대로
- *과거 + 신규 데이터 공존* 이 *진짜 운영 환경 시뮬레이션*
- *3분기 fallback 의 마지막 분기* = *legacy 보호*

**대안 — 모든 cancelled 에 사유 박기**:
- *데이터 일관성* ↑
- 하지만 *시드의 진짜 의도 변경* — 한태민 booking 의 *원래 의미* (사유 없는 cancellation, 어쩌면 시스템 자동) 손실

**원칙**: "*시드 = 시간적 의도 보존*. *Day 마다 시드 안 건드림* 이 *기존 의미 유지*. *fallback 분기* = *legacy + 미래 미정 케이스* 의 *자연 대응*. *모든 데이터를 신기능에 맞춰 변경* 은 *과거 의도 손실*."

---

## 🎓 새로 배운 개념 (Day 22)

### 계획 재검토 정신의 자기 적용
- *재검토 = 예외 X, 기본 절차*
- Day 21 → Day 22 의 *두 번 연속 재검토* → *plan 의 권장은 추정, 진입 검증은 검증*

### 사용처 카운트의 정확성
- *호출 사이트 갯수* 가 추출 트리거 기준
- *plan 권장 시 카운트 명시* 필요

### 양방향 대칭 액션
- cancelled 의 *양방향 (seller reject + buyer cancel)* 가능
- 같은 enum, 다른 컬럼

### 의미 분기를 컬럼 위치로
- *enum 분리 X + 컬럼 명명 명시*
- *통합 vs 별도* 선택은 *학습 단계 = 명시* 우선

### Link 안 form 충돌 회피
- *카드 구조 변경* (li border, Link padding, 액션 밖)
- *상호작용 영역 nesting* 함정

### 색 분기로 부정 강도
- rose / amber / red 의 *의미 시스템*
- *시각 + 어휘* 2 축

### 3분기 라벨 inline ternary 보존
- *얇은 함수 안 추출* 원칙 일관
- *2 사용처는 inline, 3 사용처에서 함수화* 후보

### 세 번째 도달 후 추출 보류 결정
- *기능 Day 안에서 추출 묶기* X
- *정리 Day 분리* = 비교 + 판별 + 추출의 세 단계

### HMR WebSocket on LAN IP
- *환경 트러블슈팅 카테고리 누적*
- *콘솔 + 네트워크 + 부분 성공* 진단

### 시드의 과거 + 신규 공존
- *Day 마다 시드 보존* + *fallback 분기 자연 대응*
- *legacy 의미 손실 회피*

---

## 📋 작성된 코드 핵심

```prisma
// schema.prisma — Booking 컬럼 + (cancellationReason 추가)
model Booking {
  ...
  rejectionReason     String?   // Day 21 — 셀러 거절 사유
  cancellationReason  String?   // Day 22 — buyer 취소 사유
  // 위치로 자동 구분: rejectionReason 채워짐 = 셀러 거절, cancellationReason = buyer 취소
}
```

```ts
// /bookings/actions.ts — buyer 본인 격리 + 멱등 (Day 21 패턴 대칭)
export async function cancelBookingAction(formData: FormData) {
  const session = await verifySession()
  if (!session) redirect("/login")
  // ...
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({
      where: {
        id: bookingId,
        buyerId: session.userId,            // ← buyer 본인 격리
        status: BookingStatus.pending,
      },
      select: { id: true },
    })
    if (!booking) return

    const { count } = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.pending },
      data: {
        status: BookingStatus.cancelled,
        cancellationReason: reason,
      },
    })
    if (count === 0) return
  })

  revalidatePath("/bookings")
  revalidatePath("/seller/bookings")   // ← 캐스케이드 (Day 21 패턴)
}
```

```tsx
// /bookings/page.tsx — 카드 구조 변경 + 3분기 라벨 + 액션 Link 밖
<li className="overflow-hidden rounded-xl border ... hover:...">
  <Link href={...} className="block p-5">
    {/* 헤더 + 본문 + 사유 박스들 */}
    {b.status === BookingStatus.cancelled && b.rejectionReason && (...)}
    {b.status === BookingStatus.cancelled && b.cancellationReason && (...)}
  </Link>

  {/* 액션 — Link 밖 */}
  {b.status === BookingStatus.pending && (
    <div className="border-t border-zinc-100 px-5 py-3">
      <CancelForm bookingId={b.id} />
    </div>
  )}
</li>

// 3분기 라벨 (얇은 함수 추출 X — Day 19 정신)
const status =
  b.status === BookingStatus.cancelled && b.rejectionReason
    ? { text: "거절됨", className: "bg-rose-100 text-rose-700" }
    : b.status === BookingStatus.cancelled && b.cancellationReason
      ? { text: "취소됨", className: "bg-amber-100 text-amber-700" }
      : STATUS_LABEL[b.status]
```

---

## 📁 변경된 파일

```
stylefit/
├── prisma/
│   ├── schema.prisma                                  — Booking.cancellationReason
│   ├── migrations/20260521020517_add_booking_cancellation_reason/
│   │   └── migration.sql                              — 신규
│   └── seed.ts                                        — 박서연 → GUUN cancelled+사유 1개
├── app/
│   ├── bookings/
│   │   ├── page.tsx                                   — 카드 구조 + 3분기 + 사유 박스 + 액션
│   │   ├── actions.ts                                 — 신규 (cancelBookingAction)
│   │   └── CancelForm.tsx                             — 신규 (RejectForm 세 번째 사용처 복붙)
│   └── seller/bookings/page.tsx                       — 3분기 라벨 + cancellationReason 박스
```

*총 7 파일 변경 (수정 4 + 신규 3).*

---

## 🚀 Day 23+ 미리보기

다음 방향 후보:
- **복붙 추출 (정리 Day)** — *진짜 세 사용처 도달* 후보 점검:
  - `RejectForm` 통합 (admin + seller booking + buyer cancel) = **3 사용처 도달** ✓
  - `extractMetadataString<K>` (extractRejectionReason 2 + extractToggleTo 1) = *3 사용처지만 시그니처 다름* (string vs boolean) → generic 으로 통합 가능
  - `STATUS_LABEL` 3분기 함수 (seller bookings + buyer bookings) = 2 사용처 → 추출 시기 X
- **페이지네이션** — Day 18/20 의 take 50 한계
- **시간 협상 / 메시지 스레드 활성화** — MessageThread 모델 활용 (시드만 있음)

**Day 23 권장 — 복붙 추출 (Day 21/22 의 *두 번 미룬* 정리 작업)**.

단 Day 21/22 의 *계획 재검토 정신* 따라 Day 23 진입 시점에 *각 후보의 사용처 정확 카운트* + *추출 가치* 재점검.

---

## 💡 Day 18~22 회고 — *기능 4 + 정리 1* 의 누적

| | Day | 종류 | events 패턴 | 의존성 종류 |
|---|---|---|---|---|
| Day 18 | 기능 | AuditLog 신규 | participated | 참조 |
| Day 19 | 정리 | url-filter 추출 | — | — |
| Day 20 | 기능 | SellerActivityLog 신규 | participated | 분기 |
| Day 21 | 기능 | Booking 셀러 액션 | extended (enum) | 참조 + 분기 |
| Day 22 | 기능 | Booking buyer 액션 | — (활동 이력 X) | 분기 |

*기능 4 : 정리 1* — *복붙 누적* 가 *4 Day 분량*. Day 23 정리 가치 ↑↑.

**누적된 복붙**:
- RejectForm-like × 3
- STATUS_LABEL cancelled 분기 × 2
- extractRejectionReason × 2
- $transaction 분기 의존성 패턴 × 3 (seller confirm, seller reject, buyer cancel)
- cancelled + 사유 박스 inline ternary × 2

**원칙**: "*기능 Day 누적* 후 *정리 Day* = *비교 후 추출* 의 자연 흐름. *복붙 4 Day 누적* 은 *진짜 패턴 발견* 의 *비교 가능 상태*. *Day 19 의 정신 (한 호흡 떨어져 비교)* 이 *Day 23 정리* 의 가치."

---

## ✅ 한 줄 요약

> **"*Day 21 의 복붙 추출 권장도 사용처 카운트 재점검으로 뒤집고* buyer 취소로 전환. cancelled 의 *양방향 대칭* 완성 (seller reject + buyer cancel). *컬럼 위치로 의미 자동 구분* (rejectionReason / cancellationReason). *Link 안 form 충돌 회피* + *부정 강도 색 시스템* + *RejectForm 세 번째 사용처 도달 후 추출 보류* 결정. *HMR WebSocket on LAN IP* 환경 트러블슈팅 누적."**

---

## 🧠 한 가지 회고 — *계획 재검토의 두 번 연속*

Day 21 → Day 22 의 *연속 계획 재검토* 가 Day 22 의 *가장 큰 메타 학습*.

**Day 20 → 21**:
- *페이지네이션 권장* 뒤집기
- 근거: 두 사용처 추출 = Day 19 정신 모순 + 시드 데이터 체감 X

**Day 21 → 22**:
- *복붙 추출 권장* 뒤집기
- 근거: 사용처 카운트 점검 시 모두 *2 이하*

**연속 두 번의 *재검토 패턴***:
- *plan 의 권장 작성 시점* = *작성 Day 의 추정*
- *다음 Day 진입 시점* = *재검토 시점*
- *추정 ≠ 검증* — 시간 차로 *근거 명료화*

**디자이너의 *디자인 리뷰* 와 같은 결**:
- 어제 그린 와이어프레임을 *오늘 다시 보면 어색한 곳* 발견
- *과거 자료 = 출발점, 현재 검토 = 결과점*
- *변덕 X, 진화*

**AI 의 *기억 함정* 회피**:
- *적힌 권장 = 자동 명령* 으로 작동할 수 있음
- *재검토 강제* = *진짜 사고 활성화*
- *plan 의 가치* = *맥락 제공*, *명령 X*

**Day 19 의 *세 번째 도달 후 추출*** + Day 21/22 의 *계획 재검토* = *비교 + 거리감 + 시간차* 의 *판단 품질* 정신.

코딩의 *합리적 의사결정* 은 *코드 안* 만이 아닌 *plan 의 자기 검토 + 환경 트러블슈팅 + 시드 보강* 모두 *학습 단위*. Day 22 의 0 단계 (계획 재검토) + 5 단계 (구조 변경) + 발견 9 (환경) + 발견 10 (시드 의도) = *코드 외 학습의 본격적 누적*.

---

*문서 끝. Day 23 으로 이어짐.*
