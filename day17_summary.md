# Phase 1A — Day 17 완료 보고서

> 작성일: 2026-05-20
> 작업 범위: Prisma 정리 묶음 — *string union* 컬럼 5개 enum 도입 + `prisma.config.ts` 이전
> 학습자: 디자인 전공 / 코딩 17일째

---

## 🎯 큰 그림 — Day 17이 한 일

```
[Day 14] role/verificationStatus 등 string union 패턴 정착
[Day 15] 셀러 수정/숨기기 — string literal 비교 일상화
[Day 16] 구매자 검색·필터 — URL 쿼리 패턴 확장
   ↓
[Day 17] Prisma 정리 — string union → enum 5종 + config.ts 이전  ← 지금
   ↓
[Day 18+ 예정] #6 번복 이력 추적 / 감사 로그
```

운영 기능을 *멈추고 도메인 표현을 정리한* 날. *눈에 보이는 화면 변화는 없음*. 대신 **타입 안전성 ↑** + **Prisma 7 대비 deprecated 경고 해소**.

---

## 📅 Day 17 작업 요약

### 6 단계 (Day 14~16 페이스 유지)

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `Service.verificationStatus` 만 enum 도입 (스키마 + 마이그레이션) | **SQLite + Prisma enum = 클라이언트 사이드 enum** (마이그레이션 SQL 0 줄) |
| 2 | Service.verificationStatus *write 사이트* → enum import (小 범위) | enum 도 *union type + const 객체* 로 export — string literal 도 통과 |
| 3 | 나머지 enum 4종 도입 (Seller / ServiceType / BookingStatus / UserRole) | *도메인별 enum 분리* — 같은 값이라도 의미 다르면 따로 |
| 4 | 통합 검증 (시드 재실행 + 화면 흐름 9개 항목) | DB 안 깨짐, 기존 기능 모두 회귀 없음 |
| 5 | `prisma.config.ts` 이전 + `package.json#prisma` 제거 | **prisma config 도입 시 .env 자동 로딩 꺼짐** — `process.loadEnvFile()` 로 직접 |
| 6 | 최종 검증 + 학습 문서 | — |

---

## 🐛 Day 17 핵심 발견·논의

### 발견 1: ***SQLite + Prisma enum 의 실체*** — 마이그레이션 SQL 이 0 줄

스키마 변경 후 `npx prisma migrate dev` 실행:

```
Already in sync, no schema change or pending migration was found.
✓ Generated Prisma Client (v6.19.3) to .\node_modules\@prisma\client in 81ms
```

→ **마이그레이션 파일이 안 만들어짐**. DDL 변경 0.

**왜:**
- SQLite 는 *enum 타입을 네이티브 지원 안 함*
- Prisma 가 SQLite enum 을 *DB 수준이 아닌 클라이언트 수준* 으로 구현
- 컬럼은 *TEXT 그대로*, CHECK 제약도 없음
- 보호막은 *Prisma Client 가 write 할 때만* 동작

**의미:**
- 다른 도구(sqlite CLI, GUI 등) 로 DB 직접 쓰면 *잘못된 값* 들어갈 수 있음
- 그래도 *애플리케이션 코드는 enum 으로 통일* → 타입 안전성은 확보됨
- PostgreSQL 이라면 `CREATE TYPE` DDL 이 만들어졌을 것 — *DB 별 semantics 차이* (Day 16 의 contains 대소문자 이슈와 같은 결)

**원칙**: "*추상화(Prisma) 가 모든 DB 차이를 가리지 않음*. SQLite enum 의 보호막은 *클라이언트 사이드만*. 실서비스 DB(PostgreSQL) 마이그레이션 시 *DDL 발생* — 같은 schema 코드라도 *다른 결과*."

---

### 발견 2: enum 도 ***string literal 호환*** — Prisma 의 영리한 export

step 2 시작 전 가정: "enum 도입 후 모든 `verificationStatus: "pending"` 같은 string literal 코드가 *컴파일 에러* 날 것."

실제: **에러 0**. `tsc --noEmit` 통과.

**왜:**
Prisma 가 enum 을 두 가지로 함께 export:

```ts
// .prisma/client/index.d.ts (자동 생성)
export const ServiceVerificationStatus = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;
export type ServiceVerificationStatus =
  (typeof ServiceVerificationStatus)[keyof typeof ServiceVerificationStatus]
```

→ 타입 `ServiceVerificationStatus` = `"pending" | "approved" | "rejected"` (union).
→ `"pending"` (string literal) 도 union 안에 있어 *통과*.

**의미:** Step 2 (코드를 enum import 로 갈아끼우는 작업) 가 *강제가 아닌 선택적 리팩터링*. 의사결정의 무게가 달라짐.

**원칙**: "*enum import 의 가치는 refactor-resilience* — 값 이름 변경 시 한 곳만 고치면 IDE 가 모든 참조 자동 리팩터. 작동 자체는 string literal 도 OK."

---

### 발견 3: ***도메인별 enum 분리*** — 값이 같아도 의미가 다르면

`SellerProfile.verificationStatus` 와 `Service.verificationStatus` 둘 다 `pending` / `approved` / `rejected`.

| (A) 공유: `enum VerificationStatus` | (B) 분리: `SellerVerificationStatus` + `ServiceVerificationStatus` ✓ |
|---|---|
| 중복 제거, *DRY* | *셀러(사람) 검증* 과 *서비스(콘텐츠) 검증* — 다른 의미 |
| 미래 값 추가시 한 곳만 | 한쪽에 값 추가해도 다른 쪽 안 흔들림 |
| | 코드에서 *어느 도메인의 pending 인지* 즉시 명확 |

→ **(B) 채택**. 지금 *값이 같다고 같은 enum 으로 묶는 건 우연의 일치를 영구화하는 것*. Day 14 의 거부 사유 추가처럼 *한쪽만 진화* 할 수 있음.

**원칙**: "*형태가 같아도 의미가 다르면 분리*. *지금 같음* 이 *미래에도 같음*을 보장 안 함. [[feedback-extraction-threshold]] 의 정신과 같은 결 — 추상화는 *진짜 같음* 이 확인된 후."

---

### 발견 4: ***write 만 enum, read 는 string*** — 실용적 균형

Step 2 의사결정에서 세 선택지:

| (A) write 만 enum import ✓ | (B) write + read 전부 | (C) 건너뜀 |
|---|---|---|
| ~5 파일 | ~10 파일 | 0 파일 |
| 학습 가치 ✓ | 일관성 ✓ | 패턴 미체험 |
| 비교 시점 (`status === "pending"`) 는 string 이 더 짧고 읽기 좋음 | 모든 비교에 `ServiceVerificationStatus.pending` — 길어짐 | enum import 가치 미경험 |

→ **(A) 채택**. read/비교 시점은 union 타입이 *IntelliSense + 오타 방지* 이미 해줘서 string literal 로 충분. *생산(write)* 만 enum 으로 통일.

**원칙**: "*일관성 강박* 보다 *실용적 균형*. 같은 컬럼이라도 *쓸 때와 읽을 때 다른 표현* 이 자연스러울 수 있음. 코드 가독성 ≠ 코드 통일성."

---

### 발견 5: ***`prisma.config.ts` 가 있으면 .env 자동 로딩 꺼짐***

step 5 의 첫 시도 — `prisma.config.ts` 작성 후 `prisma migrate status` 실행 시:

```
Loaded Prisma config from prisma.config.ts.
Prisma config detected, skipping environment variable loading.
Error: Environment variable not found: DATABASE_URL.
```

**원래 가정 (틀림)**: schema.prisma 의 `env("DATABASE_URL")` 가 자동으로 .env 를 로드한다.

**실제**: prisma config 도입 시 Prisma CLI 가 *의도적으로* .env 자동 로딩을 건너뜀 — config 가 환경변수 처리를 *명시적으로* 하라는 정책.

**왜 그렇게 설계됐을까:**
- config 가 *코드* 라 환경 처리도 *코드 책임* 으로
- `.env` 가 *암묵적 마법* 이었던 걸 *명시적 호출* 로
- 여러 env 파일 (`.env.production`, `.env.local`) 사용시 *어느 걸 쓸지 코드에서 결정*

**원칙**: "*도구가 자동으로 해주던 일을 코드로 옮길 때*, 자동 동작이 *꺼질 수 있음*. *전제 깔지 말고 실행 결과로 확인*."

---

### 발견 6: ***공식 문서가 늘 최선이 아님*** — `dotenv` vs `process.loadEnvFile()`

공식 문서 권장:

```ts
import "dotenv/config"
import { defineConfig, env } from "prisma/config"
```

→ `dotenv` 패키지 *새 의존성 추가* 필요.

**대안 발견:** Node 20.12+ 의 built-in `process.loadEnvFile()` — 의존성 0, 한 줄.

```ts
process.loadEnvFile()
```

우리 프로젝트는 `@types/node: ^20` 이미 사용 → 그대로 작동. 의존성 추가 안 함.

**원칙**: "*공식 문서의 권장 = 일반적으로 통하는 선택*. 하지만 *프로젝트 컨텍스트*(이미 가진 의존성, Node 버전 등)에 따라 *더 가벼운 대안*이 있을 수 있음. *문서를 그대로 베끼지 말고 알맞은 도구 한 번 더 고민*."

---

### 발견 7: ***IDE 캐시 vs `tsc --noEmit` 의 진실***

Prisma Client 재생성 직후 IDE 에 *빨간 줄*:

```
Module '"@prisma/client"' has no exported member 'ServiceVerificationStatus'.
```

같은 코드를 `tsc --noEmit` 으로 검증 → **에러 0**.

**원인**: VSCode 의 TypeScript 언어 서버가 *Prisma 가 재생성한 타입 파일을 캐시 갱신 못함*. *정적 분석 캐시* 가 *파일 시스템 변경*을 못 따라잡음.

**해결**:
- *VSCode*: `Ctrl/Cmd + Shift + P` → "TypeScript: Restart TS Server"
- *확신*: `tsc --noEmit` 이 *진짜 컴파일러 판단* — 그게 0 에러면 코드는 OK

**원칙**: "*IDE 의 빨간 줄 ≠ 진실*. 자동 생성 타입 (Prisma client, GraphQL codegen 등) 변경 후엔 *언어 서버 재시작* 한 번. *컴파일러 (tsc) 가 최종 진실*."

---

### 발견 8: ***`prisma.config.ts` 의 최소 형태*** — 적게 쓰는 게 좋음

처음 떠올린 형태 (공식 문서):

```ts
import "dotenv/config"
import { defineConfig, env } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
```

실제 적용 형태:

```ts
import { defineConfig } from "prisma/config"

process.loadEnvFile()

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
```

**왜 더 짧은가:**
- `schema` 경로 `prisma/schema.prisma` 가 *default* 와 일치 → 명시 불필요
- `migrations.path` 도 *default* `prisma/migrations` 와 일치 → 명시 불필요
- `datasource` 는 `engine: 'classic'/'js'` 명시할 때만 필수 — *engine 안 쓰면* schema.prisma 의 datasource 블록을 그대로 사용
- `env()` 헬퍼는 `datasource` 명시할 때만 필요 → 우리는 안 쓰니 import 불필요
- `dotenv` 대신 `process.loadEnvFile()` (위 발견 6)

**원칙**: "*default 와 일치하는 값 명시는 노이즈*. *두 곳에 같은 정보* 가 생기면 *동기화 부담만 늘어남*. 공식 예시도 *전부* 가 아닌 *옵션의 진열*."

---

## 🎓 새로 배운 개념 (Day 17)

### Prisma `enum` 블록
- `enum Name { value1 value2 }` 스키마 정의
- 컬럼 타입을 `String @default("x")` → `Name @default(value1)` 로 교체
- `npx prisma migrate dev --name xxx` 으로 마이그레이션 + 클라이언트 재생성

### SQLite + Prisma enum 의 특이성
- DDL 0 줄 — TEXT 컬럼 유지
- 보호는 *Prisma Client write 시점만*
- PostgreSQL 이었다면 `CREATE TYPE` 발생

### enum 의 TS export 형태
- `const` 객체 (런타임 값) + `type` (union) — 한 이름으로 둘 다
- string literal 도 union 멤버라 *호환*
- enum import 가치 = *refactor-resilience* (값 이름 변경 안전성)

### 도메인별 enum 분리
- 같은 값이라도 *의미 다른 도메인* 이면 분리
- *지금 같음* 이 *미래에도 같음* 보장 안 함

### write/read 분리 전략
- write 만 enum 으로 통일 (Server Action / seed)
- read/비교는 string literal — union 타입이 IntelliSense 도와줌

### `prisma.config.ts`
- Prisma 7 에서 `package.json#prisma` 제거 — 미리 정리
- default 와 일치하는 값은 *명시 안 함*
- migrations.seed 만 옮기는 *minimal* 형태

### `prisma.config.ts` 도입 시 .env 자동 로딩 꺼짐
- "Prisma config detected, skipping environment variable loading"
- *명시적* 로딩 필요

### `process.loadEnvFile()` (Node 20.12+)
- built-in — *dotenv 의존성 안 늘림*
- `prisma.config.ts` 첫 줄에 호출
- *공식 권장* (`import "dotenv/config"`) 보다 가벼움

### IDE 캐시 vs `tsc --noEmit`
- 자동 생성 타입 변경 후 *언어 서버 stale* 가능
- *컴파일러가 진실*

---

## 📋 작성된 코드 핵심

```prisma
// prisma/schema.prisma — enum 5종 정의
enum ServiceVerificationStatus { pending approved rejected }
enum SellerVerificationStatus  { pending approved rejected }
enum ServiceType               { online offline }
enum BookingStatus             { pending confirmed completed cancelled }
enum UserRole                  { user admin }

// 모델에서 사용
model User {
  role  UserRole  @default(user)
}
model SellerProfile {
  verificationStatus  SellerVerificationStatus  @default(pending)
}
model Service {
  serviceType         ServiceType
  verificationStatus  ServiceVerificationStatus @default(pending)
}
model Booking {
  status              BookingStatus             @default(pending)
}
```

```ts
// Server Action — write 사이트만 enum import
import { ServiceVerificationStatus } from "@prisma/client"

await prisma.service.update({
  where: { id: serviceId },
  data: {
    verificationStatus: ServiceVerificationStatus.approved,
    rejectionReason: null,
  },
})
```

```ts
// prisma.config.ts — 최소 형태
import { defineConfig } from "prisma/config"

process.loadEnvFile()  // config 도입시 .env 자동 로딩 꺼지므로 명시

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
```

---

## 📁 변경된 파일

```
stylefit/
├── prisma/
│   ├── schema.prisma          — enum 5종 추가 + 5 컬럼 타입 교체
│   └── seed.ts                — 24 write 사이트 enum import
├── app/
│   ├── admin/
│   │   ├── sellers/actions.ts — Seller 승인/반려/되돌리기 3곳
│   │   └── services/actions.ts — Service 승인/반려/되돌리기 3곳
│   └── seller/
│       └── services/[id]/edit/actions.ts — 수정 시 pending 되돌림
├── prisma.config.ts           — 신규 (config-as-code)
└── package.json               — "prisma" 블록 제거
```

*총 7 파일 변경 (수정 6 + 신규 1).*

---

## 🚀 Day 18+ 미리보기 — #6 번복 이력 추적 / 감사 로그

[[project-day16-plan]] 합의:

- **#6 번복 이력 / 감사 로그** — admin 액션 (approve/reject/revert) 의 *누가 / 언제 / 왜* 기록
  - 새 모델 `AuditLog` 추가 가능성
  - 셀러 입장의 *이력 보기* UI 별개
  - 분량 큼 → 자체 단계 분할 (5~8 단계 예상)
  - 첫 결정: *어떤 액션을 기록할 것인가* (모든 admin update? 셀러의 수정도?)

---

## 💡 Day 14·15·16·17 회고 — *기능 ↔ 정리 의 리듬*

| Day | 성격 | 결과 |
|---|---|---|
| 14 | 기능 추가 (admin 검증 + role) | 새 화면 + 새 권한 모델 |
| 15 | 기능 추가 (셀러 수정/숨기기) | 닫힌 행동 루프 |
| 16 | 기능 추가 (검색·필터) | URL 패턴 *진짜 활용* |
| **17** | **정리** (Prisma 도메인 표현) | *눈에 안 보이는* 타입 안전성 + Prisma 7 대비 |

기능 *추가* 와 *정리* 가 번갈아 가는 리듬. Day 17 같은 *정리 데이* 는 화면 변화 없지만 *코드의 미래 비용*을 낮춤. 운영 가능한 시스템의 일상.

---

## ✅ 한 줄 요약

> **"5 컬럼의 string union → enum 으로 *코드 측 도메인 표현* 정리, `prisma.config.ts` 로 Prisma 7 대비 — *SQLite + Prisma enum 의 정체* 와 *공식 문서를 그대로 베끼지 않는 판단* 이 오늘의 두 깨달음."**

---

## 🧠 한 가지 회고 — *공식 문서를 의심해도 되는 자신감*

Day 17의 진짜 학습은 step 5. *공식 문서가 권장한 `dotenv` 를 안 따른 결정*.

처음 본 권장 형태:
```ts
import "dotenv/config"
import { defineConfig, env } from "prisma/config"
```

따라가는 게 쉬움. `npm i -D dotenv` 한 번이면 끝. *공식 문서가 옳을 거야* 라는 디폴트 신뢰.

근데 한 번 멈춰서 — *왜 이 의존성을 더하지?* `process.loadEnvFile()` 이 *Node 20.12+ built-in* 으로 같은 일 함. 의존성 0 추가, 한 줄. *문서가 안 알려준 옵션*.

이게 Day 14 의 *CS 관점 사고가 결정을 바꾼 사건*, Day 16 의 *디자인 정합이 쿼리 구조를 바꾼 사건* 과 같은 결.

**디자인 전공자가 코드를 배울 때 자주 나타나는 강점**: *주어진 답을 의심* 하는 본능. 디자인 시안 검토할 때 *왜 이 색인가? 왜 이 간격인가?* 처럼 — 코드에서도 *왜 이 의존성인가? 왜 이 방법인가?* 한 번 더 묻기.

AI 가 빠르게 코드를 짜는 시대에 *결정의 질* 이 차별점. 도구를 어떻게 *고를 것인가* — Day 17 이 그 근육을 키운 날이에요.

---

*문서 끝. Day 18 로 이어짐.*
