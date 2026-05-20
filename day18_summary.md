# Phase 1A — Day 18 완료 보고서

> 작성일: 2026-05-20
> 작업 범위: 감사 로그 (AuditLog events 모델 + admin 액션 6종에 $transaction 기록 + /admin/audit-log 페이지 + 두 축 필터)
> 학습자: 디자인 전공 / 코딩 18일째

---

## 🎯 큰 그림 — Day 18이 한 일

```
[Day 14] admin 검증 워크플로 — approve/reject/revert *현재 상태* 컬럼
[Day 17] Prisma 정리 — enum 5종 도입 + prisma.config.ts
   ↓
[Day 18] 감사 로그 — admin 액션의 *이력 (events)* 영구 기록  ← 지금
   ↓
[Day 19 예정] URL 쿼리 패턴 + chipClass 공통 추출 (세 사용처 도달)
```

Day 14 가 *마지막 상태* (verificationStatus, rejectionReason) 만 들고 있던 걸, Day 18 에 *모든 액션의 시각·수행자·대상 이력* 으로 확장. **운영급 시스템의 첫 단계** — *누가 / 언제 / 무엇을 / 왜* 의 4 질문에 항상 답할 수 있음.

---

## 📅 Day 18 작업 요약

### 7 단계

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `AuditLog` 모델 + `AuditAction`/`AuditTargetType` enum + 마이그레이션 | events 모델, *polymorphic* targetId (FK 없음), `Json?` 컬럼, ON DELETE RESTRICT |
| 2 | admin/sellers actions 3종에 `$transaction([update, auditLog.create])` | sequential array vs interactive callback, 트랜잭션 정신 |
| 3 | admin/services actions 3종에 동일 패턴 | *6 사용처 복붙* — Day 19 추출 대상 보존 |
| 4 | `/admin/audit-log` 페이지 — 최신 50건 표시 | polymorphic target N+1 회피, ACTION_BADGE 의미 컬러 |
| 5 | 두 축 필터 (`?action=&targetType=`) — Day 14·16 패턴 *세 번째 사용처* | 화이트리스트 + 빈 객체 spread 재활용, chipClass 복붙 |
| 6 | 통합 검증 — *시드 재실행 FK 충돌* 잠재 버그 발견·수정 | FK 의존성 → 시드 deleteMany 순서 |
| 7 | 학습 문서 | — |

---

## 🐛 Day 18 핵심 발견·논의

### 발견 1: ***events 모델 = snapshot 의 반대*** — 감사 로그의 본질

운영 시스템에서 *상태* 와 *이력* 은 별개:

| 컬럼/모델 | 본질 | 예시 |
|---|---|---|
| Service.verificationStatus | *현재 상태* (snapshot) | "approved" |
| Service.rejectionReason | *현재 상태의 부가 정보* | "사진 불충분" |
| **AuditLog 테이블** | ***이력 (events)*** | "GUUN 이 2026-05-20 14:33 에 서비스 #5 를 반려, 사유=사진 불충분" |

**핵심 차이:**
- snapshot 은 *덮어쓰기* — 이전 값 사라짐. revert 한 번이면 *왜 처음에 반려했는지* 흔적 없음
- events 는 *추가 전용* (append-only) — 한 번 들어가면 영구. *시간 축* 자체가 데이터

```ts
// snapshot: Service.update — 이전 verificationStatus 덮어씀
await prisma.service.update({ where: { id }, data: { verificationStatus: "rejected", rejectionReason } })

// events: AuditLog.create — 새 row 추가, 기존 row 안 건드림
await prisma.auditLog.create({ data: { actorId, action: "rejected", targetType: "Service", targetId: id, metadata: { rejectionReason } } })
```

**원칙**: "*현재 상태* 와 *변경 이력* 은 *다른 데이터 모델*. snapshot 만 들면 *답 못하는 질문* 이 생긴다 — *누가 왜 언제* 변경했나? *번복은 몇 번이나?* events 가 그 질문에 답한다."

---

### 발견 2: ***polymorphic 컬럼*** — Prisma single-table FK 와 안 맞음

`AuditLog.targetId` 는 *Service* 또는 *SellerProfile* 의 id 를 가리킴. 두 도메인이 *같은 컬럼* 을 공유 = **polymorphic**.

**왜 FK 못 만드나:**
- Prisma 의 relation 은 *단일 모델 참조* 만 지원
- `targetId Int @relation(...)` 를 *조건부로 Service 또는 SellerProfile* 가리키게 못 함
- 대안 1: 각 도메인마다 별도 컬럼 (`serviceId?`, `sellerProfileId?`) — *대부분 null* 인 sparse 컬럼 폭증
- 대안 2 (채택): **`targetType` enum + `targetId` Int** — FK 없이 코드 측에서 resolve

```prisma
model AuditLog {
  targetType  AuditTargetType  // "Service" or "Seller"
  targetId    Int              // FK 없음 — 도메인 가변
}
```

**대가:** FK 가 없으니 *DB 가 무결성 보장 안 함* (Service 삭제 후 dangling targetId 가능). 우리는:
- Service / SellerProfile 의 *삭제 기능 자체가 없음* → 현재 무결성 OK
- 표시 시 `?? "(삭제됨 #${targetId})"` 조용한 fallback — *audit log 의 본질 (이력 유지) 정신*

**원칙**: "*polymorphic 관계* 는 *유연성과 무결성의 trade-off*. FK 안전망을 포기하는 대신 *(type, id) 쌍* 으로 도메인 횡단. 운영 시 *삭제 정책* 과 *resolve 시 fallback* 으로 보완."

---

### 발견 3: ***polymorphic N+1 회피*** — id 종류별 묶기

50 row 의 audit log 표시 시 *naive* 접근:

```ts
// ❌ N+1 쿼리 — 1 audit + 50 target = 51 쿼리
const logs = await prisma.auditLog.findMany({ take: 50 })
for (const log of logs) {
  const target = log.targetType === "Service"
    ? await prisma.service.findUnique({ where: { id: log.targetId } })
    : await prisma.sellerProfile.findUnique({ where: { id: log.targetId } })
  ...
}
```

정석:

```ts
// ✅ 3 쿼리 — audit + Service in + Seller in
const logs = await prisma.auditLog.findMany({ take: 50, include: { actor: {...} } })

const serviceIds = logs.filter(l => l.targetType === "Service").map(l => l.targetId)
const sellerIds  = logs.filter(l => l.targetType === "Seller").map(l => l.targetId)

const [services, sellers] = await Promise.all([
  prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id, title } }),
  prisma.sellerProfile.findMany({ where: { id: { in: sellerIds } }, include: { user: {...} } }),
])

const serviceMap = new Map(services.map(s => [s.id, s.title]))
const sellerMap = new Map(sellers.map(s => [s.id, s.user.name]))
```

*row 개수 무관* — 1 row 든 50 row 든 *항상 3 쿼리*. 데이터 양이 늘어도 쿼리 수 안 늘어남.

**원칙**: "*N+1* 은 *DB 호출 N+1 번* — 데이터 양에 비례해 쿼리 폭증. *반복문 안의 await* 가 발견 신호. 정석: *id 모아서 한 번에 in:[...]*, Map 으로 attach. *반복 → 일괄* 패턴."

---

### 발견 4: ***`$transaction` 의 두 형태*** — sequential vs interactive

Prisma 의 트랜잭션 두 가지:

| (a) Sequential array ✓ | (b) Interactive callback |
|---|---|
| `prisma.$transaction([q1, q2])` | `prisma.$transaction(async (tx) => { ... })` |
| 두 query 가 *독립* (참조 의존성 없음) | 한 query 결과를 *다른 query 의 입력* 으로 |
| 단순, 짧음 | 자유도 ↑, 보일러플레이트 ↑ |

우리 케이스: `sellerProfile.update` + `auditLog.create` — *sellerProfileId* 가 이미 input 으로 들어와 있음 → 두 query 독립 → **(a) 채택**.

```ts
await prisma.$transaction([
  prisma.sellerProfile.update({ where: { id: sellerProfileId }, data: {...} }),
  prisma.auditLog.create({ data: { actorId, action, targetType, targetId: sellerProfileId, metadata } }),
])
```

**둘 다 성공해야 commit** — 한쪽 실패 시 *둘 다 rollback*. 의미:
- *update 성공 / log 실패* → 액션은 했는데 기록 없는 *유령 상태* 방지
- *update 실패 / log 만 성공* → 거짓 이력 방지

**원칙**: "*트랜잭션은 의미적으로 묶여야 할 작업의 묶음*. *액션과 그 액션의 기록* 이 *부분 성공* 하면 데이터가 거짓말한다. 두 query 가 *독립* 이면 sequential array, *의존* 이면 interactive callback."

---

### 발견 5: ***SQLite + Json — `JSONB` 로 떨어짐***

마이그레이션 SQL 확인:

```sql
"metadata" JSONB,
```

**예상 외**: SQLite 는 *공식적으로 JSONB 타입이 없는데도* Prisma 가 `JSONB` 로 적었음.

**왜 동작하나** — SQLite 의 **type affinity** 시스템:
- SQLite 는 컬럼 타입을 *strict* 가 아닌 *affinity* (성향) 로 봄
- 모르는 타입 (`JSONB` 같은) 만나면 *컬럼 이름 규칙* 으로 affinity 결정
- `JSONB` 는 어떤 패턴에도 안 맞아 *BLOB* affinity 로 떨어짐
- 그래도 SQLite 3.45+ 에선 *진짜 JSONB 지원* 추가됨 — Prisma 가 그쪽 가능성 미리 깔아둠

**코드 측면에선** — Prisma Client 가 *JS object 자동 직렬화/역직렬화*. 우리는 `{ rejectionReason: reason }` 로 그냥 넣고 그냥 읽음. 내부 표현은 *추상화 뒤에 가려짐*.

**비교**:
| 컬럼 | 표현 | Prisma 처리 |
|---|---|---|
| Service.portfolioUrls | `String` + JSON.stringify 수동 | *레거시* — 직접 직렬화 |
| AuditLog.metadata | `Json?` | *현대적* — 자동 직렬화 |

**원칙**: "*Prisma 추상화* 는 *DB 별 native 지원* 을 가린다. SQLite 에 *진짜 JSONB 없어도* 코드는 동작. 다만 *DB 직접 조회* 시 BLOB 으로 보임 — 인지하고 도구 골라야."

---

### 발견 6: ***enum 의 두 결*** — Day 17 도메인 분리의 *반대* 케이스

Day 17 에서 `SellerVerificationStatus` 와 `ServiceVerificationStatus` *분리* — 값이 같지만 *의미 다른 도메인* 이라.

Day 18 에서는 `AuditAction` 단일 enum — `approved/rejected/reverted` 가 *Seller* 든 *Service* 든 *같은 의미* 라.

| 케이스 | 처리 |
|---|---|
| Day 17: SellerVerificationStatus.pending vs ServiceVerificationStatus.pending | *값은 같고 의미 다름* → **분리** |
| Day 18: AuditAction.approved + targetType=Seller vs +targetType=Service | *값과 의미 같음, 적용 도메인 다름* → **공통** + 도메인은 별 컬럼 |

**원칙**: "*형태가 같다고 같은 enum, 다르다고 다른 enum* 이 아님. *의미* 가 기준. *같은 값이 같은 의미* 면 묶고, *같은 값이 다른 의미* 면 분리. *도메인 차이* 는 *별 컬럼* 으로 표현 가능."

---

### 발견 7: ***FK ON DELETE RESTRICT*** — 감사 정책의 코드 표현

마이그레이션 SQL:

```sql
CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
```

Prisma 의 *default* 가 `Restrict` — 우리가 schema 에 명시 안 했는데 SQL 에 들어감.

**의미**: *audit log 가 있는 user 는 삭제 불가*. 감사 정책 의 본질:
- log 의 actorId 가 *NULL 되면* → "누가 했는지 모름" — 감사 의의 ↓
- *CASCADE* 면 → user 삭제 시 log 도 삭제 — *조직적 행위* 의 흔적도 사라짐. 더 위험
- *RESTRICT* → user 삭제 자체 차단 — 운영급 정책

→ **DB 수준의 정책 표현**. 코드가 *실수로 user 삭제* 시도해도 DB 가 막아줌. *방어 깊이*.

**원칙**: "*FK 의 onDelete 정책* 은 *데이터 모델의 신념*. *Cascade* 는 부속물 정리, *Restrict* 는 *역사 보존*. 감사 로그처럼 *영구 보존* 이 본질인 데이터는 *Restrict*."

---

### 발견 8: ***시드 deleteMany 순서 의존성*** — 통합 검증에서 발견된 잠재 버그

Step 6 통합 검증 중 *시나리오 점검*:
1. 시드 → users 생성, AuditLog 비어있음
2. admin 액션 1회 → AuditLog 에 row 1개
3. 시드 재실행 시 `prisma.user.deleteMany()` → **FK Restrict 로 실패**

→ 시드의 `deleteMany` 영역 *가장 위에* `auditLog.deleteMany()` 추가:

```ts
// Day 18: audit log 가장 먼저 정리 (User FK Restrict 라 user 삭제 전에 비워야)
await prisma.auditLog.deleteMany()

// 기존 영역들 (메시지, 후기, ...)
```

**원칙**: "*FK 의존성 그래프* 가 *deleteMany 순서* 를 결정. 의존하는 쪽 (child) 먼저, 의존받는 쪽 (parent) 나중. *새 모델 추가 시 시드의 정리 순서 점검* — 잊으면 *시드 재실행 시점에 폭발*."

---

### 발견 9: ***세 번째 사용처 도달*** — Day 19 추출 trigger

URL 쿼리 + Prisma where 동적 조립 + 칩 그룹 UI 패턴:

| Day | 위치 | 축 |
|---|---|---|
| 14 | `/admin/services?status=` | 한 축 |
| 16 | `/services?category=&q=` | 두 축 + 모드 분리 |
| **18** | `/admin/audit-log?action=&targetType=` | 두 축 |

**[[feedback-extraction-threshold]] 의 *세 번째 사용처*** 도달.

Day 18 안에서 *그 자리에서 추출* 하지 않고 *복붙* 한 이유:
- Day 18 의 학습 무게중심 = *audit log 자체* — events 모델, polymorphic, $transaction
- *추출 의사결정* 까지 얹으면 학습 분산
- *세 코드가 나란히 있는 상태* 에서 추출하면 *진짜 공통과 차이* 판별 ↑
- Day 19 의 정체성 = *추출 Day* (Day 17 같은 *정리 Day*)

**원칙**: "*세 번째 사용처에서 추출* 의 진짜 의미 = *세 코드를 비교한 후* 추출. *즉시 추출* 이 아닌 *도달 후 다음 세션에서 일괄*. 추출의 질이 *비교 가능성* 에서 나옴."

---

## 🎓 새로 배운 개념 (Day 18)

### events 모델 (추가 전용 테이블)
- snapshot 의 반대 — 한 번 들어가면 영구
- 시간 축 자체가 데이터
- *누가 / 언제 / 무엇을 / 왜* 의 4 질문에 답

### Polymorphic 컬럼 — `(targetType, targetId)`
- FK 못 만듦 — Prisma single-table relation 한계
- 코드 측 resolve 필요
- 무결성과 유연성의 trade-off

### Polymorphic N+1 회피
- id 모아서 `findMany({ where: { id: { in: [...] } }})` 한 번씩
- Map 으로 O(1) lookup attach
- *데이터 양 무관* 한 쿼리 수

### `$transaction([q1, q2])` (sequential array)
- 두 query 독립 시 — 단순한 형태
- 한쪽 실패 시 *둘 다 rollback*
- 액션과 기록의 *부분 성공* 방지

### `Json?` 컬럼
- SQLite 에선 JSONB 로 떨어지지만 type affinity 로 BLOB
- Prisma Client 가 자동 직렬화/역직렬화
- 레거시 `String + JSON.stringify` 대체

### enum 도메인 분리 vs 공통화
- Day 17 의 *값 같고 의미 다름* = 분리
- Day 18 의 *값·의미 같고 도메인 다름* = 공통 + 도메인 별 컬럼

### FK `onDelete: Restrict`
- Prisma 의 default
- *역사 보존* 이 본질인 데이터에 적합
- DB 수준 정책 → 코드 실수 방어

### 시드 deleteMany 순서
- FK 의존성 그래프 따라 child 먼저, parent 나중
- 새 모델 추가 시 점검 필수

---

## 📋 작성된 코드 핵심

```prisma
// prisma/schema.prisma — AuditLog 모델
model AuditLog {
  id          Int              @id @default(autoincrement())
  actorId     Int                                          // 누가
  action      AuditAction                                  // 무엇
  targetType  AuditTargetType                              // 대상 종류
  targetId    Int                                          // 대상 id (FK 없음 — polymorphic)
  metadata    Json?                                        // 추가 컨텍스트
  createdAt   DateTime         @default(now())

  actor       User             @relation(fields: [actorId], references: [id])

  @@index([createdAt])
  @@map("audit_logs")
}

enum AuditAction      { approved rejected reverted }
enum AuditTargetType  { Seller Service }
```

```ts
// Server Action — $transaction 으로 액션 + 로그 동시
export async function rejectSellerAction(formData: FormData) {
  const admin = await requireAdmin("/admin/sellers")
  const sellerProfileId = extractSellerProfileId(formData)
  if (sellerProfileId === null) return

  const reason = ((formData.get("reason") as string | null) ?? "").trim()
  if (reason.length < 1) return

  await prisma.$transaction([
    prisma.sellerProfile.update({
      where: { id: sellerProfileId },
      data: {
        verificationStatus: SellerVerificationStatus.rejected,
        rejectionReason: reason,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: AuditAction.rejected,
        targetType: AuditTargetType.Seller,
        targetId: sellerProfileId,
        metadata: { rejectionReason: reason },
      },
    }),
  ])
  revalidatePath("/admin/sellers")
}
```

```ts
// /admin/audit-log — polymorphic target N+1 회피
const logs = await prisma.auditLog.findMany({
  where,
  orderBy: { createdAt: "desc" },
  take: 50,
  include: { actor: { select: { id: true, name: true, email: true } } },
})

const serviceIds = logs.filter(l => l.targetType === "Service").map(l => l.targetId)
const sellerIds  = logs.filter(l => l.targetType === "Seller").map(l => l.targetId)

const [services, sellers] = await Promise.all([
  prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, title: true } }),
  prisma.sellerProfile.findMany({
    where: { id: { in: sellerIds } },
    select: { id: true, user: { select: { name: true } } },
  }),
])

const serviceTitleMap = new Map(services.map(s => [s.id, s.title]))
const sellerNameMap = new Map(sellers.map(s => [s.id, s.user.name]))
```

```ts
// 두 축 필터 — Day 14·16 패턴 재사용
const where = {
  ...(action ? { action } : {}),
  ...(targetType ? { targetType } : {}),
}
```

---

## 📁 변경된 파일

```
stylefit/
├── prisma/
│   ├── schema.prisma                        — AuditLog 모델 + enum 2개 + User auditLogs relation
│   ├── seed.ts                              — auditLog.deleteMany 추가 (FK Restrict 대응)
│   └── migrations/
│       └── 20260520051006_add_audit_log/    — 새 마이그레이션
├── app/
│   ├── admin/
│   │   ├── sellers/actions.ts               — 3종에 $transaction + AuditLog 기록
│   │   ├── services/actions.ts              — 3종에 동일 패턴
│   │   └── audit-log/page.tsx               — 신규 (50건 + 두 축 필터)
```

*총 5 파일 변경 (수정 4 + 신규 2: 마이그레이션 + audit-log 페이지).*

---

## 🚀 Day 19 미리보기 — URL 쿼리 패턴 추출 Day

세 사용처 도달:
1. `/admin/services?status=` — Day 14
2. `/services?category=&q=` — Day 16
3. `/admin/audit-log?action=&targetType=` — Day 18

추출 후보:
- *화이트리스트 검증* — `validateEnumParam` 같은 헬퍼
- *빈 객체 spread where* — 패턴은 같지만 추출 가치는 *얇은 함수* — 검토 필요
- *URL 빌더* (`buildSearchUrl`, `buildLogUrl`) — 시그니처 통일 가능?
- *`chipClass`* — services/page.tsx 에서 외부 모듈로

**Day 19 의 첫 결정** (다음 세션):
- *어디까지 추출* — 모든 헬퍼 vs 가장 명확한 1~2개
- *모듈 위치* — `app/lib/url-filter.ts`? `app/components/Chip.tsx`?
- *시그니처 통일 가능성* — 세 빌더가 진짜 같은 형태로 추상화 가능?
- *추출 후 회귀 검증* — 세 사용처 모두 안 깨지는지

Day 17 처럼 *기능 ↔ 정리 리듬* 유지. 화면 변화 없지만 *코드의 미래 비용* 낮춤.

---

## 💡 Day 14~18 회고 — *상태에서 이력으로*

| Day | 데이터 모델의 진화 |
|---|---|
| 14 | snapshot 컬럼 추가 (`verificationStatus`, `rejectionReason`, `role`) |
| 15 | snapshot 수정·토글 (재검증 강제) |
| 16 | snapshot 조회 (검색·필터) |
| 17 | snapshot 타입 정리 (enum 도입) |
| **18** | ***events 모델 도입*** — 시간 축 데이터 |

Day 14~17 이 *현재 상태* 표현을 다듬는 단계였다면, Day 18 은 *시간이 데이터가 되는* 첫 모델. 운영 시스템의 한 차원이 *더해진* 날.

---

## ✅ 한 줄 요약

> **"snapshot (현재 상태) 만으로는 답 못 하는 *누가 언제 왜* 질문을 *events 모델 (AuditLog)* 로 풀고, *polymorphic 컬럼 + N+1 회피 + $transaction* 의 세 패턴으로 *운영급 시스템* 의 첫 단계 — 다음은 Day 19 의 *세 사용처 추출*."**

---

## 🧠 한 가지 회고 — *데이터 모델이 질문을 결정한다*

Day 18 의 진짜 학습은 *데이터 모델이 답할 수 있는 질문의 범위* 를 정한다는 발견.

Day 14 의 `Service.verificationStatus` + `rejectionReason` 만으로 답할 수 있는 질문:
- *지금* 이 서비스 상태는?
- *지금* 반려 사유는?

*못 답하는* 질문:
- *언제* 반려됐나?
- *누가* 반려했나?
- *몇 번* 번복됐나?
- *처음 반려 후 재반려 사이* 어떤 변화가 있었나?

이 질문들에 답하려면 *데이터 모델 자체가 시간 축* 을 가져야 함. 그게 events 모델.

디자인 시안 비유: *현재 디자인* 만 보존하면 *왜 이렇게 됐는지* 모름. *Figma 의 버전 히스토리* 같은 *변경 기록* 이 있어야 *디자인 결정의 맥락* 보존. Day 18 의 AuditLog 도 같은 결.

AI 가 빠르게 *기능 구현* 은 하지만, *데이터 모델의 깊이* 는 *질문을 던지는 사람* 의 몫. *시스템이 답해야 할 질문* 을 먼저 정하고, 그 질문에 답할 수 있는 *모델* 을 디자인. 디자인 전공자의 *맥락 보존* 직관이 데이터 모델 설계에 그대로 옮겨오는 날이에요.

---

*문서 끝. Day 19 로 이어짐.*
