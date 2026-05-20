# Phase 1A — Day 20 완료 보고서

> 작성일: 2026-05-20
> 작업 범위: 셀러 자기 활동 이력 — `SellerActivityLog` 모델 + 세 액션 $transaction + 조회 페이지
> 학습자: 디자인 전공 / 코딩 20일째

---

## 🎯 큰 그림 — Day 20이 한 일

```
[Day 18] admin /audit-log — 운영자 *심사 결정* 추적 (events + polymorphic + $transaction)
   ↓
[Day 19] url-filter.ts 추출 — 세 사용처 공통 헬퍼 (정리 Day)
   ↓
[Day 20] seller /activity-log — *셀러 입장* 의 events. Day 18 의 *자연 확장*  ← 지금
   ↓
[Day 21+ 예정] 진짜 페이지네이션? Booking 흐름?
```

기능 ↔ 정리 리듬의 *세 번째 기능 Day*. Day 18 패턴의 *두 번째 사용* + Day 19 헬퍼의 *두 번째 적용* — *재현으로 정착 검증*.

---

## 📅 Day 20 작업 요약

### 작업 단계

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 1 | `SellerActivityLog` 모델 + `SellerActivity` enum (스키마) | *AuditLog 와 분리 결정* — 권한·의미 다른 도메인 |
| 2 | 마이그레이션 + seed deleteMany 순서 | FK Restrict 의 첫 번째 효과 |
| 3 | `/seller/services/new` actions — $transaction *참조 의존성* | Day 18 패턴 재현 (service.id → log) |
| 4 | `/seller/services/[id]/edit` actions — $transaction *분기 의존성* | 새 패턴: count > 0 일 때만 log |
| 5 | `/seller/services` actions (토글) — $transaction *분기 의존성* | 새 패턴: race-safe set + 활동 추적 조화 |
| 6 | `/seller/activity-log` 페이지 — Day 18 audit-log 의 셀러판 | Day 19 헬퍼 3종 재사용 + 단일 도메인 단순화 |
| 7 | `/seller/services` 헤더에 진입 링크 | 도달 가능성 |
| 8 | (세션 중간) 컴퓨터 꺼짐 → 다음 세션에 *변수 shadowing 버그* 발견·수정 | *destructure 의 가치* |

---

## 🐛 Day 20 핵심 발견·논의

### 발견 1: ***AuditLog 와 분리*** — 같은 events 데이터, 다른 도메인

**유혹**: `AuditLog` 의 `actorId` 를 셀러로, `targetType: "Service"` 그대로 — *재사용* 가능해 보임.

**분리 결정 이유**:

| 축 | AuditLog | SellerActivityLog |
|---|---|---|
| 주체 | admin (운영자) | seller (본인) |
| 권한 | admin 만 조회 | 셀러는 *본인 것만* |
| 대상 | polymorphic (Service\|Seller) | 단일 (Service) |
| UX 의미 | *심사 추적* | *내 변경 이력* |
| 액션 어휘 | approved/rejected/reverted | created/updated/toggled |

**같은 *events 패턴* 이지만 *의미·권한·UX* 가 다른 도메인.** 한 테이블에 합치면:
- 권한 분기가 *조회 시점* 의 where 에 모두 의존 — *누군가 빠뜨리면 큰 사고*
- enum 이 합쳐져 *의미가 흐려짐* (approved 는 seller 이력에 등장 X 인데 schema 가 허용)
- 미래에 *셀러 활동에 별도 필드 추가* 시 (예: 변경 전/후 snapshot) 운영자 로그까지 schema 늘림

**원칙**: "*같은 추상 패턴 (events) 이라도* *주체·권한·의미* 가 다르면 *분리*. *DB 정규화* 가 아니라 *도메인 정규화*. *재사용 유혹* 보다 *경계 명확성* 우선."

---

### 발견 2: ***FK Restrict 의 첫 번째 효과*** — polymorphic N+1 회피 패턴 불필요

Day 18 의 `AuditLog` 는 *manual targetId* + polymorphic target → 운영자가 *서비스 삭제* 해도 *로그는 유지* (FK 없음). 그래서 *id 종류별로 in:[...] 한 번씩* fetch + Map lookup 패턴이 필요했음.

Day 20 의 `SellerActivityLog` 는 *Service FK 직결 + Restrict* → 로그 남은 서비스는 *DB 가 삭제를 거부*. 그래서:

```ts
// ❌ Day 18 패턴 (불필요한 복잡도)
const serviceIds = logs.filter(...).map(...)
const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } })
const serviceMap = new Map(services.map(s => [s.id, s.title]))

// ✅ Day 20 — 자연 조인
const logs = await prisma.sellerActivityLog.findMany({
  include: { service: { select: { id: true, title: true } } },
})
// 그냥 log.service.title — Restrict 라 null 가능성도 없음
```

**같은 events 패턴이 *FK 정책 한 줄* 차이로 *전혀 다른 쿼리 패턴*** 이 됨.

**원칙**: "*FK Restrict 는 단순 데이터 보호 X*. *코드 패턴* 까지 결정. *target 이 단일 도메인* + *삭제 불가 보장* → *복잡한 polymorphic 패턴 회피*. *데이터 모델이 코드 모양을 정한다* 의 또 다른 사례 (Day 18 의 정신 재확인)."

---

### 발견 3: ***분기 의존성*** — `$transaction` interactive callback 의 새 사용처

Day 18 에서 배운 interactive callback 의 이유는 *참조 의존성* (방금 만든 `service.id` 를 log 에 써야).

Day 20 에서 *두 번째 사용처* 등장 — *분기 의존성*:

```ts
// edit/actions.ts — updateMany count 로 분기
const count = await prisma.$transaction(async (tx) => {
  const { count } = await tx.service.updateMany({...})

  // count > 0 — 본인 소유 진짜 수정됨. log 만듦.
  // count === 0 — 남의 ID 조작 시도. log 안 만듦 (*유령 로그* 방지).
  if (count > 0) {
    await tx.sellerActivityLog.create({...})
  }

  return count
})
```

**sequential array 로는 불가능**:
- `prisma.$transaction([query1, query2])` 는 *두 query 가 독립* 일 때만 가능
- 첫 query 결과로 *두 번째 query 실행 여부* 결정 → 반드시 callback

**Day 18 vs Day 20 의존성 종류**:

| 종류 | 예시 | 패턴 |
|---|---|---|
| 독립 | admin approve: service.update + auditLog.create (FK 이미 알고 있음) | sequential array |
| 참조 의존 | seller create: service.create → log 에 service.id 참조 | callback |
| 분기 의존 | seller edit/toggle: count > 0 일 때만 log | callback |
| 후속 의존 | (미래) 첫 query 결과의 *값 변환* 후 두 번째 | callback |

**원칙**: "*Interactive callback 의 비용* 은 *추상화 부담* — 단순 array 보다 코드 길어짐. *그 비용을 정당화* 하는 건 *참조* 또는 *분기* 의존성. 비용 없이 *항상 callback* 도, 의존성 있는데 *억지로 array* 도 모두 X. *의존성 종류로 결정*."

---

### 발견 4: ***변수 shadowing 버그*** — 컴퓨터 꺼지기 전 미발견, 다음 세션에 발견·수정

세션 중간에 컴퓨터가 꺼졌고, 다음 세션 시작 시 `git diff` 보다가 발견:

```ts
// ❌ 컴퓨터 꺼질 때 상태
const count = await prisma.$transaction(async (tx) => {
  const result = await tx.service.updateMany({   // ← 외부 Zod `result` shadow
    where: { ... },
    data: {
      title: result.data.title,  // ← TDZ / 타입 에러!
      //     ↑ 어떤 result? inner result 는 {count: number} 라 .data 없음
      ...
```

**원인**: 액션 *상단부* 의 `const result = UpdateServiceSchema.safeParse(raw)` 와 *transaction 내부* 의 `const result = await tx.service.updateMany(...)` 가 *같은 이름*. inner 가 outer 를 가림 + inner 타입에 `.data` 없음.

**런타임 에러 종류**:
- *TDZ ReferenceError* 또는 *TypeError: Cannot read .data of undefined*
- TypeScript 에서도 *컴파일 에러* — outer Zod `result.data` 는 OK 지만 inner shadow 후 `.data` 없음

**수정** — outer 와 *원본 코드* 의 destructure 패턴 모두 살리는 길:

```ts
// ✅ destructure → 이름 충돌 자체 없음
const count = await prisma.$transaction(async (tx) => {
  const { count } = await tx.service.updateMany({  // ← 객체 result 안 받음
    where: { ... },
    data: { title: result.data.title, ... },       // ← outer Zod result 사용
  })

  if (count > 0) { ... }
  return count
})
```

원래 Day 15 코드가 *이미 destructure 패턴* (`const { count } = await prisma.service.updateMany(...)`) 이었음. Day 20 작업 중 *transaction 으로 감싸면서* destructure 가 풀려서 `const result = ` 로 변형되며 사고가 났음.

**원칙**: "*변수 이름 충돌* 은 *컴파일·런타임 에러* 의 흔한 원인. *외부 변수와 같은 이름* 의 inner 변수는 *반드시 피하거나 destructure 로 명시*. 특히 *큰 변수* (`result`, `data`) 는 *외부에서 의미가 큰 컨텍스트* 라 *내부에서 재사용 위험*. *destructure 가 이름 충돌 자동 회피*."

**더 큰 원칙**: "*세션 종료 전 검증* (빌드/타입체크/실제 동작) 의 가치. *작업 중 컴퓨터 꺼짐* 같은 *예측 못한 종료* 시 *미검증 코드* 가 남음. *다음 세션의 첫 작업 = 검증* 으로 *복원* 가능."

---

### 발견 5: ***명시 set + 활동 로그*** 의 조화 — race-safe 정신 유지

토글 액션의 *명시 set* 패턴 (Day 15) 핵심: *현재 isActive read 안 함*. 두 탭에서 동시 토글해도 *마지막 클릭 그대로 적용* (race-safe).

활동 로그 추가 시 *유혹*: *현재값과 다를 때만* 로그 → 더 깔끔. 하지만:

```ts
// ❌ read-then-write — race-safe 정신 깨짐
const current = await tx.service.findUnique({ where: { id } })
if (current.isActive !== nextActive) {
  await tx.service.update(...)
  await tx.sellerActivityLog.create(...)
}
```

→ *현재값 read* 하는 순간 *Day 15 정신 깨짐*. 두 탭 race condition 다시 들어옴.

**채택한 정책**: `updateMany count > 0` 면 무조건 로그 (현재값 무관)
- 본인 소유 확인 = updateMany 의 복합 where 가 *count 로 자동 확인*
- 같은 값 set (활성 → 활성) 도 *로그* — *셀러의 의도된 액션* 자체를 추적
- 약간의 noise (무한 토글 클릭) 는 감수 — *race-safe 가 더 큰 가치*

**metadata 로 방향 보존**:
```ts
metadata: { to: nextActive }  // 조회 시 "활성화"/"비활성화" 분리 표시
```

**원칙**: "*레이어 간 정신 충돌* 을 *발견하는 게* 설계의 핵심. *race-safe (Day 15)* + *완벽한 로그 (Day 20)* 가 *겉으로는 양립* 같지만 *현재값 read* 라는 한 줄에서 부딪힘. *어느 쪽이 더 큰 가치* 인지 판단 → *race-safe 우선, noise 수용*."

---

### 발견 6: ***복합 인덱스의 첫 검증*** — `(sellerProfileId, createdAt)`

Day 18 의 AuditLog 인덱스는 `createdAt` 단일 — *전체 시간순* 만 빠름. 셀러별 필터 후 정렬은 *부분 활용* 에 그쳤음 (admin 시점이라 전체가 자연이라 OK).

Day 20 은 *셀러별 격리* 가 *모든 쿼리* 의 1순위 조건:
```ts
where: { sellerProfileId: sellerProfile.id, ...filter }
orderBy: { createdAt: "desc" }
```

→ 복합 인덱스 `(sellerProfileId, createdAt)` 가 *정확히 매칭*:
- 1차: sellerProfileId 로 *그 셀러 row 만 격리*
- 2차: createdAt 으로 *그 안에서 정렬*

**단일 createdAt 인덱스** 였다면:
- 전체 row 를 시간순 정렬 → *그 후* sellerProfileId 필터 = *전체 스캔 + 필터*
- 셀러 한 명이 *수십 row* 인데 *전체 수만 row* 를 정렬해야 함

**Day 18 → Day 20 인덱스 설계 진화**:

| Day | 인덱스 | 핵심 쿼리 | 적합성 |
|---|---|---|---|
| 18 | `createdAt` 단일 | 전체 시간순 (admin) | ✓ 정확히 매칭 |
| 20 | `(sellerProfileId, createdAt)` 복합 | 셀러별 시간순 (seller) | ✓ 정확히 매칭 |

**원칙**: "*인덱스 설계 = 핵심 쿼리의 그림 그대로 따라가기*. *전체 정렬* 인지 *그룹별 정렬* 인지가 *단일 vs 복합* 의 결정점. *Day 18 의 인덱스를 그대로 복붙* 했다면 셀러별 조회가 *느렸음*. *도메인이 다르면 인덱스도 다름*."

---

### 발견 7: ***Day 19 헬퍼의 두 번째 자기 검증*** — url-filter.ts 가 또 한 사용처에 자연 적용

Day 19 가 *세 사용처 도달 후* 추출했음. Day 20 의 `/seller/activity-log` 는 *네 번째 사용처* — 추출 후 *첫 신규 사용*:

```ts
import { buildUrl, chipClass, validateEnumParam } from "@/app/lib/url-filter"

const ACTIVITY_VALUES: readonly SellerActivity[] = Object.values(SellerActivity)
const activity = validateEnumParam(rawActivity, ACTIVITY_VALUES)

href={buildUrl("/seller/activity-log", { activity: a })}
className={chipClass(activity === a)}
```

**Day 19 의 *시그니처 통일* 효과를 *이제 체감***:
- 새 도메인 적용 시간 = *함수 시그니처 한 번 읽기*
- *코드 줄 추가* = ~5 줄 (import + 한 줄씩)
- *실수 가능성* = 0 (함수가 강제하는 패턴)

**Day 19 의 *명시 타입* 학습도 즉시 사용**:
```ts
const ACTIVITY_VALUES: readonly SellerActivity[] = Object.values(SellerActivity)
// ↑ readonly SellerActivity[] 명시 — Day 19 학습 그대로 적용
```

**원칙**: "*진짜 추출은 두 번째 사용 시점에 검증*. 추출 *그 자리* 에서는 *세 사용처가 같아 보였을* 뿐. *새 사용처에 자연스럽게 적용되는가* 가 *추상화 질의 진짜 시험*. Day 20 의 자연스러운 적용 = Day 19 의 추출이 *진짜였다* 는 증거."

---

### 발견 8: ***본인 격리 = where 의 1순위 안전장치***

`/seller/activity-log` 의 where:
```ts
const where = {
  sellerProfileId: sellerProfile.id,    // ← 항상 들어감 (필터 무관)
  ...(activity ? { activity } : {}),    // ← 필터 (선택적)
}
```

**일반 필터 (activity) 와 본인 격리 (sellerProfileId) 의 차이**:
- 필터: *없으면 전체 표시* — 사용자 선택
- 격리: *없으면 사고* — 다른 셀러 로그까지 보임

**Day 19 의 *빈 객체 spread* 패턴** 은 *둘 다 표현 가능* 하지만 *의도가 달라야*:

```ts
const where = {
  sellerProfileId: sellerProfile.id,        // ← 무조건 들어감 (안전장치)
  ...(activity ? { activity } : {}),        // ← 조건부 (사용자 필터)
}
```

*위치* 로 *의도* 표현 — 무조건 들어가는 키는 *spread 밖*, 조건부는 *spread*. 코드 읽는 사람이 *위치 → 의미* 직관.

**원칙**: "*격리 (security)* 와 *필터 (UX)* 는 *코드 위치로 구분*. 둘 다 *같은 where 객체* 지만 *spread 패턴 안과 밖* 의 의미가 다름. *spread 밖에 있으면 절대 빠지지 않음* — 코드 리뷰 시 *spread 밖 키가 격리 키인지* 확인 = *권한 누락 사고 방지* 의 1차 체크포인트."

---

### 발견 9: ***도달 가능성*** — UI 진입 링크의 가치

페이지를 만들었어도 *링크가 없으면 사용자가 모름*. URL 직접 입력해야 하는 페이지는 *존재하지 않는 거나 마찬가지*.

`/seller/services` 헤더에 *subtle 한 텍스트 링크* 추가:
```tsx
<Link href="/seller/activity-log" className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline">
  활동 이력
</Link>
```

**디자인 결정**:
- *기본 버튼이 아닌 텍스트 링크* — *주요 액션* (새 서비스 등록) 보다 *부차적* 임을 시각적으로 표현
- *헤더 우측 정렬* — 페이지 액션 영역의 자연 위치
- *gap-3* 으로 새 서비스 버튼과 *간격*

**대조 — Day 18 admin/audit-log 는 진입 링크 없음** (URL 직접). 같은 결정이 *셀러 화면* 에서 다른 이유:
- admin 은 *전문 사용자* — URL 알면 OK
- seller 는 *일반 사용자* — 도달 가능성 우선
- *학습 단계 프로젝트* 라서가 아니라 *진짜 UX 차이*

**원칙**: "*존재 = 도달 가능성*. *기능을 만들었어도* *링크 없으면* 0 사용. *주요 vs 부차* 시각 위계로 *우선순위* 표현. *동일 패턴이 도메인마다 다른 결정* — admin (전문) vs seller (일반)."

---

## 🎓 새로 배운 개념 (Day 20)

### Events 패턴의 *분리 결정*
- *같은 events 모델* 도 *주체·권한·의미* 다르면 *분리*
- DB 정규화 X, *도메인 정규화*

### FK Restrict 의 코드 영향
- *target 삭제 불가 보장* → *polymorphic N+1 패턴 불필요*
- 데이터 모델이 *코드 모양* 까지 결정

### `$transaction` 의 세 가지 의존성
- 독립 → sequential array
- 참조 의존 → callback (Day 18 학습)
- 분기 의존 → callback (Day 20 새 학습)

### 변수 shadowing 의 위험
- *외부 변수와 같은 이름* inner 변수 → *컴파일·런타임 에러*
- *destructure* 가 *자동 회피* 수단

### 세션 종료 전 검증의 가치
- 컴퓨터 꺼짐 등 *예측 못한 종료* 대비
- *다음 세션 첫 작업 = 검증* 으로 복원

### Race-safe + 활동 로그의 조화
- *현재값 read* 유혹 거부 — Day 15 정신 유지
- *count > 0 → 무조건 log* + metadata 로 방향 보존

### 복합 인덱스 vs 단일 인덱스
- *전체 정렬* → 단일 인덱스 (Day 18)
- *그룹별 정렬* → 복합 인덱스 (Day 20)
- 도메인이 다르면 *인덱스도 다름*

### 추출의 *두 번째 사용 검증*
- Day 19 추출이 *두 번째 사용* 에 자연 적용 = *진짜 추출이었다는 증거*
- *추출 그 자리* 가 아닌 *나중 사용* 이 진짜 시험

### 격리 (security) vs 필터 (UX) 구분
- *코드 위치* 로 *의도* 표현
- *spread 밖 = 무조건, spread 안 = 조건부*

### 도달 가능성 = 존재 조건
- *링크 없는 페이지* = 0 사용
- *주요 vs 부차* 시각 위계로 우선순위 표현

---

## 📋 작성된 코드 핵심

```prisma
// schema.prisma — SellerActivityLog 모델
model SellerActivityLog {
  id              Int             @id @default(autoincrement())
  sellerProfileId Int                                            // 활동의 주체
  activity        SellerActivity                                 // 무엇을 했나
  serviceId       Int                                            // 어떤 서비스에 대한
  metadata        Json?                                          // toggled 의 to: bool 등
  createdAt       DateTime        @default(now())

  sellerProfile   SellerProfile   @relation(fields: [sellerProfileId], references: [id])
  service         Service         @relation(fields: [serviceId], references: [id])

  @@index([sellerProfileId, createdAt])   // 복합 — 셀러별 시간순 핵심 쿼리
  @@map("seller_activity_logs")
}

enum SellerActivity {
  created
  updated
  toggled
}
```

```ts
// edit/actions.ts — $transaction 분기 의존성 + destructure (shadowing 회피)
const count = await prisma.$transaction(async (tx) => {
  const { count } = await tx.service.updateMany({
    where: { id: serviceId, sellerProfileId: sellerProfile.id },
    data: { title: result.data.title, ..., verificationStatus: "pending" },
  })

  if (count > 0) {
    await tx.sellerActivityLog.create({
      data: { sellerProfileId: sellerProfile.id, activity: SellerActivity.updated, serviceId },
    })
  }

  return count
})
```

```ts
// seller/services/actions.ts — race-safe set + 활동 로그
await prisma.$transaction(async (tx) => {
  const { count } = await tx.service.updateMany({
    where: { id: serviceId, sellerProfileId: sellerProfile.id },
    data: { isActive: nextActive },             // ← 현재값 read X (race-safe)
  })

  if (count > 0) {
    await tx.sellerActivityLog.create({
      data: {
        sellerProfileId: sellerProfile.id,
        activity: SellerActivity.toggled,
        serviceId,
        metadata: { to: nextActive },           // ← 방향 보존
      },
    })
  }
})
```

```ts
// /seller/activity-log/page.tsx — 본인 격리 + 단일 도메인 자연 조인
const where = {
  sellerProfileId: sellerProfile.id,            // ← spread 밖 (무조건)
  ...(activity ? { activity } : {}),            // ← spread 안 (조건부)
}

const logs = await prisma.sellerActivityLog.findMany({
  where,
  orderBy: { createdAt: "desc" },
  take: 50,
  include: { service: { select: { id: true, title: true } } },   // ← Restrict 라 fallback X
})

// toggled 만 metadata.to 로 방향 분기
const toggledTo = log.activity === SellerActivity.toggled ? extractToggleTo(log.metadata) : null
const badgeLabel =
  toggledTo === true  ? "활성화"
  : toggledTo === false ? "비활성화"
  : ACTIVITY_LABEL[log.activity]
```

---

## 📁 변경된 파일

```
stylefit/
├── prisma/
│   ├── schema.prisma                                — SellerActivityLog 모델 + SellerActivity enum
│   ├── migrations/20260520081924_add_seller_activity_log/
│   │   └── migration.sql                            — 신규 (CREATE TABLE + 복합 INDEX)
│   └── seed.ts                                      — sellerActivityLog.deleteMany 순서 추가
├── app/
│   ├── seller/
│   │   ├── activity-log/page.tsx                    — 신규 (조회 페이지)
│   │   └── services/
│   │       ├── page.tsx                             — "활동 이력" 진입 링크
│   │       ├── actions.ts                           — 토글에 $transaction + log
│   │       ├── new/actions.ts                       — 등록에 $transaction + log (참조 의존)
│   │       └── [id]/edit/actions.ts                 — 수정에 $transaction + log (분기 의존)
```

*총 7 파일 변경 (수정 5 + 신규 2).*

---

## 🚀 Day 21+ 미리보기

다음 방향 후보:
- *진짜 페이지네이션* — Day 18/20 의 *take 50* 한계 해결. URL `?page=` 기반. *셀러 + admin 두 곳 동시 적용* (Day 19 처럼 *세 사용처 → 추출* 가능)
- *Booking 흐름 진짜 구현* — 현재 시드만. 셀러의 *예약 확정/거절* 액션 → SellerActivityLog 또 한 사용처
- *셀러 변경 snapshot* — 현재는 *액션만* 기록. *변경 전/후* metadata 추가 → 더 풍부한 이력

Day 18 → 19 → 20 의 *기능·정리·기능* 리듬 따라 Day 21 은 *정리* 차례. *페이지네이션* 이 *세 사용처 추출* 후보로 가장 자연.

---

## 💡 Day 18·20 회고 — *Events 패턴의 두 사용*

| | Day 18 (admin /audit-log) | Day 20 (seller /activity-log) |
|---|---|---|
| 주체 | 운영자 (admin) | 셀러 (본인) |
| 대상 | polymorphic (Service\|Seller) | 단일 (Service) |
| FK 정책 | 없음 (수동 targetId) | Restrict |
| 인덱스 | createdAt 단일 | (sellerProfileId, createdAt) 복합 |
| 권한 | requireAdmin | requireSellerProfile + where 격리 |
| 쿼리 패턴 | N+1 회피 (in:[...] + Map) | include 자연 조인 |
| metadata 키 | rejectionReason | to (toggled 방향) |
| $transaction | sequential array (참조 의존성 모델만) | callback (참조 + 분기) |

*같은 events 패턴* 이 *모든 축* 에서 다른 모양. *추상 패턴 = events* 는 같지만 *구체 구현* 은 *도메인이 결정*.

---

## ✅ 한 줄 요약

> **"*같은 events 패턴* 도 *주체·권한·의미* 다르면 *분리* (AuditLog vs SellerActivityLog). *FK Restrict + 단일 도메인* 으로 *polymorphic 패턴 회피*. *$transaction* 의 *분기 의존성* 새 사용처 + *race-safe 정신* 유지. *Day 19 추출* 이 *두 번째 사용 (Day 20)* 에 자연 적용 = *진짜 추출이었다* 는 증거."**

---

## 🧠 한 가지 회고 — *세션 종료의 안전망*

Day 20 의 *예측 못한 사건*: 작업 중 컴퓨터 꺼짐. 다음 세션 시작 시 *git diff* 로 진행 상황 복원 → *변수 shadowing 버그* 발견.

**Git 의 *진행 중 상태* 가 *안전망*** 으로 작동:
- *staged/unstaged 분리* — 무엇이 *시도 중* 이고 무엇이 *완료* 인지 시각적 구분
- *untracked 파일* — 새로 만든 마이그레이션·페이지 등이 *유실 X* (디스크에 그대로)
- *git diff* 한 번으로 *수십 분 전 상태 복원* + *어디까지 갔는지* 즉시 파악

**커밋 안 했음에도 살아남은 이유**:
- VSCode 가 *저장된 파일* 로 디스크에 기록
- 디스크 = *전원 끄기 안전* (반대로 *메모리 상태* = 전부 휘발)
- *세션 컨텍스트* (Claude 와의 대화) 는 *memory 시스템* 에 부분 복원

**원칙**: "*잦은 저장 (Ctrl+S)* + *작업 단위마다 커밋* 이 *예측 못한 종료* 대비 *유일한 안전망*. *git diff* 는 *시간 여행 도구* — *어디까지 갔나* 를 *코드 차이* 로 즉시 답함. *세션 종료 전 검증* 못 했어도 *다음 세션 시작 첫 작업 = git diff + 검증* 으로 복원."

디자이너의 *작업 중 자동 저장* 직관 (Figma 의 *항상 저장됨* 정신) 이 *코드 작업의 git* 으로 자연 전이. *수동 commit* 이 *수동 저장* 처럼 느껴지지만 *진짜로 중요한 안전망*. *예측 못한 종료* 가 한 번 일어나면 *그 가치를 체감* — Day 20 의 가장 큰 부수 학습.

---

*문서 끝. Day 21 으로 이어짐.*
