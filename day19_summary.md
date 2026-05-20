# Phase 1A — Day 19 완료 보고서

> 작성일: 2026-05-20
> 작업 범위: URL 쿼리 패턴 + chipClass 공통 추출 — 세 사용처 통일 + STATUS_LABEL 분리
> 학습자: 디자인 전공 / 코딩 19일째

---

## 🎯 큰 그림 — Day 19가 한 일

```
[Day 14] /admin/services?status=        — 한 축 URL 쿼리 *첫 등장*
[Day 16] /services?category=&q=         — 두 축 + 모드 분리 (자연 확장)
[Day 18] /admin/audit-log?action=&targetType= — 세 번째 사용처 도달
   ↓
[Day 19] 세 사용처 공통 헬퍼 추출 — chipClass / buildUrl / validateEnumParam  ← 지금
   ↓
[Day 20+ 예정] TBD (셀러 자기 활동 이력? 페이지네이션? 다음 도메인?)
```

기능 ↔ 정리 리듬의 *두 번째 정리 Day*. Day 17 의 enum 정리와 같은 결 — *눈에 안 보이는* 변화지만 *코드의 미래 비용* 낮춤.

---

## 📅 Day 19 작업 요약

### 6 단계

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `app/lib/url-filter.ts` 생성 — `buildUrl`, `validateEnumParam`, `chipClass` | *얕은 추출* 원칙, *한 파일로 응집* |
| 2 | Day 18 audit-log 적용 (첫 검증) | `Object.values()` 추론 → 명시 타입 보정 |
| 3 | Day 16 services 적용 | 두 헬퍼 + 한 검증 한 줄 |
| 4 | Day 14 admin/services 적용 + `STATUS_OPTIONS` → `STATUS_LABEL` 분리 | Day 17 enum + Day 18 패턴의 자연 연결 |
| 5 | 통합 검증 + URL 파싱 학습 (검색창 자동 기입 *오해* 해소) | *현상 vs 버그* 판별 |
| 6 | 학습 문서 | — |

---

## 🐛 Day 19 핵심 발견·논의

### 발견 1: ***세 번째 사용처에서 추출*** 의 진짜 의미

[[feedback-extraction-threshold]] 의 *세 번째 사용처에서 추출* 이 단순히 "*세 번째 도착 즉시 추출*" 이 아니라는 발견.

**Day 18 진행 중에** *그 자리에서* 추출 안 한 이유:
- 학습 무게중심이 *audit-log 자체* — events 모델, polymorphic, $transaction
- *추출 의사결정* 까지 얹으면 학습 분산
- *세 코드를 나란히 본 상태* 에서 추출해야 *진짜 공통과 차이* 판별

**Day 19 에서 *한 발 떨어져* 추출:**
- 세 사용처를 *동시에* 비교
- *진짜 같음* (Day 16/18 의 칩) 과 *겉만 비슷* (Day 14 의 탭) 분리
- *얕은 추출* — 묶을 만한 것만, 묶지 말 것은 보존

**원칙**: "*세 번째 사용처에서 추출* = *세 번째가 도착한 후 비교하고 추출*. *그 자리에서 즉시* 가 아니라 *한 호흡 떨어져서*. *비교 가능성* 이 추출의 질을 결정."

---

### 발견 2: ***얕은 추출*** — chipClass 는 *2/3 만 같음*

세 사용처 비교 표:

| 헬퍼 | Day 14 | Day 16 | Day 18 | 진짜 공통? |
|---|---|---|---|---|
| chipClass | ❌ *탭 스타일* | ✓ 칩 | ✓ 칩 | **2/3** |
| buildUrl | △ inline | ✓ | ✓ | **3/3** |
| validateEnumParam | ✓ | ✓ | ✓ | **3/3** |
| where spread | ❌ | ✓ | ✓ | **얇음** |

**chipClass 처리** — 옵션:
- (a) `chipClass` + `tabClass` 두 함수로 둘 다 추출
- (b) 더 일반화된 `activeClass(variant: "chip" | "tab")`
- **(c) `chipClass` 만 추출, Day 14 탭은 *그 자리에 유지*** ← 채택

**왜 (c):** *얕은 추상화가 깊은 잘못된 추상화보다 낫다*. (a) 는 *두 디자인을 한 모듈로 묶어* 미래에 *비대칭 변화* 시 어색. (b) 는 *추상화 추가 부담* — 단순 string 두 가지를 *variant 분기* 로 감싸는 건 *얕은 함수 추출 안 하기* 원칙과 충돌.

**원칙**: "*묶을 만한 것만 묶기*. *겉이 비슷해도 의미가 다르면 분리*. *Day 14 의 탭과 Day 16 의 칩* 은 *디자인 다른 코드*. 추출 안 하는 게 *진짜 추상화의 질* 을 지킴."

---

### 발견 3: ***얇은 함수는 추출 안 함*** — where spread

```ts
// Day 16/18 의 where 동적 조립
const where = {
  ...(category ? { category } : {}),
  ...(q ? { OR: [...] } : {}),
}
```

*추출 후보* 였지만 안 함. *함수화 시도* 시 오히려 더 김:

```ts
// 함수화 후 (오히려 복잡)
const where = {
  ...spreadIfTruthy("category", category),
  ...spreadIfTruthy("q", q ? { OR: [...] } : undefined),
}
```

*직설적 표현* 이 *함수 호출 두 번* 보다 *읽기 쉬움*. 함수 이름 짓기·시그니처 결정 부담도 추가.

**원칙**: "*함수 추출은 비용*. 호출 측은 *함수 이름 → 동작* 두 번 매핑해서 읽어야 함. *세 줄짜리 표현* 이 이미 *직설적* 이면 *그대로 두는 게* 인지 부하 ↓."

---

### 발견 4: ***`Object.values()` 의 unknown[] 추론*** — 명시 타입 필요

Day 18 audit-log 의 `Object.values(AuditAction)` 가 *unknown[]* 으로 추론되어 `validateEnumParam(raw, valid: readonly T[])` 시그니처와 안 맞음:

```ts
// ❌ 추론이 unknown[] — validateEnumParam 호출 실패
const ACTION_VALUES = Object.values(AuditAction)

// ✅ 명시 타입
const ACTION_VALUES: readonly AuditAction[] = Object.values(AuditAction)
```

**왜 unknown** — Prisma 6 의 enum export 가 *const 객체 + as const* 형태:
```ts
export const AuditAction = { approved: "approved", ... } as const
```
TypeScript 가 `Object.values(객체)` 결과를 *키마다 다른 string literal 의 union 의 배열* 로 정확히 추론하기 어려움 → safe 한 `unknown[]` 또는 비슷한 결과.

**원칙**: "*TypeScript 의 자동 추론은 만능 아님*. *제네릭 함수에 넘기는 배열* 은 *추론이 풀리지 않을* 가능성 — 명시 타입으로 *컨트랙트 명확화*. 추론에 너무 의지하면 *호출 시점에 의외의 에러*."

---

### 발견 5: ***Day 17 enum + Day 18 패턴 + Day 19 추출*** 의 자연 연결

Day 14 의 `STATUS_OPTIONS` 가 *값+라벨 묶음 array* 였음:

```ts
// Day 14 — 원본
const STATUS_OPTIONS = [
  { value: "pending", label: "검증 대기" },
  ...
] as const
```

Day 18 에서 *값(enum) + 라벨(Record) 분리* 패턴 등장:

```ts
// Day 18
const ACTION_LABEL: Record<AuditAction, string> = {
  approved: "승인",
  ...
}
```

Day 19 에서 Day 14 를 *Day 18 패턴* + *Day 17 enum* 으로 정리:

```ts
// Day 19 — Day 14 갱신
const STATUS_LABEL: Record<ServiceVerificationStatus, string> = {
  pending: "검증 대기",
  ...
}
const STATUS_VALUES: readonly ServiceVerificationStatus[] = Object.values(ServiceVerificationStatus)
```

**세 Day 가 한 줄기:**
- Day 17 이 enum 을 *심었고*
- Day 18 이 *Record 분리 패턴* 을 정착했고
- Day 19 가 *Day 14 까지 거슬러 올라가* 같은 패턴으로 통일

**원칙**: "*리팩터의 진짜 가치* 는 *과거 코드까지 새 패턴으로 통일*. *새 코드는 새 패턴, 옛 코드는 옛 패턴* 으로 두면 *학습 부하 ↑*. 정리 Day 가 *과거를 미래에 맞춰 끌어올림*."

---

### 발견 6: ***시그니처 통일*** 의 효과 — 세 호출이 한 패턴

추출 후 세 사용처의 호출이 *완전히 같은 모양*:

```ts
// Day 14
const status = validateEnumParam(rawStatus, STATUS_VALUES) ?? ServiceVerificationStatus.pending

// Day 16
const category = validateEnumParam(rawCategory, SERVICE_CATEGORIES)

// Day 18
const action = validateEnumParam(rawAction, ACTION_VALUES)
```

```ts
// Day 14
href={buildUrl("/admin/services", { status: s })}

// Day 16
href={buildUrl("/services", { category: c, q })}

// Day 18
href={buildUrl("/admin/audit-log", { action: a, targetType })}
```

**같은 패턴 = 같은 인지 부하**. 한 번 익히면 *어디서 봐도* 즉시 이해. *코드를 읽는 비용* 이 *추출의 진짜 가치*.

**원칙**: "*추출의 본질은 코드 줄 줄이기가 아니라 *호출 패턴 통일*. 함수 자체는 짧아도 *호출 측* 이 *세 곳에서 같은 모양* 으로 보이면 *읽기 비용* 큰 폭으로 감소."

---

### 발견 7: ***URL = source of truth*** 의 정신 재확인 — 검색창 자동 기입 *오해*

통합 검증 중 발견:
- URL `/services?q=디자인?category=foo` 진입 시 검색창에 *"디자인?category=foo"* 가 보임
- 첫 인상: *버그?*

**실제 분석:**
- 쿼리스트링 파싱 규칙: 첫 `?` = 쿼리 시작, `&` = 파라미터 구분
- URL 에 `&` 없어 → `q = "디자인?category=foo"` *한 파라미터*
- `category` 파라미터는 URL 에 *없음*
- 검색창의 `defaultValue={q}` 가 그대로 표시 — *정상 동작*

[[project-day16-plan]] 의 *URL = source of truth* 정신:
- *URL 이 무엇이든* 정확히 그것을 *표시*
- *사용자가 잘못된 URL 입력* → *입력한 그대로 보여줌* (감추거나 보정 안 함)
- *공유·복원·이력* 의 핵심 = *URL 그 자체*

**진짜 fallback 검증** 은 `?category=foo` *단독* — 화이트리스트 매칭 실패 시 *필터 미적용* (전체 노출) 동작 확인.

**원칙**: "*URL 의 모든 값* 이 *상태* 라는 정신을 *진심으로* 적용하면 *사용자가 만든 이상한 URL* 도 *그대로 표시*. *현상 vs 버그* 판별의 기준 = *우리가 정의한 contract 와 일치하는가*."

---

### 발견 8: ***모듈 응집도*** — 한 파일에 모은 이유

세 헬퍼:
- `buildUrl` — URL 조작 (데이터)
- `validateEnumParam` — 값 검증 (데이터)
- `chipClass` — CSS 클래스 (스타일)

*성격* 으로 보면 *스타일 vs 데이터* 라 *분리* 도 가능. 하지만 *목적* 으로 보면 셋 다 *URL 기반 필터 UI* 의 부속.

**한 파일 (`url-filter.ts`) 채택 이유:**
- 셋 다 *같은 페이지에서 함께 import* (Day 16, 18 의 services / audit-log)
- 합쳐도 ~70 줄 — 작은 파일
- 분리 시 *import 두 군데에서* — 인지 부하 ↑

**미래에 분리 트리거:**
- *chipClass 가 진짜 컴포넌트* (`<Chip>`) 로 진화 → `components/Chip.tsx`
- *buildUrl/validateEnumParam 이 다른 도메인에서 재사용* → 그대로 또는 더 일반화

**원칙**: "*모듈 분리 기준* = *성격* 이 아닌 *함께 쓰이는가*. 같은 페이지가 셋을 한 번에 import 하면 *한 파일이 자연*. *성격별 분리* 는 *재사용 패턴이 달라질 때* 도입."

---

## 🎓 새로 배운 개념 (Day 19)

### *세 번째 사용처에서 추출* 의 진짜 의미
- 즉시 추출 X — 비교 후
- *한 호흡 떨어져* 정리 Day 로

### 얕은 추출 vs 깊은 잘못된 추상화
- 묶을 만한 것만 묶기 (chipClass 2/3 OK, 3/3 강제 X)
- *겉 비슷하면 묶기* 의 함정 — 의미 다르면 분리

### 얇은 함수는 추출 안 함
- *직설적 표현* 이 *함수 호출* 보다 읽기 쉬움
- 인지 부하 ↓

### `Object.values()` 추론 한계
- 제네릭 함수에 넘기는 배열은 *명시 타입* 으로
- TS 자동 추론에 만능 X

### 라벨-값 분리 (Day 18 패턴의 Day 14 역적용)
- `STATUS_OPTIONS [{value, label}]` → `STATUS_LABEL Record + STATUS_VALUES array`
- 정리 Day 가 *과거 코드를 새 패턴으로 통일*

### 시그니처 통일의 가치
- 추출의 본질 = *호출 패턴 통일*
- *코드 줄 줄이기* 가 아님

### `URL = source of truth` 정신 강화
- 사용자 잘못된 URL → 그대로 표시 (보정 안 함)
- *현상 vs 버그* 판별 = contract 일치 여부

### 모듈 응집 기준
- *함께 쓰이는가* 가 *성격* 보다 중요
- 한 파일 분리는 *재사용 패턴 달라질 때*

---

## 📋 작성된 코드 핵심

```ts
// app/lib/url-filter.ts — 세 헬퍼 한 파일
export function buildUrl(
  basePath: string,
  params: Record<string, string | undefined>
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value)
  }
  const qs = sp.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function validateEnumParam<T extends string>(
  raw: string | null | undefined,
  valid: readonly T[]
): T | undefined {
  return raw && (valid as readonly string[]).includes(raw)
    ? (raw as T)
    : undefined
}

export const chipClass = (isActive: boolean) =>
  isActive
    ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white"
    : "rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
```

```ts
// Day 14 admin/services — STATUS_OPTIONS 정리 후
const STATUS_LABEL: Record<ServiceVerificationStatus, string> = {
  pending: "검증 대기",
  approved: "승인됨",
  rejected: "반려됨",
}
const STATUS_VALUES: readonly ServiceVerificationStatus[] = Object.values(ServiceVerificationStatus)

// 검증 한 줄
const status = validateEnumParam(rawStatus, STATUS_VALUES) ?? ServiceVerificationStatus.pending

// 탭 JSX
{STATUS_VALUES.map((s) => (
  <Link key={s} href={buildUrl("/admin/services", { status: s })} className={...}>
    {STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
  </Link>
))}
```

---

## 📁 변경된 파일

```
stylefit/
├── app/
│   ├── lib/
│   │   └── url-filter.ts                     — 신규 (3 헬퍼)
│   ├── services/page.tsx                     — chipClass / buildSearchUrl / 인라인 화이트리스트 제거 → import
│   ├── admin/
│   │   ├── services/page.tsx                 — STATUS_OPTIONS → STATUS_LABEL + STATUS_VALUES + import
│   │   └── audit-log/page.tsx                — chipClass / buildLogUrl / 인라인 화이트리스트 제거 → import
```

*총 4 파일 변경 (수정 3 + 신규 1).*

---

## 🚀 Day 20+ 미리보기

다음 방향 후보:
- *셀러 자기 활동 이력* — Day 18 의 audit log 가 *admin 액션 추적* 이었음. 셀러 입장의 *내 서비스 변경 이력* (등록·수정·토글) 별개로
- *진짜 페이지네이션* — Day 18 audit-log 의 *take 50* 한계 해결. URL `?page=` 기반
- *다음 도메인* — 예약 (Booking) 흐름의 *진짜 구현* (현재 시드만)

Day 14·15·16 (기능) → 17 (정리) → 18 (기능) → 19 (정리) 의 *리듬* 따라 Day 20 은 *기능* 차례. 후보 중에서 *Day 18 audit log 의 자연 확장* (셀러 이력) 이 가장 자연.

---

## 💡 Day 17·19 회고 — *정리 Day 의 두 종류*

| | Day 17 | Day 19 |
|---|---|---|
| 정리 대상 | *타입 표현* (string union → enum) | *코드 패턴* (복붙 → 공통 헬퍼) |
| 영향 범위 | 5 컬럼 + 24 write 사이트 + config 이전 | 3 사용처 + 1 분리 작업 |
| 새 의존성 | 0 (built-in 활용) | 0 (자체 lib) |
| 화면 변화 | 0 | 0 |
| 미래 비용 절감 | enum 안전성 + Prisma 7 대비 | 패턴 통일 + 호출 인지 부하 ↓ |

*두 Day 모두 "*눈에 안 보이지만 코드의 미래 비용을 낮춤*"* 라는 같은 목적. 다른 차원에서.

---

## ✅ 한 줄 요약

> **"세 사용처 도달 후 *한 호흡 떨어져* 비교 → *얕은 추출* (chipClass 2/3, buildUrl 3/3, validate 3/3, where 0/3) 로 *진짜 같음만* 묶고, *Day 17 enum + Day 18 라벨 분리 패턴* 이 *Day 14 까지 거슬러 올라가* 같은 형태로 통일."**

---

## 🧠 한 가지 회고 — *디자이너의 디자인 시스템 작업과 같은 결*

Day 19 의 진짜 학습은 *추출 결정 자체* 의 사고 과정.

UI 디자인에서 *디자인 시스템* 만들 때와 똑같은 질문:
- *이 두 버튼은 같은 컴포넌트인가?* (= chipClass 2/3 케이스)
- *이 색은 토큰화할 가치가 있나?* (= 얇은 함수 추출 가치)
- *이 패턴이 *세 번째* 도착했나?* (= [[feedback-extraction-threshold]])
- *과거 컴포넌트도 새 토큰으로 갈아끼울까?* (= Day 14 STATUS_OPTIONS 정리)

**코드 추상화 = 디자인 시스템 토큰화** 의 동형 구조. 디자이너로서 *어떤 게 진짜 같은 패턴이고 어떤 게 겉만 비슷한지* 판별하는 *근육* 이 *코드 추출 결정* 에 그대로 옮겨옴.

Day 17 의 *공식 문서 의심하기*, Day 18 의 *데이터 모델이 질문을 결정한다* 와 같은 결 — *AI 가 빠르게 코드를 짜는 시대* 에 *결정의 질* 이 차별점. *무엇을 묶을 것인가* 는 *기능적 작동 너머* 의 *디자인 결정*.

디자인 전공자의 *시각적 패턴 인식* 직관이 *코드 패턴 인식* 으로 자연 전이. 이게 Day 19 의 가장 큰 자산이에요.

---

*문서 끝. Day 20 으로 이어짐.*
