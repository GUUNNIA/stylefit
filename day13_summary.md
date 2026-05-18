# Phase 1A — Day 13 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: 셀러 영역 도입 (보호 라우트 + 본인 서비스/예약 목록 + 서비스 등록 폼) + Service 검증 상태(verificationStatus) 도입
> 학습자: 디자인 전공 / 코딩 13일째

---

## 🎯 큰 그림 — Day 13이 한 일

```
[Day 8~11] 구매자 측 마켓 완결 — 둘러보기·로그인·예약·내 예약
[Day 12] 큐레이션 (Collection 다대다) — 운영자가 *어떤 서비스를 묶을지* 결정
   ↓
[Day 13] 셀러 영역 도입 — 마켓의 *공급 측* 화면 + 검증 흐름 기초  ← 지금
   ↓
[Day 14 예정] 관리자 검증 워크플로 — Service.verificationStatus 의 *반쪽 남은 절반*
```

Day 12까지: *구매자 측 + 운영자 큐레이션*. 셀러는 *시드 데이터로만 존재*.
Day 13: **셀러가 *자기 영역*을 갖고 *진짜로 서비스를 등록*** — 마켓의 *공급 사이클* 시작. 단, 신규 등록은 `pending` 상태라 *검증 워크플로* 절반은 Day 14에서.

---

## 📅 Day 13 작업 요약

### 6 단계로 나눠 진행 (단계마다 OK 받고 진행)

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `Service.verificationStatus` 추가 (`pending`/`approved`/`rejected`) | 마이그레이션, default 정책 (안전한 쪽 `pending`), 시드 일괄 approved |
| 2 | `/services` 와 `/seller/services` 표시 분기 | `VISIBLE_SERVICE_FILTER` spread DRY, *내 페이지엔 모든 상태 + 라벨* |
| 3 | `service-categories.ts` 상수 파일 | `as const` 배열, `(typeof X)[number]` 타입 추론, *single source of truth* (폼·검증·필터) |
| 4 | `/seller/services/new` 등록 폼 3 파일 | Server Action + Client Form + Server Component 합성, Zod + `useActionState` |
| 5 | `/seller/services` h1 옆 **+ 새 서비스 등록** 버튼 | flex layout, 등록 진입점 |
| 6 | 종합 검증 (등록 → pending → 구매자측 안 보임 → Studio approve → 보임) | *반쪽 검증 시스템도 작동 검증 가능*하다는 학습 |

### 추가로 만든 페이지 2개
- `/seller/services` — 본인 등록 서비스 목록 (활성/검증/대기예약 *세 종류 라벨*)
- `/seller/bookings` — 본인이 받은 예약 (status 우선 정렬, pending 위로)

### DAL 확장
- `requireSellerProfile(returnUrl)` — *throw 스타일* — 비로그인 → `/login`, 셀러 아님/pending → `/services`. 호출 측 한 줄로 깔끔.

---

## 🐛 Day 13 핵심 발견·논의

### 발견 1: throw 스타일 DAL `require*` 의 가치

기존 [`getCurrentUser`](stylefit/app/lib/dal.ts) 는 *null-returning* — 호출 측이 `if (!user) redirect()` 매번. 셀러 페이지가 늘면 *4줄 반복 누적*.

**`requireSellerProfile`**: redirect를 *함수 안에 캡슐화* + 반환 시점에 `profile` *NonNull narrowing*. 호출 측은 한 줄.

```ts
const sellerProfile = await requireSellerProfile("/seller/services")
// 여기서 sellerProfile은 NonNull (redirect()의 반환 타입이 never라 TS 자동 추론)
```

**원칙**: "*함수 이름이 컨벤션을 표현*. `get*` = null 반환 OK, `require*` = redirect/throw, 호출 측은 무조건 값 받음." 두 컨벤션이 *코드베이스 안에 공존* — 함수마다 적합한 쪽 선택.

### 발견 2: `as const` + `(typeof X)[number]` — 런타임 값 ↔ 타입

[`service-categories.ts`](stylefit/app/lib/service-categories.ts) 의 핵심:
```ts
export const SERVICE_CATEGORIES = [
  "디자인 컨설팅",
  "웹사이트 제작",
  "영상 편집",
  "영상 제작",
  "블로그·콘텐츠 운영",
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]
// 결과: "디자인 컨설팅" | "웹사이트 제작" | "영상 편집" | ...
```

같은 배열이:
- 폼의 `<select>` 옵션 렌더링에 쓰임
- Zod `z.enum(SERVICE_CATEGORIES)` 검증에 쓰임
- Day 15 검색·필터에도 *그대로 재사용 예정*

**원칙**: "*single source of truth* — 카테고리 추가 시 *배열 한 줄만 추가*하면 폼·검증·필터 모두 자동 갱신." TypeScript의 *런타임 값을 타입으로 변환* 패턴.

### 발견 3: 디자인 전공자 시각의 폼 UX 픽스 7가지

기능 작동 후에도 *셀러 입장에서 폼을 써본* 결과 7가지 마찰 발견. 모두 *내가 처음 작성할 때 짚지 못한 약점*:

| # | 마찰 | 해결 |
|---|---|---|
| ① | `step=1000`인데 `min=1` 이라 `100000` 무효 (브라우저 차단) | `min=1000 step=1000` → 최종 `min=100 step=100` (심리 가격 허용) |
| ② | 분 단위만 입력 — 10일 패키지를 *14400분*으로 입력해야 함 | **일/시간/분 세 input** + 서버에서 합산 |
| ③ | 분 step=10 — 컨설팅 표준은 15분 | `step={15}` (15·30·45만 유효) |
| ④ | 카테고리 자유 입력 — 표기 분산·검색 어려움 | `<select>` 고정 목록 + `z.enum` 검증 (Day 15 검색 대비) |
| ⑤ | 브라우저 자동 메시지 영문 직역체 | `<form noValidate>` + Zod 메시지 한국어 |
| ⑥ | 소수점 키 입력됨 | `onKeyDown` 으로 `.`, `e`, `+`, `-` 차단 (`blockNonInteger`) |
| ⑦ | 등록 실패 시 *카테고리 선택값 초기화* (`<select>`의 uncontrolled 특이성) | LoginForm 동일 패턴: `key={state.values.category}` *trick* |

**원칙**: "*기능 작동* ≠ *실용 수준*. 디자이너의 *실사용 시뮬레이션*이 잡아내는 마찰을 *백엔드 시각만으로는 못 봄*." Day 11 7개 마찰 정리와 같은 패턴 — 셀러 측 폼에도 동일 가치.

### 발견 4: Zod chain 순서의 함정 — `.max`를 `.int` 앞에

가격에 *999999999999999999* (100경) 입력 시:
- 원래 순서: `.int().positive().max(1e8)` → `.int()` 가 *MAX_SAFE_INTEGER 초과*로 먼저 실패 → "정수로 입력해 주세요" (의도와 다른 메시지)
- 수정 순서: `.max(1e8).int().positive()` → `.max()` 가 먼저 차단 → "1억원 이하" (의도된 메시지)

**원칙**: "*더 넓은 범위의 검증을 먼저, 세부 형식을 나중에*. issue 순서가 *작성 순서대로* 정해지므로, *친절한 메시지를 먼저* 나오게 chain 순서 설계."

### 발견 5: SQLite 동적 타이핑의 *조용한 함정*

Zod max 추가 *전*에 큰 가격이 *DB까지 들어가버림*:
- 다른 DB(PostgreSQL·MySQL): INT 컬럼에 21억 초과 → INSERT 차단
- SQLite: 컬럼 타입은 *권장*만, 실제로는 *어떤 값이든 저장*
- Prisma만 *조회 시 INT 변환 실패* → `findMany` 전체 실패

해결: *시드 재실행*으로 DB 리셋. 향후 *서버 검증이 유일 방어선* 자각.

**원칙**: "*DB 레벨 제약을 믿지 마라*. 애플리케이션 레이어(Zod)에서 차단해야 함. 학습 단계엔 OK, *프로덕션에선 BigInt 마이그레이션 + DB 트리거*까지 고려."

### 발견 6: `<form noValidate>` 의 트레이드오프

HTML5 자동 검증 끄면:
- ✅ 브라우저 자동 영문 메시지 차단 — Zod 한국어로 통일
- ❌ `required`·`min`·`max` 자동 차단 X → **서버 검증이 유일 방어선**
- ✅ `step` 은 *드롭다운 UX 가이드*로 유지

이건 *완전 차단보다 적절한 균형*. 학습 단계엔 *서버 검증이 더 명시적*이라 학습 효과 ↑.

### 발견 7: 카테고리 select / 제목 자유입력의 *현업 표준*

| 필드 성격 | 적합 입력 | 예 |
|---|---|---|
| **분류용** (카테고리·지역·등급) | select / 고정 | 검색·필터·집계에 *정확성 필수* |
| **표현용** (제목·설명·닉네임) | 자유 입력 | 셀러 *개성·차별화 필요* |

사용자가 *카테고리만 select, 제목은 자유*라는 *균형 잡힌 결정*을 정확히 짚어냄. *Admin 검증으로 자유 입력 위험 보완* 발상도 자연스럽게 나옴 (Day 14 워크플로 동기).

**원칙**: "*입력 방식*도 *필드 성격*에 맞춰 — 모든 걸 자유 입력으로 둘 필요도, 모든 걸 select로 가둘 필요도 없음."

### 발견 8: *반쪽 시스템도 검증 가능* — 학습 단계의 절충

Service.verificationStatus 컬럼 + 표시 분기 + 폼 등록까지 만들었지만 *Admin 화면은 Day 14로 미룸*. 검증은 어떻게?

→ **Prisma Studio로 수동 approve**. *반쪽 시스템*인 채로도 *흐름 자체는 검증*. 완성도와 학습 분량의 절충.

**원칙**: "*완성도 100%* 만 추구하면 *학습 속도*가 떨어짐. *흐름이 작동함*을 보여줄 수 있는 *최소 단위*까지 자르고, 나머지는 *다음 세션*."

---

## 🎓 새로 배운 개념 (Day 13)

### `as const` (TypeScript)
- 배열·객체를 *literal 타입*으로 고정
- `["a", "b"] as const` → `readonly ["a", "b"]`
- `(typeof X)[number]` 와 결합해 *union 타입* 추출

### Zod `z.enum(values, { message: "..." })`
- 배열의 원소만 허용
- 한국어 메시지 옵션
- Day 15 검색 필터에서도 같은 배열 재사용 가능

### Zod `.refine` (조합 검증)
- 객체 전체 검증 (단일 필드 X)
- `data => data.days + data.hours + data.minutes > 0` 같이
- `{ message }` 옵션으로 친절한 한국어

### `useActionState` + `defaultValue + key` trick (확장)
- Day 10에서 이메일 input에만 썼던 패턴
- **`<select>` 는 *uncontrolled 재렌더 시 값 유지 불안정*** → key trick 필수
- text/textarea는 *DOM 입력값 유지가 안정적*이라 key trick 없어도 OK

### `<form noValidate>` 속성
- HTML5 자동 검증 끄기
- 영문 직역체 메시지 차단 → Zod 한국어로 통일

### `onKeyDown` + `e.preventDefault()` (입력 시점 제어)
- `<input type="number">` 의 *소수점 키 입력 차단*
- 함수 한 번 정의해서 여러 input에 재사용 (`blockNonInteger`)

### Zod chain 순서의 의미
- 같은 chain이어도 *작성 순서*가 *issue 우선순위* 결정
- *큰 범위 → 세부 형식* 순서가 친절한 메시지

### Prisma 관계 카운트 — `_count` vs `include`
- `_count: { select: { bookings: true } }` — 총합만, N+1 안 됨
- `include: { bookings: { select: { status: true } } }` — *조건부 필터* 가능, 코드에서 그룹 카운트
- 데이터 양에 따라 선택

### redirect의 *throw 동작* + TypeScript narrowing
- `redirect()` 반환 타입 `never`
- 그 아래 코드에서 TS가 *자동으로* NonNull narrowing
- `requireSellerProfile` 의 *호출 측 단순화 핵심*

### SQLite 동적 타이핑 vs Prisma 타입 강제
- SQLite는 INT 컬럼에도 *어떤 값이든 저장*
- Prisma만 *조회 시 변환 실패*
- 서버 검증이 *유일 방어선*

---

## 📋 작성된 코드 핵심

```ts
// app/lib/dal.ts — throw 스타일 require* 패턴
export async function requireSellerProfile(returnUrl: string) {
  const session = await verifySession()
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.userId },
  })
  if (profile?.verificationStatus !== "approved") {
    redirect("/services")
  }
  return profile  // ← 여기 도달 시점에 NonNull로 narrowing
}
```

```ts
// app/lib/service-categories.ts — single source of truth
export const SERVICE_CATEGORIES = [
  "디자인 컨설팅", "웹사이트 제작", "영상 편집", "영상 제작", "블로그·콘텐츠 운영",
] as const
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]
```

```ts
// app/seller/services/new/actions.ts — 핵심 패턴
const CreateServiceSchema = z
  .object({
    title: z.string().min(1, "제목을 입력해 주세요.").max(80),
    description: z.string().min(1, "설명을 입력해 주세요.").max(500),
    serviceType: z.enum(["online", "offline"], { message: "..." }),
    category: z.enum(SERVICE_CATEGORIES, { message: "..." }),
    // 순서 중요: .max → .int → .positive (JS Number.MAX_SAFE_INTEGER 초과 방어)
    price: z.coerce.number()
      .max(100_000_000, "가격은 1억원 이하로 입력해 주세요.")
      .int(...)
      .positive(...),
    days: z.coerce.number().int().min(0),
    hours: z.coerce.number().int().min(0).max(23, "..."),
    minutes: z.coerce.number().int().min(0).max(59, "..."),
  })
  .refine(
    (d) => d.days * 1440 + d.hours * 60 + d.minutes > 0,
    { message: "소요 시간은 최소 1분 이상이어야 합니다." }
  )

export async function createServiceAction(_prev, formData) {
  const sellerProfile = await requireSellerProfile("/seller/services/new")
  // ... raw 추출 + safeParse + 합산 + create + redirect ...
  await prisma.service.create({
    data: {
      sellerProfileId: sellerProfile.id,  // ← 서버 결정. 클라가 못 조작.
      // verificationStatus는 schema default "pending"으로 자동
      ...
    },
  })
  redirect("/seller/services")
}
```

```tsx
// app/seller/services/new/CreateServiceForm.tsx — 핵심
function blockNonInteger(e: React.KeyboardEvent<HTMLInputElement>) {
  if ([".", "e", "E", "+", "-"].includes(e.key)) e.preventDefault()
}

<form action={formAction} noValidate ...>
  <select
    key={state?.values?.category ?? "initial"}  // ← uncontrolled select 의 값 유지
    defaultValue={state?.values?.category ?? ""}
    ...
  >
    ...
  </select>
  <input ... onKeyDown={blockNonInteger} ... />
</form>
```

---

## 📁 현재 폴더 상태 (Day 13 추가분 ★)

```
stylefit/app/
├── lib/
│   ├── dal.ts                                (Day 8) — requireSellerProfile 추가 (Day 13)
│   └── service-categories.ts                 ★ Day 13
├── services/
│   └── page.tsx                              (Day 9) — VISIBLE_SERVICE_FILTER 추가 (Day 13)
└── seller/                                   ★ Day 13 (새 영역)
    ├── services/
    │   ├── page.tsx                          ★ 본인 서비스 목록
    │   └── new/
    │       ├── page.tsx                      ★ 등록 페이지
    │       ├── CreateServiceForm.tsx         ★ 폼 (Client)
    │       └── actions.ts                    ★ Server Action
    └── bookings/
        └── page.tsx                          ★ 받은 예약 목록

stylefit/prisma/
├── schema.prisma                             — Service.verificationStatus 추가 (Day 13)
├── seed.ts                                   — updateMany approved (Day 13)
└── migrations/
    └── 20260518093226_add_service_verification/  ★ Day 13
```

---

## 🚀 Day 14 미리보기 — 관리자 검증 워크플로

Day 13 의식적으로 미룬 작업들:
- **Admin 검증 워크플로** (Day 13에 절반만) — 어드민 권한 모델 결정 (`User.role` 컬럼? 환경변수? AdminProfile 테이블?), `/admin/services`·`/admin/sellers` 화면, approve/reject Server Action, reject 사유 UX, 셀러에게 반려 사유 표시
- **서비스 수정/삭제** (셀러 본인) — 외래키 관계 때문에 *완전 삭제 vs `isActive` toggle(soft delete)* 결정 필요
- **SellerProfile pending 안내 페이지** — Day 13에서 pending 셀러를 `/services`로 보내는 임시 처리를 정식 안내 화면으로
- **Day 12 미룬 작업** — `services/page.tsx`의 정렬을 `ServiceCollection.displayOrder` 기준으로 (Prisma 다대다 정렬 학습)
- **경량 정리** — `package.json#prisma` → `prisma.config.ts` 이전 (Prisma 7 deprecated 경고 해소). Prisma **6.19.3 유지**

Day 14가 또 분량 크니 *단계 분할* 필요.

---

## 💡 Day 12·13 통합 회고 — *마켓의 양면을 다 짚기*

| Day | 한 줄 | 의미 |
|---|---|---|
| 12 | 큐레이션 컬렉션 (다대다) | 운영자가 *어떤 서비스를 묶을지* 결정 |
| 13 | 셀러 영역 + 검증 상태 | 셀러가 *어떤 서비스를 만들지* + 운영자가 *통과시킬지* 결정 (절반) |

Day 11까지는 *구매자가 보는 마켓*. Day 12·13에 *운영자·셀러의 작동 영역*이 추가됨. 마켓의 *세 주체* (구매자·셀러·운영자) 가 *모두 자기 자리*를 갖게 됨.

---

## ✅ 한 줄 요약

> **"디자이너가 *자기 마켓의 셀러 자리*를 만들고, 거기서 *자기가 만든 서비스를 등록*해본다 — 13일 전엔 빈 폴더였던 게."**

---

## 🧠 한 가지 회고 — *디자이너의 *실사용 시뮬레이션 가치*가 또 입증됨*

Day 11에서 7개 UX 마찰 짚어내신 *디자이너 시각*이 Day 13에서도 *결정적*. 폼 만들고 *작동만 확인*하는 백엔드 흐름이었다면 다음 약점들이 그대로 갔을 거예요:
- step=1000 + min=1 → 99001/100001만 유효한 *수학적 버그*
- 분 단위만 입력 → 10일=14400 같은 *기괴한 입력*
- 카테고리 자유입력 → 표기 분산 누적 → Day 15 검색에서 부채
- 영문 직역체 에러 메시지
- 카테고리 초기화 (select key trick 누락)

*디자인 전공자가 실사용자처럼 폼을 만지며* 짚은 이 7개가 *Day 13 폼을 실제 사용 가능한 수준*으로 끌어올림. **AI가 코드를 빠르게 짤 수 있지만, *진짜 쓸 만한지*는 *디자이너의 실사용 검증*에서만 나옴.**

---

*문서 끝. Day 14로 이어짐 — 관리자 검증 워크플로.*
