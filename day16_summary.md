# Phase 1A — Day 16 완료 보고서

> 작성일: 2026-05-19
> 작업 범위: 구매자 검색·카테고리 필터 (URL 쿼리 다축 결합 + 탐색·검색 모드 분리)
> 학습자: 디자인 전공 / 코딩 16일째

---

## 🎯 큰 그림 — Day 16이 한 일

```
[Day 12] 운영자 큐레이션 (Collection 다대다) — 핫·추천 섹션
[Day 14] 관리자 검증 워크플로 — URL 쿼리 + Prisma where 동적 조립 *첫 등장*
[Day 15] 셀러 수정/숨기기 — 닫힌 행동 루프
   ↓
[Day 16] 구매자 검색·필터 — Day 14 패턴이 *다축* 으로 자연 확장  ← 지금
   ↓
[Day 17 예정] Prisma 정리 (enum 도입 + config.ts 이전)
```

Day 14에서 *한 축* 필터 (`?status=`) 가 처음 등장했고, Day 16에 **두 축 결합** (`?category=&q=`) 으로 자연 확장. 동시에 *탐색 vs 검색 모드 분리* — 큐레이션 의도와 검색 의도가 *다른 UI*가 자연이라는 디자인 결정.

---

## 📅 Day 16 작업 요약

### 6 단계 (Day 14·15 패턴 유지)

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | 카테고리 필터 — URL 파싱 + `baseWhere` 동적 조립 | 화이트리스트 + 빈 객체 spread 패턴 |
| 2 | 카테고리 칩 UI — *전체* + 5개 카테고리, 활성 상태 강조 | `chipClass` 헬퍼 (6 사용처 즉시 추출), `encodeURIComponent` 명시 |
| 3 | 검색 q 입력 — 폼 GET submit | `form action 없이* URL 변경만으로 재페치, 검색어 sanitize 이중 방어 |
| 4 | 두 축 결합 — `buildSearchUrl` 헬퍼 + 빈 결과 UI | `URLSearchParams` 자동 인코딩, `Section` 의 `emptyMessage` prop |
| 5 | 모드 분리 — 탐색 vs 검색 | `isSearchMode` 분기, 쿼리 분기 (성능), 큐레이션 섹션 조건부 렌더 |
| 6 | 통합 검증 (단계별 검증이 자연 포함) | *단위 검증의 합 = 통합 검증* 패턴 재확인 |

---

## 🐛 Day 16 핵심 발견·논의

### 발견 1: ***URL 쿼리는 source of truth***

검색·필터 상태를 *React state* 가 아니라 *URL 쿼리* 에 두는 이유:
- 새로고침해도 *상태 유지*
- *공유 가능한 URL* — 사용자가 "이 검색 결과" 링크 공유 가능
- *뒤로가기/앞으로가기* 자연 작동 (브라우저 히스토리)
- *Server Component* 와 자연 통합 — `searchParams` 만으로 데이터 페치 분기

```ts
// state 아닌 URL 이 시작점
const { category: rawCategory, q: rawQ } = await searchParams
// 검증 → where → 쿼리 → 화면 — 모두 server side
```

**원칙**: "*공유·복원·이력*이 필요한 상태는 *URL에*. *순간적 UI 상태*(드롭다운 open 여부 등)만 *state*에. Server Component 시대에 URL 의 가치가 ↑."

### 발견 2: 외부 입력 ***화이트리스트 + 빈 객체 spread***

URL 쿼리의 `category` 가 *임의 값*일 수 있음 (사용자가 주소창에 직접 입력). 명시 목록과 비교 후 통과한 값만 사용:

```ts
const isValidCategory = (SERVICE_CATEGORIES as readonly string[]).includes(rawCategory ?? "")
const category: ServiceCategory | undefined = isValidCategory
  ? (rawCategory as ServiceCategory)
  : undefined

// where 동적 조립 — *값 있을 때만* spread
const baseWhere = {
  ...VISIBLE_SERVICE_FILTER,
  ...(category ? { category } : {}),
  ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
}
```

`...(condition ? { key } : {})` 패턴 — *값 없으면 키 자체가 안 들어감*. Prisma 가 *없는 키는 무시* → 깔끔한 동적 조립.

**원칙**: "*외부 입력*은 *명시 목록과 매칭만 통과*. *임의 값* 그대로 DB 쿼리에 흘리면 *예상 못한 결과*. Day 14 STATUS_OPTIONS 패턴과 같은 형태."

### 발견 3: *form GET submit* — Server Action 없이 URL 변경

검색 폼은 *Server Action 안 씀*. 그냥 `<form>` (action 속성 없음) + `<input name="q">` 만으로:
1. submit 시 브라우저 기본 동작 → 현재 URL 에 `?q=...` 추가
2. Next.js App Router 가 URL 변경 감지 → Server Component 재실행
3. 새 `searchParams` 로 데이터 다시 페치 → 화면 갱신

```tsx
<form>  {/* action 속성 없음 = 현재 URL 로 GET */}
  {category && <input type="hidden" name="category" value={category} />}
  <input type="search" name="q" defaultValue={q} maxLength={100} />
  <button type="submit">검색</button>
</form>
```

*Server Action 의 사용처는 mutation* (create/update/delete). *조회/필터*는 *URL 변경* 만으로 충분.

**원칙**: "*조회·필터·검색* 은 *URL 쿼리 + Server Component 재페치*. *Server Action 은 mutation 용*. 두 모델을 *목적별 분리*."

### 발견 4: ***검색어 sanitize 이중 방어***

```tsx
// UI: 1차 방어
<input maxLength={100} />

// 백엔드: 2차 방어 (UI 우회 차단)
const q = (rawQ ?? "").trim().slice(0, 100)
```

- `trim()` — 공백만 입력 = 빈 검색으로 처리
- `slice(0, 100)` — UI 우회 시 *명시 길이 가드*

**원칙**: "*UI 검증 = UX, 백엔드 검증 = 보안*. 둘 다 있어야 안전. Day 13 등록 폼의 Zod 와 같은 정신."

### 발견 5: SQLite ***contains 는 대소문자 구분***

Prisma `{ title: { contains: q } }` 가 *DB 마다 다르게* 동작:
- **SQLite**: 기본 *case-sensitive*. "Design" 입력 시 "design" 포함 서비스 못 찾음
- **PostgreSQL/MySQL**: `mode: "insensitive"` 옵션으로 대소문자 무시 가능

운영급 검색은 *FTS (Full-Text Search)* / Elasticsearch / Algolia 등 별도 단계. 학습 단계엔 *한계 인지*하고 그대로 둠.

**원칙**: "*DB 마다 SQL semantics 다름* — *학습 시점에 차이 인지*. *추상화 (Prisma) 가 모든 차이를 가리지 않음*."

### 발견 6: `URLSearchParams` — 자동 인코딩, 깔끔한 빌더

다축 URL 빌더 작성 시:

```ts
// ❌ 직접 문자열 조립 — encodeURIComponent 매번 명시 + 빈 값 처리 번거로움
const url = `/services?category=${encodeURIComponent(c)}&q=${encodeURIComponent(q)}`

// ✅ URLSearchParams — 자동 인코딩 + 메서드 체이닝
function buildSearchUrl(opts: { category?: string; q?: string }): string {
  const params = new URLSearchParams()
  if (opts.category) params.set("category", opts.category)  // truthy 일 때만
  if (opts.q) params.set("q", opts.q)
  const qs = params.toString()
  return qs ? `/services?${qs}` : "/services"
}
```

- 한글·공백·"·" 자동 인코딩
- 빈 값일 때 *키 자체가 안 들어감*
- 모든 쿼리 비어있으면 *깔끔한 `/services`* 반환

**원칙**: "*표준 web API* 가 *대부분의 문자열 조립을 대체*. URLSearchParams / URL / Headers — *직접 조립 충동* 들 때 한 번 검색."

### 발견 7: ***탐색 vs 검색 모드 분리*** — 디자인 결정의 코드 표현

핵심 질문: *카테고리 클릭 시 큐레이션(핫·추천) 섹션도 좁혀야 하나?*

| (가) 모든 섹션에 필터 적용 | (나) 검색 모드면 큐레이션 숨기고 단일 결과 섹션 ✓ |
|---|---|
| 한 코드 경로 | 두 모드 분기 |
| 큐레이션 의도가 *필터로 깨짐* | 큐레이션 의도 *보존* |
| 사용자가 "디자인" 검색 시 *디자인 핫* 으로 좁혀짐 — 큐레이션 의의 ↓ | 사용자 의도가 *탐색→검색* 으로 명확히 전환 |

→ **(나) 채택**. *디자인 결정* 이 *쿼리 구조*에 반영:

```ts
const isSearchMode = !!(category || q)

if (isSearchMode) {
  results = await prisma.service.findMany({ where: baseWhere })  // 단일 쿼리
} else {
  ;[hot, featured, results] = await Promise.all([...])  // 세 쿼리
}
```

부수 효과: 검색 모드는 *큐레이션 쿼리 두 개 생략* → 성능 ↑.

**원칙**: "*디자인 결정 → 코드 구조* 의 자연 연결. *모드 분리는 UI 결정이지만 쿼리·렌더·성능 모두에 영향*. 디자인 전공자가 *기능적 작동* 너머의 *의도 정합*을 짚어 결정 자체를 바꾼 사례 — Day 14 의 *CS 관점 사고* 와 같은 가치."

### 발견 8: ***동적 타이틀로 모드 표현***

같은 `results` 변수가 두 의미를 겸함 — JSX 의 *타이틀* 로 의도 분리:

```tsx
<Section
  title={isSearchMode ? `검색 결과 (${results.length}건)` : "전체 서비스"}
  services={results}
  emptyMessage={emptyMsg}
/>
```

*카운트 동적 표시* 가 검색 UX 의 *암묵적 표준* — 사용자가 *몇 건 찾았는지* 즉시 안다.

**원칙**: "*검색 결과 카운트* 는 *유저 신뢰* 의 한 줄. 0건이든 50건이든 *명시*가 *없음* 보다 안전."

### 발견 9: *섹션 자체 미렌더* vs *빈 메시지 박스* 분기

`Section` 함수의 두 케이스:

```ts
if (services.length === 0 && !emptyMessage) return null  // 섹션 자체 미렌더
```

- **탐색 모드 + 큐레이션 미설정 0건**: `emptyMessage` 안 전달 → *섹션 안 보임* (운영자 미설정 = 자연스러운 숨김)
- **검색 모드 + 결과 0건**: `emptyMessage` 전달 → *섹션 헤더 + 회색 박스* (사용자에게 *검색은 됐다*는 신호)

같은 0건이지만 *맥락 다른 UI* — 호출 측이 *맥락을 판단해 prop 결정*.

**원칙**: "*같은 데이터 상태(0건) 가 *다른 맥락* 에서 *다른 UI*. *재사용 컴포넌트의 prop 으로 맥락 받기*."

### 발견 10: ***기존 q 유지*** — URL 빌더의 진가

칩 클릭 시 *기존 검색어 유지*:

```tsx
<Link href={buildSearchUrl({ q })}>전체</Link>  {/* category 만 제거 */}
<Link href={buildSearchUrl({ category: c, q })}>{c}</Link>  {/* category 설정, q 유지 */}
```

폼 submit 시 *기존 카테고리 유지*:

```tsx
{category && <input type="hidden" name="category" value={category} />}
```

두 방향 다 *서로의 축을 보존*. *다축 결합 UX의 표준*.

**원칙**: "*다축 필터* 는 *축 간 상호 보존* 이 기본. 한 축 변경 시 다른 축 안 날아가야 *자연스러운 탐색*."

---

## 🎓 새로 배운 개념 (Day 16)

### URL = source of truth
- 검색/필터 상태를 URL 쿼리에 — state 아님
- 새로고침 안전, 공유 가능, 이력 자연

### 화이트리스트 + 빈 객체 spread
- `...(condition ? { key } : {})` — Prisma where 동적 조립의 깔끔한 표현
- 외부 입력 검증 후 통과한 값만 쿼리에 흘림

### `URLSearchParams`
- 자동 인코딩 (한글·공백·특수문자)
- 메서드 체이닝 (`set`, `delete`, `toString`)
- 직접 문자열 조립 대체

### form GET submit (Server Action 없이)
- `<form>` 만으로 URL 변경 → Server Component 재페치
- 조회/필터는 GET, mutation 은 Server Action — *목적별 분리*

### `defaultValue` + URL = 입력값 복원
- form 의 `defaultValue` 를 URL 의 q 값으로 → 새로고침 시 *검색어 유지*
- React state 없이도 *uncontrolled* 패턴

### Prisma `OR` + `contains`
- 두 컬럼 검색: `OR: [{ title: { contains } }, { description: { contains } }]`
- SQLite 의 case-sensitive 한계 인지

### 모드 분리 (탐색 vs 검색)
- 사용자 의도 전환을 *쿼리 구조*에 반영
- 검색 모드는 *큐레이션 쿼리 생략* → 성능 ↑

### *섹션 자체 미렌더* 패턴
- 0건 + emptyMessage 없음 → `return null`
- 같은 0건이라도 *맥락 다른 UI* 가능

### 입력 sanitize 이중 방어
- UI: maxLength (UX)
- 백엔드: trim + slice (보안)

---

## 📋 작성된 코드 핵심

```ts
// app/services/page.tsx — 화이트리스트 + 빈 객체 spread
const isValidCategory = (SERVICE_CATEGORIES as readonly string[]).includes(rawCategory ?? "")
const category: ServiceCategory | undefined = isValidCategory
  ? (rawCategory as ServiceCategory)
  : undefined

const q = (rawQ ?? "").trim().slice(0, 100)  // 이중 방어

const baseWhere = {
  ...VISIBLE_SERVICE_FILTER,
  ...(category ? { category } : {}),
  ...(q ? { OR: [
    { title: { contains: q } },
    { description: { contains: q } },
  ] } : {}),
}
```

```ts
// 모드 분리 — 쿼리 자체가 분기
const isSearchMode = !!(category || q)

let hot: ServiceCardData[] = []
let featured: ServiceCardData[] = []
let results: ServiceCardData[]

if (isSearchMode) {
  results = await prisma.service.findMany({ where: baseWhere, ... })
} else {
  ;[hot, featured, results] = await Promise.all([
    prisma.service.findMany({ where: { ...baseWhere, collections: {...hot} } }),
    prisma.service.findMany({ where: { ...baseWhere, collections: {...featured} } }),
    prisma.service.findMany({ where: baseWhere, take: 12 }),
  ])
}
```

```ts
// URL 빌더 — URLSearchParams 자동 인코딩
function buildSearchUrl(opts: { category?: string; q?: string }): string {
  const params = new URLSearchParams()
  if (opts.category) params.set("category", opts.category)
  if (opts.q) params.set("q", opts.q)
  const qs = params.toString()
  return qs ? `/services?${qs}` : "/services"
}
```

```tsx
// JSX — 모드별 조건부 렌더
{!isSearchMode && (
  <>
    <Section title="지금 핫한 서비스" services={hot} />
    <Section title="에디터 추천" services={featured} />
  </>
)}
<Section
  title={isSearchMode ? `검색 결과 (${results.length}건)` : "전체 서비스"}
  services={results}
  emptyMessage={emptyMsg}
/>
```

---

## 📁 현재 폴더 상태

```
stylefit/app/
├── services/
│   └── page.tsx                            — 검색·필터·모드 분리 (Day 16, 단일 파일 수정)
└── ...
```

Day 16은 *단일 파일 (`app/services/page.tsx`) 변경*. 새 라우트·새 컴포넌트 없음 — *기존 페이지의 능력 확장*.

---

## 🚀 Day 17 미리보기 — Prisma 정리 묶음

[[project-day15-plan]] / [[project-day16-plan]] 메모 따라:

- **#5 Prisma `enum` 도입** — `verificationStatus`, `Booking.status` 등 *string union* 을 enum 으로
  - DB 수준 타입 안전성 ↑
  - Prisma Studio 자동 select UI
  - 마이그레이션 + 기존 코드의 string literal → enum import 변경 작업
- **#4 `prisma.config.ts` 이전** — Prisma 7 deprecated 경고 해소

두 작업이 *Prisma 영역의 정리* 라 묶기 자연. 분량 적정.

---

## 💡 Day 14·15 → 16 회고 — *패턴이 *진짜 활용* 되는 순간*

| Day | URL 쿼리 + Prisma where 동적 조립 |
|---|---|
| 14 | 한 축 (`?status=`) — admin 검증 탭 |
| 15 | (사용 안 함, 본인 소유 가드 다른 패턴) |
| 16 | *두 축* (`?category=&q=`) + *모드 분리* + *URL 빌더* — 같은 패턴이 *3배 깊이* |

Day 14에서 *기본 형태*를 익혔고, Day 16에 *진짜 다양한 변형*을 다뤘음. *학습한 패턴이 진짜 활용되는 시점*에 도달.

---

## ✅ 한 줄 요약

> **"Day 14 의 *한 축 URL 쿼리* 가 Day 16 에 *두 축 + 모드 분리* 로 자연 확장 — 디자이너의 *의도 정합* 직관이 검색 UX 의 모드 분리를 결정."**

---

## 🧠 한 가지 회고 — *디자인 결정이 쿼리 구조를 바꾼 사건*

Day 16의 *진짜 학습* 은 15-... 아니, 16-5. *모드 분리*.

처음 단순화 가설은 "모든 섹션에 필터 적용" 이었음. 코드 한 경로, 분기 없음. 그런데 *디자인 정합* 측면에서 짚으면 — *검색 의도와 큐레이션 의도가 다른* 데, 같은 화면으로 묶으면 *큐레이션 의의 ↓*.

이 결정이 *코드 한 경로 → 두 경로* + *쿼리 한 묶음 → 두 묶음* 으로 확장. 분량 증가 비용보다 *사용자 의도 정합 가치*가 크다고 판단.

Day 14의 *CS 관점 사고가 결정을 바꾼 사건* 과 같은 패턴 — *기능적 작동에 만족 안 하고 다음 질문 한 번 더 묻기*. AI 가 *기능적으로 작동하는 코드* 는 잘 짜지만 *진짜 쓸 만한 시스템* 은 *디자인 정합 질문* 에서 나옴.

디자인 전공자의 *의도 정합* 직관이 또 한 번 코드 결정을 바꿈. 이게 Day 16의 가장 큰 자산이에요.

---

*문서 끝. Day 17로 이어짐.*
