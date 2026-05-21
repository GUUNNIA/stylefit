# Phase 1A — Day 25 완료 보고서

> 작성일: 2026-05-21
> 작업 범위: 셀러 후기 보기 — 공개 후기 (service 상세) + 셀러 카드 받은 후기 박스
> 학습자: 디자인 전공 / 코딩 25일째

---

## 🎯 큰 그림 — Day 25가 한 일

```
[Day 13] Review 모델 + 시드 (액션 X, 표시 X)
[Day 24] Review 활성화 — buyer 작성 + 내 후기 표시
   ↓
[Day 25] 셀러 측 받은 후기 + service 상세 공개 후기 — 양방향 대칭 완성  ← 지금
   ↓
[Day 26+ 예정] 시간 협상 / 페이지네이션 / 공통 토글 추출 / 환경 설정
```

기능 ↔ 정리 리듬상 *기능 Day*. **읽기 화면 중심** — 액션 없음, *데이터 표시* 만. Day 24 까지 *데이터 생성* 중심이었다면 Day 25 는 *데이터 활용* 의 첫 본격 Day.

**계획 재검토의 *유지* 결정 세 번째** — Day 23/24/25 모두 plan 권장 그대로. Day 21/22 의 *뒤집기* 와 균형. *재검토 = 자동 변경 X* 정착 검증.

---

## 📅 Day 25 작업 요약

### 작업 단계 (9)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 계획 재검토 — Day 24 권장 *유지* (세 번째) | 정착 검증 |
| 1 | service 상세 페이지 구조 확인 (`/services/[id]/page.tsx`) | 후기 섹션 *위치 결정* (예약 아래) |
| 2 | findUnique + `aggregate` + `findMany take 5` + currentUser = **4 쿼리 Promise.all** | *Prisma aggregate 첫 도입* |
| 3 | 후기 섹션 UI — 평균 별점 (★) + 갯수 + 최신 5 + "아직 후기 없음" fallback | 별점 시각 시스템 |
| 4 | 5개 한계 안내 — "최신 5개만 표시 (전체 N개)" | 진실 표시, 미래 페이지네이션 트리거 |
| 5 | /seller/bookings findMany 에 review include 추가 | 비정규화 활용 |
| 6 | completed 카드에 *받은 후기 박스* (emerald) — Day 24 *내 후기 박스* 와 대칭 | 양방향 대칭 |
| 7 | 검증 — *환경 함정 없는 직선 Day* | TS 캐시 / EPERM / HMR 모두 X |
| 8 | 학습 문서 + 메모리 + 커밋 | |

---

## 🐛 Day 25 핵심 발견·논의

### 발견 1: ***Prisma `aggregate` 첫 도입*** — `_avg` + `_count` 한 쿼리 집계

평균 별점 + 후기 갯수를 *한 쿼리에서*:

```ts
const reviewStats = await prisma.review.aggregate({
  where: { booking: { serviceId } },
  _avg: { rating: true },
  _count: true,
})

// 결과
// reviewStats._avg.rating  → number | null  (0개면 null)
// reviewStats._count       → number
```

**Day 14 `groupBy` 와 같은 결**:
- Day 14: groupBy `verificationStatus` + `_count: true` → 상태별 갯수
- Day 25: aggregate (filter 적용) + `_avg` + `_count` → 통계

**Prisma 의 집계 도구 3 종**:

| 도구 | 용도 | 반환 |
|---|---|---|
| `count` | 단순 갯수 | number |
| `aggregate` | 다중 집계 (_avg, _sum, _min, _max, _count) | 객체 |
| `groupBy` | 그룹별 집계 | 배열 |

**aggregate 의 *type narrowing***:
- `_avg.rating: number | null` — *0 row 면 null* (수학적으로 평균 정의 X)
- `_count: number` — *0 row 면 0*
- `_sum.rating: number | null` — *0 row 면 null*
- `_min/max.rating: number | null` — *0 row 면 null*

**우리 코드의 안전 패턴**:
```tsx
{reviewStats._count > 0 ? (
  <span>★ {reviewStats._avg.rating?.toFixed(1)}</span>
  //                            ↑ 옵셔널 체인 — TypeScript narrowing 자동
) : (
  <p>아직 후기가 없습니다.</p>
)}
```

`_count > 0` 분기 안이라 *실제 null 아님* — 그래도 *Prisma 타입 nullable* 이라 옵셔널 체인 필요.

**원칙**: "*Prisma aggregate = 다중 집계의 표준 도구*. `_avg`, `_sum`, `_min`, `_max`, `_count` 의 *완전 셋트*. *0 row 시 null* 의 TypeScript 안전 패턴 = `_count > 0` 분기 + 옵셔널 체인. *DB 의 집계 함수* 를 *Prisma 의 직설적 API* 로 표현."

---

### 발견 2: ***Nested filter*** — Review.serviceId 비정규화 없이 *관계 거쳐서 필터*

Review 모델의 *직접 컬럼*:
- bookingId (FK)
- buyerId (비정규화)
- sellerProfileId (비정규화)
- rating, content, ...

**serviceId 직접 컬럼 *없음***. 그래도 *해당 service 의 후기만* 필터:

```ts
where: {
  booking: { serviceId },   // ← nested filter
}
```

**SQL 비교**:
```sql
-- nested filter 의 의미
SELECT * FROM reviews r
WHERE EXISTS (
  SELECT 1 FROM bookings b
  WHERE b.id = r.bookingId AND b.serviceId = ?
)
```

Prisma 가 *JOIN 또는 subquery* 로 변환. 호출 측은 *관계 그래프 표현* 만.

**비정규화 vs nested filter 의 트레이드오프**:

| 방식 | 장점 | 단점 |
|---|---|---|
| Review.serviceId 비정규화 추가 | 쿼리 단순 + 빠름 | schema 컬럼 +1, 생성 시 채워야 함 |
| nested filter | schema 안 건드림 | JOIN 비용, 인덱스 필요 |

**학습 단계 — nested 채택**:
- *schema 변경 부담 ↓*
- *Prisma 의 *관계 그래프 표현* 학습*
- *데이터 양 작아서 JOIN 비용 무시 가능*

**미래 진화 — 비정규화**:
- 데이터 양 ↑↑ + 자주 호출되는 쿼리 → 비정규화 가치 ↑
- *학습 단계 = 명료성*, *운영 단계 = 성능*

**Day 13 의 비정규화 패턴 회상**:
- Booking.sellerProfileId 비정규화 (Service.sellerProfileId 와 중복)
- Review.buyerId, sellerProfileId 비정규화 (Booking 거쳐서 알 수 있음)
- *비정규화 = 잦은 쿼리 가속*

**Day 25 의 *nested filter 선택*** — *비정규화 없이도 가능* 의 보존:
- 만약 *모든 관계 컬럼을 비정규화* 하면 schema 비대
- *진짜 잦은 쿼리* 만 비정규화 + *나머지는 nested*

**원칙**: "*비정규화 vs nested filter* = *성능 vs 명료성*. *학습 단계 = nested 우선*, *운영 단계 = 비정규화 도입*. *Prisma 의 관계 그래프 표현* 이 *데이터 모델의 자연 표현*. *모든 쿼리 비정규화 = schema 비대*, *진짜 hot path 만 비정규화* 가 균형."

---

### 발견 3: ***4 쿼리 Promise.all 확장*** — 병렬화의 누적

Day 11 service 상세 페이지: `Promise.all([service, user])` = 2 쿼리.

Day 25 확장: `Promise.all([service, reviewStats, recentReviews, user])` = **4 쿼리**.

**병렬화의 효과**:
- 4 쿼리 순차 = ~4 × T (각 쿼리 시간)
- 4 쿼리 병렬 = ~T (가장 느린 하나)
- *3-4 배 응답 시간 ↓* (이론적)

**Promise.all 의 *제한***:
- *서로 독립 쿼리만 병렬* — 한 쿼리가 다른 쿼리 결과 *참조* 하면 순차
- 우리 4 쿼리 = *모두 serviceId 만 의존* (서로 무관) → 병렬 안전

**대조 — Day 21 confirmBookingAction 의 `$transaction` callback**:
- transaction callback 안에서 *순차 read → update → log*
- *참조 의존* 이라 *순차 강제*

**Day 25 의 *완전 독립 = 병렬***:

```ts
const [service, reviewStats, recentReviews, user] = await Promise.all([
  prisma.service.findUnique({ where: { id: serviceId }, ... }),     // service 정보
  prisma.review.aggregate({ where: { booking: { serviceId } }, ... }),  // 집계
  prisma.review.findMany({ where: { booking: { serviceId } }, ... }),   // 최신 5
  getCurrentUser(),                                                    // 세션 user
])
```

**aggregate + findMany 의 *중복 작업*** — 두 쿼리 모두 *같은 reviews 테이블 + 같은 where*. *합칠 수 있나*?
- *합치기 어려움* — aggregate 는 *집계 결과*, findMany 는 *개별 row*. 다른 SQL.
- 또는 *findMany 만 사용 + 코드에서 집계*:
  ```ts
  const allReviews = await prisma.review.findMany({ where: { booking: { serviceId } } })
  const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
  const count = allReviews.length
  ```
  → *모든 reviews fetch* (페이지네이션 X) + *코드 reduce*

**우리 채택 — 두 쿼리 분리**:
- *aggregate 가 DB 에서 계산* (효율 ↑)
- *findMany take 5 = 최신 5 만* (데이터 ↓)
- 미래 *후기 1000개* 가정 시 *코드 reduce* 는 *모두 fetch* 부담

**원칙**: "*Promise.all 의 병렬화 효과* = *독립 쿼리 갯수 × 1 쿼리 시간 ↓*. *aggregate + findMany 분리* 는 *각자 최적 결과* (DB 집계 + 제한 fetch). *코드 reduce* 는 *데이터 양 작을 때만*. *DB 의 집계 함수 활용* 이 *Prisma 의 효율 본질*."

---

### 발견 4: ***공개 후기 = 진짜 마켓 기능*** — *셀러만 보는* 옵션과 대조

Day 24 plan 의 *후기 표시 3 위치 후보*:
- A: service 상세 *공개 후기* (모든 사용자)
- B: /seller/bookings *받은 후기 박스* (셀러 본인만)
- C: /seller/reviews *별도 페이지* (셀러 본인만)

**A 의 *진짜 마켓 가치***:
- *구매 결정 보조* — buyer 가 *서비스 선택 시* 후기 확인
- *마켓 신뢰* — 별점 + 갯수가 *서비스 품질 시각화*
- *셀러 동기 부여* — 좋은 후기 받으려는 서비스 품질 ↑

**B/C 의 *학습 의외 ↓***:
- *셀러 본인 reminder* — Day 21/22 의 *사유 박스* 패턴 반복
- *진짜 사용자 가치* (buyer 결정 보조) X

**Day 25 의 채택 = A + B 묶음**:
- A = 진짜 마켓 기능 (학습 가치 ↑↑)
- B = Day 24 buyer 내 후기 와 *대칭 완성* (작은 추가)
- C = 미래 Day (셀러의 *내 모든 후기 목록 페이지*)

**디자이너의 *판매 페이지 디자인* 직관 활용**:
- *상품 상세 페이지* = *행동 (구매/예약) + 결정 보조 (후기/스펙)*
- *후기 위치* = *행동 영역 아래* 가 일반적 (모바일 스크롤 자연)
- *평균 별점 + 갯수* = *한눈에 신뢰도 시각화*

**대조 — 셀러 측 후기 (B/C) 의 *역할***:
- *셀러 입장에서 후기* = *피드백 + 동기 부여*
- *별도 페이지 (C)* = *내 모든 후기 종합* — 미래 *셀러 대시보드* 같은 진화

**원칙**: "*후기의 진짜 가치 = 구매 결정 보조* (buyer 시각). *셀러 시각 후기* 도 의미 있지만 *부차적*. *마켓 기능 = 사용자 결정 도움*. *디자이너의 판매 페이지 직관* + *코딩의 데이터 노출 결정* = *동일 사고법*."

---

### 발견 5: ***양방향 대칭 패턴 누적*** — Day 21~25 의 4 사례

본인 액션 + 상대 시각의 *양방향 대칭* 누적:

| Day | buyer 측 | seller 측 |
|---|---|---|
| 21 | (없음) | 거절 사유 (본인 액션 reminder) |
| 22 | 내 취소 사유 (본인 액션) | buyer 취소 사유 (상대 시각) |
| 24 | 내 후기 박스 (본인 액션) | (Day 25 에 추가) |
| 25 | (Day 24 그대로) | 받은 후기 박스 (Day 24 와 대칭) |

**대칭 완성도 시각화**:

```
Day 21: seller 거절    →  seller 본인 reminder (rejection 사유 박스)
                       →  buyer 측 (Day 21 buyer/bookings 거절 사유 박스)
Day 22: buyer 취소     →  buyer 본인 reminder (내 취소 사유 박스)
                       →  seller 측 (Day 22 seller/bookings 취소 사유 박스)
Day 24: buyer 후기     →  buyer 본인 reminder (내 후기 박스)
                       →  seller 측 ← Day 25 에 추가
Day 25:                →  공개 후기 (service 상세, 모두에게)
```

**Day 25 가 *마지막 비대칭 채움***:
- Day 24 까지 *buyer 측만 내 후기 표시* — *seller 측 비어 있음*
- Day 25 가 *seller 받은 후기 표시* + *공개 후기 (시 상세)* 모두 채움
- *진짜 양방향 + 공개* 의 *완성*

**디자이너의 *대칭 디자인 시스템* 과 같은 결**:
- 채팅 앱의 *내 말풍선 + 상대 말풍선*
- 거래의 *판매자 시각 + 구매자 시각*
- *각 사용자 grupo 가 *대등한 정보* 보유* = 시스템의 *신뢰*

**왜 대칭 중요**:
- *정보 비대칭 = UX 불공정 신호* — "왜 셀러는 내 사유 보고 나는 셀러 사유 못 보지?"
- *모든 액션이 양방향 표시* = *마켓의 투명성*
- *디자인 시스템의 일관성 원칙*

**원칙**: "*양방향 대칭 = 마켓 시스템의 기본 정신*. *본인 액션 + 상대 시각* 항상 짝으로 디자인. *비대칭 = 의도된 결정* 일 때만 (예: admin 만 보는 audit log). *Day 21~25 의 누적* = *대칭 패턴의 자연 진화*."

---

### 발견 6: ***`_avg.rating` 의 null 가능성*** — TypeScript narrowing + 옵셔널 체인

Prisma aggregate 의 `_avg.rating` 타입:
```ts
_avg: { rating: number | null }
```

**왜 null** — *DB 의 AVG() 함수가 0 row 시 NULL 반환*:
```sql
SELECT AVG(rating) FROM reviews WHERE bookingId IN (없는_조건);
-- → NULL
```

**TypeScript 안전 패턴**:

```tsx
// 옵션 1 — 옵셔널 체인 (우리 채택)
{reviewStats._avg.rating?.toFixed(1)}
// → null 이면 undefined 출력 (빈 텍스트)

// 옵션 2 — fallback
{reviewStats._avg.rating?.toFixed(1) ?? "0.0"}

// 옵션 3 — 분기 안 호출 (count > 0 보장)
{reviewStats._count > 0 && (
  <span>{reviewStats._avg.rating?.toFixed(1)}</span>
  //                                ↑ 여기선 null 아님 (런타임), 옵셔널 체인은 TS 만족용
)}
```

**우리 패턴 — 옵션 3 + 옵션 1 결합**:
```tsx
{reviewStats._count > 0 ? (
  <span>★ {reviewStats._avg.rating?.toFixed(1)}</span>
) : (
  <p>아직 후기가 없습니다.</p>
)}
```

- *런타임*: count > 0 분기 안 → `_avg.rating` 실제로 *number*
- *컴파일*: TypeScript 가 *nullable 정보 유지* → 옵셔널 체인 필요
- *호출 측 안전* + *fallback 명시*

**Day 24 의 `if (!booking) return` 패턴과 같은 결**:
- *런타임 narrowing* 이 *TypeScript 추론* 으로 작동
- 코드가 *조건 보장 + 사용 패턴* 일관

**원칙**: "*Prisma aggregate 의 null 가능성* 은 *DB 의 의미적 정확성* (0 row 평균 = 정의 X). *TypeScript narrowing + 옵셔널 체인* 의 *2 단 안전*. *런타임 조건* + *컴파일 타입* 모두 *null 보호*."

---

### 발견 7: ***5개 한계 + 안내*** — 진실 표시 + 미래 페이지네이션 트리거

후기 표시 정책:
- `take: 5` — 최신 5 개만
- *후기 6개 이상 시* 안내 표시:
```tsx
{reviewStats._count > 5 && (
  <p className="mt-6 text-center text-xs text-zinc-500">
    최신 5개만 표시 (전체 {reviewStats._count}개)
  </p>
)}
```

**안내의 가치**:
- *사용자 인지* — *전체 갯수 vs 표시 갯수* 차이
- *5개 = 의도된 한계* — *데이터 손실 X*
- *미래 페이지네이션 트리거* — 안내가 *진짜 페이지네이션 도입 시* 자연 위치

**대안 — 안내 없음**:
- 최신 5 표시 + *끝* — *5개 가 전부인지 확신 X*
- *진실 표시 X* — 사용자 *혼란*

**원칙**: "*데이터 한계 표시 = 진실 표시*. *5개 만 표시 + 안내* > *5개 만 표시 + 침묵*. *사용자가 한계 인지* + *미래 페이지네이션 도입 시 자연 진화*. *한계의 명시* 가 *시스템 신뢰* 의 일부."

---

### 발견 8: ***셀러 받은 후기 = Day 24 buyer 내 후기 완전 대칭***

코드 비교:

```tsx
// Day 24 — buyer 측 /bookings 의 내 후기 박스
{b.status === BookingStatus.completed && b.review && (
  <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
    <strong>내 후기:</strong> {b.review.rating}점 — {b.review.content}
  </div>
)}

// Day 25 — seller 측 /seller/bookings 의 받은 후기 박스
{b.status === BookingStatus.completed && b.review && (
  <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
    <strong>받은 후기:</strong> {b.review.rating}점 — {b.review.content}
  </div>
)}
```

**완전 대칭**:
- 같은 조건 (completed + review)
- 같은 색 (emerald)
- 같은 표시 (rating + content)
- *카피만 다름* — "내 후기" / "받은 후기"

**Day 21/22 의 사유 박스 대칭과 같은 결**:
- "거절 사유:" (seller) / "거절 사유:" (buyer) — *같은 라벨, 다른 보는 사람*
- "취소 사유:" (seller 측 = buyer 취소) / "취소 사유:" (buyer 측 = 내 취소)

**카피 차이의 의미**:
- *"내 후기"* (buyer): 내 행동의 결과 표시
- *"받은 후기"* (seller): 상대 행동의 결과 표시
- *시점 차이 = 카피 차이*

**원칙**: "*같은 데이터 + 다른 시점 = 다른 카피*. *코드 구조 + 시각 스타일 동일* + *문맥적 어휘 차별*. *디자인 시스템의 일관성* + *UX 의 문맥 적응* 의 균형."

---

### 발견 9: ***읽기 화면 중심 Day*** — 액션 없이 *데이터 활용* 의 첫 본격 Day

Day 18-24 의 *액션 도입 누적*:
- Day 18: admin actions + AuditLog 작성
- Day 20: seller 활동 액션 + log 작성
- Day 21: booking confirm/reject 액션
- Day 22: buyer cancel 액션
- Day 24: complete 액션 + review 작성

Day 25 = ***액션 없음, 표시 만***:
- Prisma aggregate + findMany (읽기)
- UI 추가 (표시)
- 액션 / mutation / Server Action *모두 X*

**기능 Day 의 *두 종류***:

| | 액션 중심 | 표시 중심 |
|---|---|---|
| 작업 본질 | 데이터 *생성/변경* | 데이터 *드러내기* |
| 사용 도구 | Server Action + $transaction | findMany + aggregate |
| 의외 발견 | 분기 의존성, race condition | (Day 25 적었음 — aggregate null) |
| 시간 변동성 | 큼 | 작음 |

**Day 25 = 표시 중심 + 직선 작업** (Day 24 의 *액션 중심 직선* 과 다른 결의 직선):

**Day 24 의 직선** = 액션 패턴 안정화 결과 (Day 21 패턴 재현)
**Day 25 의 직선** = 표시 작업 자체가 *액션 의외 X*

**데이터 생성 → 활용의 *자연 흐름***:
- 데이터 모델 정의 (Day 13)
- 액션으로 데이터 생성 (Day 18-24)
- 활용 화면으로 표시 (Day 25+)

**디자이너의 *디자인 → 빌드 → 사용* 흐름과 같은 결**:
- 와이어프레임 (모델)
- 컴포넌트 빌드 (액션)
- 실제 사용 시나리오 (표시)

**원칙**: "*기능 Day 의 두 종류 = 액션 vs 표시*. *액션 중심 = 데이터 생성, 의외 발견 ↑*. *표시 중심 = 데이터 활용, 직선 작업*. *둘 다 학습 가치* — 액션은 *문제 해결력*, 표시는 *데이터 모델 + 디자인 직관*."

---

### 발견 10: ***계획 재검토 *유지* 3 번째*** — 정착 검증

| Day | plan 권장 | 진입 시 결정 |
|---|---|---|
| 21 | Day 20: 페이지네이션 | 뒤집기 (Booking 액션) |
| 22 | Day 21: 복붙 추출 | 뒤집기 (buyer 취소) |
| 23 | Day 22: 복붙 추출 | **유지** |
| 24 | Day 23: 완료+후기 | **유지** |
| 25 | Day 24: 셀러 후기 | **유지** |

**뒤집기 2 + 유지 3** = *재검토 = 자동 변경 X* 의 정착.

**유지의 *근거 점검 패턴***:
- Day 23: *진짜 3 사용처 도달 확인* → 유지
- Day 24: *Booking 사이클 완성 가치 확인* → 유지
- Day 25: *공개 후기 = 진짜 마켓 기능 확인* → 유지

**뒤집기의 *근거 점검 패턴***:
- Day 21: *시드 < 50 체감 X* + *두 사용처 추출 모순* → 뒤집기
- Day 22: *복붙 추출 사용처 카운트 부정확* → 뒤집기

**공통 정신** — *근거 점검*:
- 살아남으면 유지
- 무너지면 뒤집기
- *결과의 다양성 = 사고의 활성도*

**Day 19 의 url-filter 추출 시점 회상**:
- *세 번째 도달 후 추출* 원칙 = *판별의 기준*
- *기준이 명시* 되면 *재검토 = 기준 적용*
- *기준 없으면 재검토 = 변덕*

**plan 작성의 *진화***:
- Day 14-20: 모호한 권장 ("다음은 이런 거 어떨까")
- Day 22+: *카운트 명시 + 근거 명시 권장*
- *검증 가능한 plan = 재검토 가능*

**원칙**: "*계획 재검토 = 자동 변경 X, 근거 점검*. *5 Day 누적 (뒤집기 2 + 유지 3)* 의 *결과 다양성* = *재검토의 진짜 활성도*. *plan 의 카운트 + 근거 명시* 가 *검증 가능성*. *변경 자체가 가치라는 오해* vs *유지 자체가 가치라는 오해* 모두 함정."

---

## 🎓 새로 배운 개념 (Day 25)

### Prisma `aggregate` — 다중 집계
- `_avg`, `_sum`, `_min`, `_max`, `_count` 셋트
- *0 row 시 null* 의 TypeScript narrowing

### Nested filter
- `where: { booking: { serviceId } }` — 관계 거쳐서 필터
- 비정규화 vs nested 의 트레이드오프

### 4 쿼리 Promise.all
- *독립 쿼리 만큼 병렬화*
- *aggregate + findMany 분리* = 각자 최적

### 공개 후기 = 진짜 마켓 가치
- buyer 결정 보조 (셀러만 보는 후기와 대조)
- 디자이너의 *판매 페이지 디자인* 직관

### 양방향 대칭 패턴 누적 (4 사례)
- Day 21/22/24/25 의 본인+상대 시각
- *마켓 시스템의 기본 정신*

### `_avg.rating` 의 null 안전
- 옵셔널 체인 + count 분기
- *런타임 + 컴파일* 2 단 안전

### 5개 한계 + 안내 = 진실 표시
- *데이터 한계 명시*
- 미래 페이지네이션 트리거

### 셀러 받은 후기 = Day 24 대칭
- 같은 구조 + 카피만 다름
- *시점 차이 = 카피 차이*

### 읽기 화면 중심 Day
- 액션 X, 표시 만
- *데이터 생성 → 활용* 자연 흐름

### 계획 재검토 *유지* 3 번째
- 뒤집기 2 + 유지 3 = 정착
- *근거 점검의 결과 다양성*

---

## 📋 작성된 코드 핵심

```ts
// /services/[id]/page.tsx — 4 쿼리 Promise.all + aggregate + nested filter
const [service, reviewStats, recentReviews, user] = await Promise.all([
  prisma.service.findUnique({
    where: { id: serviceId },
    include: { sellerProfile: { include: { user: { select: { name: true } } } } },
  }),
  prisma.review.aggregate({
    where: { booking: { serviceId } },  // ← nested filter
    _avg: { rating: true },
    _count: true,
  }),
  prisma.review.findMany({
    where: { booking: { serviceId } },
    include: { buyer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  }),
  getCurrentUser(),
])
```

```tsx
// 후기 섹션 — 평균 + 갯수 + 최신 5 + fallback + 한계 안내
<section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
  <h2 className="text-xl font-bold tracking-tight">후기</h2>

  {reviewStats._count > 0 ? (
    <>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-amber-600">
          ★ {reviewStats._avg.rating?.toFixed(1)}      {/* ← 옵셔널 체인 */}
        </span>
        <span className="text-sm text-zinc-500">
          후기 {reviewStats._count}개
        </span>
      </div>

      <ul className="mt-6 space-y-4">
        {recentReviews.map((r) => (
          <li key={r.id} className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-zinc-900">{r.buyer.name}</span>
              <span className="text-xs text-zinc-500">
                {r.createdAt.toLocaleDateString("ko-KR")}
              </span>
            </div>
            <div className="mt-1 text-sm text-amber-600">★ {r.rating}</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{r.content}</p>
          </li>
        ))}
      </ul>

      {reviewStats._count > 5 && (
        <p className="mt-6 text-center text-xs text-zinc-500">
          최신 5개만 표시 (전체 {reviewStats._count}개)
        </p>
      )}
    </>
  ) : (
    <p className="mt-4 text-sm text-zinc-500">아직 후기가 없습니다.</p>
  )}
</section>
```

```tsx
// /seller/bookings/page.tsx — 받은 후기 박스 (Day 24 buyer 내 후기 와 완전 대칭)
{b.status === BookingStatus.completed && b.review && (
  <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
    <strong>받은 후기:</strong> {b.review.rating}점 — {b.review.content}
  </div>
)}
```

---

## 📁 변경된 파일

```
stylefit/
└── app/
    ├── services/[id]/page.tsx         — 4 쿼리 Promise.all + 후기 섹션 + fallback
    └── seller/bookings/page.tsx       — review include + 받은 후기 박스
```

*총 2 파일 변경 (수정 2 + 신규 0).*

마이그레이션 없음, 신규 파일 없음, 액션 없음 — *읽기 화면 중심 Day* 의 자연 결과.

---

## 🚀 Day 26+ 미리보기

다음 방향 후보:

**기능 후보**:
- *시간 협상* (MessageThread 활성화) — 새 도메인 첫 진입, 큰 범위
- *완료 처리 시점 검증* — preferredDatetime 지난 booking 만 완료 가능? (작은 검증)
- */seller/reviews 별도 페이지* (C 옵션) — 내 모든 후기 목록 (페이지네이션 트리거)
- *셀러 평균 별점 표시* — 셀러 프로필에 *받은 모든 후기 평균* (aggregate 확장)

**정리 후보**:
- *공통 토글 패턴 추출* — ReasonForm + ReviewForm (2 사용처 — 시기상조)
- *페이지네이션* — Day 18/20/25 의 5/50 한계
- *환경 설정 영구 해결* — LAN IP HMR 함정

**Day 26 권장 — 페이지네이션 또는 시간 협상**:
- *페이지네이션* = Day 18 audit-log + Day 20 activity-log + Day 25 후기 = **3 사용처 도달 ✓**. 진짜 추출 시점.
- *시간 협상* = MessageThread 새 도메인, 큰 학습 가치

페이지네이션이 *진짜 3 사용처 도달* 이라 *Day 23 추출 패턴* 재현 가능. *Day 26 = 정리 Day 자연*.

단 Day 21-25 의 *계획 재검토 정신* 따라 Day 26 진입 시 다시 따짐.

---

## 💡 Day 13·24·25 회고 — *Review 모델의 호 그래프*

| Day | Review 의 상태 |
|---|---|
| 13 | 모델 정의 + 시드 3개 (사용 X) |
| 14-23 | *침묵* — 액션 X, 표시 X |
| 24 | *활성화* — buyer 작성 + 내 후기 표시 |
| 25 | *완성* — seller 받은 후기 + 공개 후기 |

**12 Day 의 *모델 호 그래프***:
- 도입 (Day 13)
- 침묵 (Day 14-23)
- 활성화 (Day 24)
- 완성 (Day 25)

**Day 24 의 발견 4 (*모델 도입과 활성화의 시간 차*) 의 *완성형***:
- Day 13: *데이터 모델 = 사전 디자인*
- Day 24: *흐름 의존성 (completed) 도달 후 활성화*
- Day 25: *양방향 + 공개 = 활용 단계*

**Booking 도메인의 호 그래프 (Day 13-24) 와 비교**:

| | Booking (11 Day) | Review (12 Day) |
|---|---|---|
| 도입 | Day 13 | Day 13 |
| 액션 도입 | Day 18-22 (4 Day) | Day 24 (1 Day) |
| 표시 완성 | Day 24 | Day 25 |
| 의외 발견 ↑ | Day 18-22 (확장 단계) | Day 25 (작음) |

*Review 의 *짧은 활성화* — Booking 의 *호상 누적* 후라 *모델 안정* + *액션 패턴 안정* 활용. *후발 모델의 효율*.*

---

## ✅ 한 줄 요약

> **"*Review 모델의 완성형* — Day 13 도입 + Day 24 활성화 + Day 25 공개+대칭 완성. *Prisma aggregate 첫 도입* (`_avg` + `_count`) + *nested filter* (`booking: { serviceId }`) + *4 쿼리 Promise.all*. *공개 후기 = 진짜 마켓 가치* + *셀러 받은 후기 = Day 24 buyer 와 완전 대칭*. *읽기 화면 중심 Day* — 액션 없이 *데이터 활용* 의 첫 본격."**

---

## 🧠 한 가지 회고 — *데이터 생성에서 활용으로의 전환*

Day 18~24 의 *액션 중심* 누적 후 Day 25 = *표시 중심* 의 첫 본격.

**액션 Day 의 *작업 본질***:
- 데이터 *생성/변경* 의 흐름 도입
- $transaction, race condition, 권한 격리, 멱등성
- *백엔드 안전성* 중심 학습

**표시 Day 의 *작업 본질***:
- 데이터 *드러내기* — UI + 쿼리 패턴
- aggregate, nested filter, Promise.all
- *사용자 가치 노출* 중심 학습

**둘의 *학습 가치 분포***:

| | 액션 Day (Day 18-24) | 표시 Day (Day 25+) |
|---|---|---|
| 의외 발견 | 많음 (분기 의존성, race, 환경) | 적음 (aggregate null) |
| 패턴 추출 | 풍부 ($transaction 패턴들) | 작음 (병렬화) |
| 사용자 가치 | 간접 (행동 가능성) | 직접 (정보 노출) |
| 디자인 직관 | 적음 (백엔드 중심) | 풍부 (마켓 페이지 디자인) |

**디자이너의 *시각 → 기능* 의 *역방향* 학습 흐름**:
- 일반 디자이너 = *시각 우선, 백엔드 학습 부담*
- *액션 Day 부터 학습* = *백엔드 안전성 먼저, 시각 위계 후*
- *표시 Day 도달* = *백엔드 안전성 안정 후 시각 강조*

**Day 25 의 *디자이너 직관 활용*** 가치:
- 후기 섹션 *위치 결정* (예약 아래)
- 평균 별점 *시각 위계* (★ 큰 글자 + 갯수 작은 글자)
- 5 개 한계 + 안내 *진실 표시*
- 별점 색 (amber) 의미 시스템

*Booking 의 액션 누적 (Day 18-24)* + *Review 의 표시 완성 (Day 25)* = *학습의 균형*. 액션 = *코딩의 본질*, 표시 = *디자인의 본질*. 둘 다 *코딩 학습의 양 날개*.

코딩 학습의 *진짜 완성* = *데이터 모델 + 액션 + 표시* 의 *세 축*. Day 25 가 *표시 축의 첫 본격* — 다음 Day 들은 *세 축의 균형 진화*.

---

*문서 끝. Day 26 으로 이어짐.*
