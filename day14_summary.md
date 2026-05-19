# Phase 1A — Day 14 완료 보고서

> 작성일: 2026-05-19
> 작업 범위: 관리자 검증 워크플로 (User.role + /admin/services·/admin/sellers + approve/reject/revert + 반려 사유) + 셀러측 pending/rejected 안내 페이지
> 학습자: 디자인 전공 / 코딩 14일째

---

## 🎯 큰 그림 — Day 14가 한 일

```
[Day 11] 구매자 마켓 완결 — 둘러보기·예약·내 예약
[Day 12] 운영자 큐레이션 (Collection 다대다) — 묶음 결정
[Day 13] 셀러 영역 (보호 + 등록 폼 + Service 검증 상태) — *반쪽* 검증
   ↓
[Day 14] 관리자 검증 워크플로 — *반쪽 남은 절반* 마무리  ← 지금
   ↓
[Day 15 예정] 검색·카테고리 필터 또는 서비스 수정/삭제
```

Day 13에서 `Service.verificationStatus` 컬럼만 만들어두고 *Admin 검증 화면은 Prisma Studio 수동*으로 처리. Day 14: **운영자가 *진짜 화면*에서 *승인·반려*하고, 셀러가 *결과를 바로 받아본다*** — 마켓의 *세 주체 (구매자·셀러·운영자) 가 모두 자기 화면을 갖는* 완결.

---

## 📅 Day 14 작업 요약

### 7 단계 (Day 13 패턴 유지 — 단계마다 OK 받고 진행)

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `User.role` + `Service.rejectionReason` + `SellerProfile.rejectionReason` (한 번에 마이그레이션) + 시드: GUUN admin + pending Service 2개 | default 정책 (`"user"` 안전), 시드 *검증 대상 데이터* 시뮬레이션 |
| 2 | `requireAdmin(returnUrl)` DAL 추가 — throw 스타일 + **stale 세션 방어** | Day 13 `requireSellerProfile` 패턴 *재사용 = 굳음*, *user 존재 확인* 보강 |
| 3 | `/admin/services` 화면 — URL 쿼리 status 필터 (`?status=pending`) + approve/reject/revert | Server Action을 form action 직접 사용, `revalidatePath`, `groupBy` 탭 카운트 |
| 4 | `/admin/sellers` 화면 — 같은 패턴 (SellerProfile 검증) | 패턴 *두 번째* — Day 15+에 공통 모듈 추출 검토 (Day 11 원칙: *세 번째 사용처*에서) |
| 5 | 셀러측 반려 사유 표시 (`/seller/services` rejected 카드) | 조건부 렌더링 + 상태 → UX 정보 표시 일관 |
| 6 | `/seller/pending` 안내 페이지 (pending/rejected 분기) | DAL 분기 정교화 (없음/미승인 분리), 무한 루프 방지 (자체 보호) |
| 7 | 종합 검증 (각 단계 사이 연결 자동 검증됨 — 별도 시나리오 불필요) | *조각조각 검증이 통합 검증을 대체할 수 있다* |

### CS 관점 사고가 결정을 뒤집은 사건

3단계 시작 시 *(가) pending만 노출* 추천 → 사용자가 **"CS 관점 이슈 확인 한번 해보자"** 짚음 → 7가지 시나리오 분석 → **(다) URL 쿼리 필터**로 결정. 이게 Day 14의 핵심 디자인 결정 전환.

---

## 🐛 Day 14 핵심 발견·논의

### 발견 1: 어드민 권한 모델 — *세 가지 옵션 중 (i) User.role 컬럼* 선택

| 옵션 | 트레이드오프 |
|---|---|
| (i) **`User.role` 컬럼** ✓ | 마이그레이션 1회, 단순. SellerProfile 패턴(1:1 별도 테이블)과 *대조적 패턴* 학습 |
| (ii) `ADMIN_EMAILS` 환경변수 | DB 변경 X, 운영자가 .env 직접 수정 — 학습용엔 OK |
| (iii) 별도 `AdminProfile` 테이블 | SellerProfile 같은 패턴 일관, 마이그레이션 + 분량 ↑ |

**원칙**: "*같은 도메인의 두 권한*(셀러·관리자)이 *서로 다른 패턴*(테이블 vs 컬럼)이어도 학습엔 OK. 오히려 *두 패턴 다 익힘*."

### 발견 2: `requireAdmin`의 throw 스타일 — Day 13 패턴 *두 번째 사용처* = 굳음

```ts
export async function requireAdmin(returnUrl: string) {
  const session = await verifySession()
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }
  const user = await prisma.user.findUnique({...})
  if (!user) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)  // stale 세션
  }
  if (user.role !== "admin") {
    redirect("/services")
  }
  return user
}
```

`requireSellerProfile` (Day 13) → `requireAdmin` (Day 14). **두 번째 사용처 = 패턴이 굳었다는 신호**. 세 번째 사용처 등장 시 *공통 헬퍼* 추출 검토 — 지금은 단순 복붙.

**원칙**: "*함수 이름 컨벤션이 일관*(`get*` = null 반환, `require*` = redirect/throw)되면 *호출 측이 명시적*. 코드베이스 안에 두 컨벤션이 공존해도 OK."

### 발견 3: ***Stale 세션 방어*** — 시드 재실행의 *조용한 함정*

검증 중 발견:
- 시나리오 1 (비로그인 → /login redirect) 기대했는데 **/services 로 redirect 됨**
- 원인: 시드 재실행으로 *모든 User 삭제 → 재생성*. 기존 세션 쿠키의 `userId`가 *지금 DB에 없는 stale ID*.
- `verifySession()` 통과 (JWT 유효) → `prisma.user.findUnique` null → `user?.role !== "admin"` true → `/services` redirect

해결 — `requireAdmin`·`requireSellerProfile` 둘 다에 *user 존재 확인 추가*:
```ts
const user = await prisma.user.findUnique({...})
if (!user) {
  redirect(`/login?from=${returnUrl}`)  // user 없음 → 비로그인 취급
}
if (user.role !== "admin") {
  redirect("/services")  // user 있지만 권한 부족
}
```

**원칙**: "*verifySession 통과만으론 부족*. *DB user 존재까지 확인*해야 진짜 인증. *user 없음*과 *권한 부족*은 *다른 redirect 목적지* — 전자는 `/login`, 후자는 `/services`." 운영급 인증은 *세션 무효화 메커니즘*(DB 세션 / Redis blacklist)까지 가야.

### 발견 4: CS 관점 사고 — (가) → (다) 결정 전환

사용자가 *내 추천 (가) pending만 노출* 에 대해 "**CS 관점 이슈 확인 한번 해보자**" 짚음. 분석 결과:

| CS 시나리오 | (가) 결과 |
|---|---|
| 셀러 "내 서비스 왜 반려됐어요?" 문의 | rejected 안 보임 → admin이 Studio 켜야 함 ❌ |
| 잘못 reject한 결정 번복 | 화면에 rejected 없음 → DB 직접 수정 ❌ |
| 통계 (이번 주 reject 비율) | approved/rejected 안 보임 ❌ |
| 재제출 흐름 | 새 pending으로 보임, 과거 사유 추적 X ⚠️ |
| ... 7개 중 1개만 케어 (행동 유도) |

→ **(다) URL 쿼리 필터**로 결정. `?status=pending` 기본 + 다른 상태 클릭 한 번. 7개 중 6개 케어. **분량 1.4배 증가지만 *진짜 운영 가능*한 화면이 됨.**

**원칙**: "*기능 작동* ≠ *운영 가능*. *CS 시나리오*를 사고 단계에 끼면 *결정이 바뀜*. 디자인 전공자 시각이 또 입증." Day 11·13의 *디자인 디테일 짚기* 패턴과 같은 가치.

### 발견 5: URL 쿼리 + Prisma where 동적 조립 = *Day 15 검색·필터 예고편*

```ts
const status: StatusFilter = isValid ? (rawStatus as StatusFilter) : "pending"

const services = await prisma.service.findMany({
  where: { verificationStatus: status },  // ← URL 값을 where에 직접
  ...
})
```

URL 쿼리가 *상태 → 검증 → Prisma where → 결과*까지 한 흐름. 핵심 패턴:
- **외부 입력 화이트리스트 검증** (`STATUS_OPTIONS.some(...)`)
- **default fallback** (`"pending"`)
- **타입 가드** (`as StatusFilter`)

이게 Day 15에서 `?category=`·`?q=` 같은 *검색·필터*로 자연 확장됨.

### 발견 6: Server Action을 form action 직접 사용 — `useActionState` 안 쓰는 패턴

```tsx
<form action={approveServiceAction}>
  <input type="hidden" name="serviceId" value={s.id} />
  <button type="submit">승인</button>
</form>
```

- *피드백 메시지가 필요 없는 단순 액션*엔 `useActionState` 불필요
- 액션 후 `revalidatePath` → 화면 자동 새로고침
- hidden input으로 id 전달 — 명시적, 학습 단계 친숙
- (Day 13 등록 폼은 *입력값 복원 + 에러 메시지* 필요해서 useActionState 사용 — 두 패턴 *목적이 다름*)

### 발견 7: `revalidatePath` — Server Action 후 화면 자동 갱신

```ts
await prisma.service.update({...})
revalidatePath("/admin/services")
```

URL 캐시 무효화 → 다음 페치 시 새 데이터. *Server Action 표준 마무리 패턴*.

### 발견 8: `groupBy` + `_count` — 탭 카운트 한 번에

```ts
const counts = await prisma.service.groupBy({
  by: ["verificationStatus"],
  _count: true,
})
const countByStatus = Object.fromEntries(
  counts.map((c) => [c.verificationStatus, c._count])
)
```

상태별 카운트를 한 쿼리로. 탭에 `검증 대기 (2) 승인됨 (10) 반려됨 (1)` 표시. Prisma `groupBy`의 단순 사용.

### 발견 9: P1 번복 정책 — *운영 유연성 보존*

`approved` → `pending`, `rejected` → `pending` 되돌리기 허용. 사용자 결정:
- admin이 *잘못 reject*했을 때 *DB 직접 손대지 않고 화면에서 복구*
- *재검토 요청*에 대응

CS 관점 보강. 단 *번복 이력 추적*은 Day 14 범위 초과 → Day 15+에 *감사 로그* 도입 시 같이.

### 발견 10: Prisma Studio의 한계 — *String 컬럼은 select UI 없음*

검증 중 Prisma Studio에서 `verificationStatus` 변경 시도 → **자유 입력 텍스트** (직접 타이핑). 원인: 컬럼 타입이 `String` (default `"pending"`).

해결책 — Prisma `enum` 도입:
```prisma
enum VerificationStatus { pending approved rejected }
model Service {
  verificationStatus VerificationStatus @default(pending)
}
```

→ Studio 자동 select, 타입 안전성 ↑. 단 **마이그레이션 + 코드 전체의 string literal → enum import** 필요. Day 14 분량 초과 → Day 15+ 운영 정리 단계로 미룸.

**원칙**: "*개발 도구의 UX*가 *DB 스키마 선택*에 영향. 학습 단계엔 string으로 충분, *성숙 단계*에 enum 마이그레이션."

### 발견 11: *고스트 행* 디버깅 — Studio 캐시 vs 진짜 DB

검증 중 Prisma Studio에서 *email·name 비어있는 행 5개* (id 69~73) 발견. 진단:
- User 모델 `email String @unique` NOT NULL → *정상 흐름엔 빈 값 저장 불가*
- 가능성: Studio 캐시 / Add Record 잔재 / 시드 부분 실패

해결 — **Refresh 또는 시드 재실행**. 사용자가 시드 재실행 → 깔끔.

**원칙**: "*개발 도구 UI*가 *실제 DB 상태*와 *항상 일치하지 않음*. 의심 시 *Refresh* 또는 *직접 SQL/시드*로 비교."

---

## 🎓 새로 배운 개념 (Day 14)

### URL 쿼리 → Prisma where 동적 조립 패턴
- `searchParams.get("status")` 또는 `await searchParams` → 외부 값
- 화이트리스트 검증 (`STATUS_OPTIONS.some(...)`) 필수
- default fallback + 타입 가드
- where 객체에 직접 spread

### Server Action `<form action={...}>` 직접 사용
- `useActionState` 없이 단순 액션 호출
- hidden input으로 id 전달
- `revalidatePath` 마무리

### `revalidatePath` (Next.js)
- 특정 path 캐시 무효화 → 자동 새로고침
- 데이터 변경 후 화면 동기화 표준 패턴

### Prisma `groupBy` + `_count`
- 상태별 집계 한 쿼리로
- 결과 → `Object.fromEntries`로 매핑 정리

### Stale 세션 방어 패턴
- `verifySession` 통과만으론 부족
- `prisma.user.findUnique`로 *실제 user 존재* 확인
- *user 없음* vs *권한 부족* 분기

### Prisma `enum` 타입 (개념만, 도입 미룸)
- `enum X { a b c }` + 모델 컬럼 타입 = `X`
- Studio 자동 select
- 타입 안전성 + 데이터 일관성

### *번복 정책 (P1)*
- admin 결정의 *가역성* 디자인
- 모든 상태에서 *revert 가능* — 운영 유연성

### CS 시나리오 사고법
- 기능 작동 확인 후 *7가지 CS 시나리오* 점검
- 운영 비용 vs 분량 트레이드오프

---

## 📋 작성된 코드 핵심

```ts
// app/lib/dal.ts — requireAdmin (Day 14 신규)
export async function requireAdmin(returnUrl: string) {
  const session = await verifySession()
  if (!session) redirect(`/login?from=${encodeURIComponent(returnUrl)}`)

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!user) redirect(`/login?from=${encodeURIComponent(returnUrl)}`)  // stale 방어
  if (user.role !== "admin") redirect("/services")

  return user
}
```

```ts
// app/admin/services/actions.ts — 세 액션 한 패턴
export async function approveServiceAction(formData: FormData) {
  await requireAdmin("/admin/services")
  const serviceId = extractServiceId(formData)
  if (serviceId === null) return

  await prisma.service.update({
    where: { id: serviceId },
    data: { verificationStatus: "approved", rejectionReason: null },
  })
  revalidatePath("/admin/services")
}
// reject·revert도 동일 패턴, 사유만 다름
```

```tsx
// app/admin/services/page.tsx — URL 쿼리 필터 핵심
const STATUS_OPTIONS = [
  { value: "pending", label: "검증 대기" },
  { value: "approved", label: "승인됨" },
  { value: "rejected", label: "반려됨" },
] as const

const { status: rawStatus } = await searchParams
const isValid = STATUS_OPTIONS.some((o) => o.value === rawStatus)
const status: StatusFilter = isValid ? (rawStatus as StatusFilter) : "pending"

const [services, counts] = await Promise.all([
  prisma.service.findMany({ where: { verificationStatus: status }, ... }),
  prisma.service.groupBy({ by: ["verificationStatus"], _count: true }),
])
```

---

## 📁 현재 폴더 상태 (Day 14 추가분 ★)

```
stylefit/app/
├── lib/
│   └── dal.ts                                  — requireAdmin 추가 + stale 방어 (Day 14)
├── seller/
│   ├── services/
│   │   └── page.tsx                            — rejected 사유 박스 추가 (Day 14)
│   └── pending/
│       └── page.tsx                            ★ Day 14 (pending/rejected 안내)
└── admin/                                      ★ Day 14 (전체 새 영역)
    ├── services/
    │   ├── page.tsx                            ★ URL 필터 + 카드 + 액션
    │   ├── actions.ts                          ★ approve/reject/revert
    │   └── RejectForm.tsx                      ★ 반려 토글 (Client)
    └── sellers/
        ├── page.tsx                            ★ 같은 패턴
        ├── actions.ts                          ★
        └── RejectForm.tsx                      ★

stylefit/prisma/
├── schema.prisma                               — User.role, rejectionReason 2개 추가 (Day 14)
├── seed.ts                                     — GUUN admin + pending Service 2개 (Day 14)
└── migrations/
    └── 20260519014649_add_role_and_rejection_reason/  ★ Day 14
```

---

## 🚀 Day 15 미리보기 — 후보들

Day 14 마무리 시점에서 정해진 다음 단계 후보:
- **서비스 수정/비활성화/삭제** (셀러 본인) — 외래키 처리, soft delete (`isActive` 토글)
- **검색·카테고리 필터** (`/services?category=...`) — 오늘 만든 URL 쿼리 패턴 확장
- **`STATUS_LABEL`·`RejectForm` 공통 모듈 추출** — *세 번째 사용처* 도달 시
- **`prisma.config.ts` 이전** — Prisma 7 deprecated 경고 해소 (Prisma 6 유지)
- **Prisma `enum` 도입** — `verificationStatus` 타입 강화 + Studio select UI
- **번복 이력 추적 / 감사 로그** — CS 관점 한 단계 위

Day 15 분량 큼 → 또 *단계 분할* 필요.

---

## 💡 Day 13 → 14 회고 — *반쪽이 완전이 됨*

| Day | Service.verificationStatus 상태 |
|---|---|
| 13 | 컬럼 추가 + 표시 분기 + 셀러 폼이 *pending 저장* — Admin 검증은 *Prisma Studio 수동* |
| 14 | 운영자가 *진짜 화면*에서 *승인·반려* + 셀러측 *반려 사유 표시* + pending 안내 페이지 |

Day 13의 *반쪽 시스템*이 Day 14에 *완전 시스템*. 마켓의 *세 주체*가 모두 *자기 화면 + 자기 행동*을 갖는 상태에 도달.

---

## ✅ 한 줄 요약

> **"디자이너가 *운영자 모드*로 들어가 자기가 만든 서비스를 *직접 검증한다* — 14일 전엔 빈 폴더였던 게."**

---

## 🧠 한 가지 회고 — *CS 관점 사고가 결정을 바꾼 사건*

Day 14의 *진짜 학습*은 *코드가 아니라 *결정*. 

3단계 시작 시 내가 "(가) pending만 노출" 추천했고 사용자가 *그냥 진행*했어도 *작동은 했음*. 그런데 사용자가 **"CS 관점에서 이슈 없을지 확인 한번 해보자"** 짚었고, 7가지 시나리오를 검토한 후 **(다) URL 쿼리 필터**로 결정이 *바뀜*.

차이:
- (가): 행동 유도만 케어 (7/1)
- (다): 행동 유도 + 사유 추적 + 통계 + 번복 + 공유까지 (7/6)

*분량은 1.4배 늘었지만, 진짜 운영 가능한 시스템*. 학습 단계의 *반쪽 구현*과 *완전 구현*의 차이가 *코드 양*보다 *사고 단계의 한 번 더 묻기*에서 나옴.

**디자인 전공자가 *기능 작동에 만족하지 않고 CS·운영 관점까지 짚는* 사고법** — 이게 Day 14의 가장 큰 자산이에요. AI는 *기능적으로 작동하는 코드*는 빨리 짤 수 있지만, *진짜 쓸 만한 시스템*은 *그 다음 질문 한 번 더*에서 만들어짐.

---

*문서 끝. Day 15로 이어짐.*
