# Phase 1A — Day 26~28 완료 보고서 (묶음)

> 작성일: 2026-05-22
> 작업 범위: 다크모드 인프라 (Day 26) → 페이지네이션 첫 도입 (Day 27) → 다크 전체 분기 + 인디고 디자인 시스템 (Day 28)
> 학습자: 디자인 전공 / 코딩 26~28일째

---

## 🎯 큰 그림 — 묶음 1 이 한 일

```
[Day 13~25] 기능 누적 — 시드, 액션, 표시 (다크 모드 부재, 디자인 임시)
   ↓
[Day 26] 다크 인프라 — next-themes + Tailwind v4 @custom-variant + ThemeToggle  ← 응급 인프라
   ↓
[Day 27] 페이지네이션 — audit-log 첫 사용처 + Promise.all findMany+count  ← 끼어든 새 작업
   ↓
[Day 28] 다크 전체 분기 + 인디고 디자인 시스템 — 30 파일, 의미 토큰, AlertBox/PageTabs 추출  ← 본격 통합
   ↓
[Day 29+ 예정] 활동 이력 페이지네이션 / 메시지 도메인 / 환경설정 / 디자인 2차 수정
```

**세 Day 가 *불연속 + 연결* 의 묘한 흐름**. Day 26 다크는 *시각적 불편 발견의 즉흥 대응* — 인프라만 깔고 *컴포넌트 분기는 미적용* (라이트는 OK, 다크는 *흰 섬*). Day 27 은 *다크 미해결인 채로* 페이지네이션 (별개 도메인) 도입 — 끼어든 작업. Day 28 에서 *다크 전체 분기 + 디자인 시스템 통합* 으로 *Day 26 의 빚 청산 + 디자인 시스템 진화* 동시. 

**Day 26 의 *작업 순서 뒤집기*** — Day 25 plan 의 권장은 *페이지네이션* 이었으나 진입 직전 사용자가 *다크모드 미선택 칩 안 보임* 발견. *시각적 불편* 이 새 우선순위 트리거. Day 21/22 의 *작업 자체 뒤집기* 와 *결의 다른 뒤집기* (작업 순서).

---

## 📅 Day 26 작업 요약 — 다크 인프라

### 작업 단계 (6)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 즉흥 우선순위 조정 — 페이지네이션 보류, 다크 우선 | *시각적 불편 = 새 트리거* |
| 1 | 미선택 칩 색 옵션 비교 (`bg-zinc-100` → `bg-black/10`) | 디버깅 발산 |
| 2 | 사용자 화면이 *시스템 다크모드* 임을 스크린샷으로 확인 | 진단 전환 |
| 3 | `globals.css` 의 `@media (prefers-color-scheme: dark)` 가 원인 — Next.js 기본 템플릿 잔재 | *의도된 다크 X, 시스템 강제* |
| 4 | `next-themes@0.4.6` 도입 + Tailwind v4 `@custom-variant` 등록 + ThemeProvider 클라이언트 경계 래퍼 | *최신 패턴 확인 후 적용* |
| 5 | ThemeToggle (Sun/Moon SVG) — `mounted` 가드로 hydration mismatch 회피 | *Client 마운트 가드* |
| 6 | `chipClass` 응급 dark 분기 (활성=흰 칩/검정 글씨, 비활성=white/10 잉크 톤) | *전체 분기는 Day 28+ 로 미룸* |

---

## 📅 Day 27 작업 요약 — 페이지네이션 첫 사용처

### 작업 단계 (8)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 진입 시 `git status` 가 두 그룹 변경 노출 (Day 26 미커밋 + Day 27 코드 미리 작성됨) | *메모리 vs git 어긋남 발견* |
| 1 | 분리 커밋 결정 — Day 26 먼저 commit | *역사 분리 보존* |
| 2 | `take: 50` 제거 → `skip/take + PAGE_SIZE` 도입 | *상수화* |
| 3 | `Promise.all([findMany, count])` — 두 RTT 하나로 | *병렬화 재사용* (Day 25 정신) |
| 4 | `parsedPage = parseInt(rawPage, 10)` + `Number.isFinite + >=1` 가드 | *조용한 fallback* |
| 5 | `displayPage = min(page, totalPages)` 클램프 — stale URL/hack 대응 | *얕은 fix* (표시만 정상화) |
| 6 | 페이지네이션 nav UI (이전/숫자/다음 + range 표시) | aria-current / aria-disabled |
| 7 | `page > 1` 일 때만 `?page=N` — 1페이지 URL 깔끔 | `buildUrl` *undefined 자동 누락* 재활용 |

---

## 📅 Day 28 작업 요약 — 다크 전체 분기 + 인디고 디자인 시스템

### 작업 단계 (9)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 토큰 설계 — 5 의미 토큰 (surface/surface-muted/line/ink-muted/ink-subtle) + accent | *의미 기반 색 토큰* |
| 1 | 헤더 토큰화 → 스샷 검증 (라이트/다크 둘 다 OK) | *반복 가능 검증 패턴* |
| 2 | 그룹별 일괄 적용 — 주요/사용자/셀러/관리자/공통 (총 25 파일) | *대규모 일괄 변경* |
| 3 | 헤더 셀러/관리자 권한 링크 추가 — `getCurrentUser` 확장 | *Server Component 정보 확장* |
| 4 | PageTabs sub-nav 추출 — admin 3 + seller 3 = **6 사용처** (Day 23 ReasonForm 패턴 재현) | *3 사용처 추출 정신* |
| 5 | 버튼 디자인 진화 — 라인형 → 알파 surface → AlertBox 분리 → 의미색 폐기 → 인디고 통일 + 위계 | *디자이너 협업 흐름* |
| 6 | 대비 문제 발견 → 토큰 분리 (`--accent` vs `--accent-bg`) | *한 토큰의 두 용도 충돌 해결* |
| 7 | `font-medium` 추가 — primary 버튼 가독성 ↑ | *작은 디테일* |
| 8 | NavLink `matchPrefix` 확장 — `boolean | string`. href 와 active 범위 분리 | *유연한 시그니처* |

---

## 🐛 묶음 1 의 핵심 발견·논의

### 발견 1: ***Tailwind v4 의 `@custom-variant` 패턴*** — v3 와 완전히 다름

Tailwind v3 까지 다크 모드는 `tailwind.config.js` 의 `darkMode: 'class'` 설정으로 활성화. Tailwind v4 는 *config 파일 자체가 사라짐* — 모든 설정이 CSS 안.

```css
/* globals.css */
@import "tailwindcss";

/* Tailwind v4: dark variant 가 .dark 클래스(또는 그 자손) 를 보도록 등록.
   next-themes 가 attribute="class" 옵션으로 html 에 .dark 를 토글. */
@custom-variant dark (&:where(.dark, .dark *));
```

**왜 `&:where(.dark, .dark *)`**:
- `&` = 현재 셀렉터 자기 자신
- `:where(.dark, .dark *)` = `.dark` 자기 자신 또는 그 자손
- 결과: `.dark` 가 붙은 *루트 또는 그 안 어디든* `dark:` 변형 활성

**대안 — `@variant`** (간단형):
```css
@variant dark (&.dark);
```
*루트에만* `.dark` 가 붙으면 충분한 단순 케이스. 우리 코드는 *컴포넌트 단위* 다크 토글 가능성 보존이라 `:where` 채택.

**AGENTS.md 의 경고 적중**:
> "This is NOT the Next.js you know" — Tailwind v4 + Next 16 + React 19 조합에서 *최신 패턴 확인 후 적용*.

처음 `@custom-variant` 모르고 v3 의 `darkMode: 'class'` 시도했다면 *config 파일이 없어서* 헤맴. *문서 우선 확인* 의 가치.

**원칙**: "*Tailwind v4 = config 파일 없음, 모든 설정 CSS 안*. `@custom-variant` 가 *다크 모드 + 클래스 기반 variant* 의 단일 진입점. *과거 버전의 추론* 보다 *현재 버전의 문서* 가 항상 우선."

---

### 발견 2: ***next-themes hydration 안전 패턴*** — `mounted` 가드

`useTheme().theme` 은 *서버에서 `undefined`* (next-themes 가 *클라이언트 사이드 LocalStorage* 에서 읽음). 서버 렌더가 *어떤 테마인지 모름* → 직접 사용하면 *hydration mismatch*.

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // 마운트 전 — *같은 크기 placeholder* 만 렌더
  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />
  }

  // 마운트 후 — 진짜 토글 UI
  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
```

**왜 `useState(false) + useEffect`**:
- `useEffect` 는 *클라이언트에서만* 실행
- 서버 + 첫 클라이언트 렌더 = `mounted: false` → placeholder
- `useEffect` 실행 후 = `mounted: true` → 진짜 UI
- *두 렌더가 같음* → hydration mismatch X

**왜 *같은 크기 placeholder***:
- 비어있으면 *레이아웃 점프* (placeholder ↔ 진짜 UI 의 크기 차이)
- `h-9 w-9` = 토글 버튼과 같은 크기 → *시각적 점프 X*

**`<html suppressHydrationWarning>`** — `layout.tsx` 에 추가:
- next-themes 가 `<html>` 의 `class` 를 *클라이언트에서* 토글 → 서버/클라이언트 차이 발생
- `suppressHydrationWarning` = *이 노드 한 레벨만* 차이 무시
- *광범위 적용 X* — 정확히 *next-themes 가 손대는 곳만*

**원칙**: "*외부 상태 (LocalStorage, browser API) 에 의존하는 클라이언트 컴포넌트* 는 *마운트 가드 + placeholder* 패턴이 표준. *hydration mismatch 회피 + 레이아웃 점프 회피* 의 두 가치. `suppressHydrationWarning` 은 *한 레벨만* — 광범위 적용은 다른 mismatch 도 숨김."

---

### 발견 3: ***Server vs Client 경계의 명시 래퍼*** — ThemeProvider

`ThemeProvider` (next-themes) 는 *client component* — `'use client'` 필요. 하지만 `layout.tsx` 는 *server component* 유지하고 싶음 (페이지의 server 데이터 fetch).

해결 — *얇은 래퍼* 로 경계 명시:

```tsx
// app/components/ThemeProvider.tsx
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
```

```tsx
// app/layout.tsx — server component 유지
import ThemeProvider from "@/app/components/ThemeProvider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**래퍼 패턴의 *세 가치***:
- *client 경계 명시* — `'use client'` 가 한 파일에 격리
- *layout.tsx 의 server 유지* — 페이지의 server 데이터 fetch 가능
- *next-themes 옵션 응집* — `attribute`, `defaultTheme`, `enableSystem` 한 곳

**대조 — 래퍼 없이 layout.tsx 에 직접 `'use client'`**:
- layout 전체가 client 가 됨 → *children 의 서버 fetch 손실*
- 페이지 단위로 모두 client 화 강제 → 부담 ↑↑

**원칙**: "*client 라이브러리는 얇은 래퍼로 격리* — `'use client'` 가 *한 파일에만*. *layout 의 server 유지* 가 *server-first 아키텍처의 핵심*. 라이브러리 사용 패턴 = *경계 디자인* 의 일부."

---

### 발견 4: ***Promise.all 의 페이지네이션 적용*** — findMany + count 병렬

Day 25 의 *4 쿼리 Promise.all* 정신을 Day 27 페이지네이션에 *자연 적용*:

```ts
// app/admin/audit-log/page.tsx
const [logs, totalCount] = await Promise.all([
  prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { actor: { select: { id: true, name: true, email: true } } },
  }),
  prisma.auditLog.count({ where }),
])
```

**두 쿼리의 *독립성***:
- `findMany` — *현재 페이지 데이터* (20 row)
- `count` — *전체 갯수* (필터 동일)
- 서로 *결과 참조 X* → 병렬 안전

**`count` 의 *where 동일성* 의 의미**:
- 필터링된 *전체 갯수* 가 진실
- count 가 다른 where 쓰면 *페이지 수 거짓말* (예: 50 row 중 20 만 필터 매칭인데 페이지 표시는 50/20 = 3 페이지로 잘못)
- *같은 where 객체 재사용* = *진실 보장*

**대조 — 순차 시도** (anti-pattern):
```ts
const totalCount = await prisma.auditLog.count({ where })  // 1 RTT
const logs = await prisma.auditLog.findMany({ where, skip, take })  // 2 RTT
// 총 2 RTT
```
*같은 결과* 지만 *응답 시간 2 배*.

**Day 25 와의 *진화 비교***:
- Day 25: 4 쿼리 모두 *완전 독립* (service / aggregate / findMany / user)
- Day 27: 2 쿼리 *같은 where 공유* (findMany / count) — *변수 공유 + 호출 독립*

**원칙**: "*독립 쿼리 N 개 = 1 RTT 로 단축*. *같은 where 공유* 가 *진실의 일관성* 보장. *findMany + count* 가 페이지네이션의 *표준 듀얼 쿼리* — 두 쿼리 합쳐서 *현재 페이지 + 전체 갯수* 의 완전 답변."

---

### 발견 5: ***`displayPage` 클램프 = 얕은 fix*** — 깊은 정상화의 트레이드오프

페이지네이션의 *stale URL 함정*:
- 사용자 URL 북마크 `?page=5` 저장
- 시간 지나 데이터 삭제 → 현재는 *3 페이지만 있음*
- `?page=5` 방문 → *빈 결과* + *5 페이지 active 표시* → 사용자 혼란

**우리 채택 — 얕은 fix**:
```ts
const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
const displayPage = Math.min(page, totalPages)  // 표시만 클램프
```
- *fetch 는 이미 skip:(5-1)*PAGE_SIZE* 로 수행* → 결과 빈 배열
- *UI 는 displayPage = 3 으로 정상화* → 3 페이지 active 표시
- *빈 결과 메시지* "이 조건의 로그가 없습니다" 가 자연 표시

**대안 — 깊은 정상화** (anti-pattern? 또는 정당?):
```ts
const totalCount = await prisma.auditLog.count({ where })  // count 먼저
const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
const correctPage = Math.min(page, totalPages)
const logs = await prisma.auditLog.findMany({  // correctPage 로 다시 fetch
  where, skip: (correctPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
})
```
- *Promise.all 깨짐* — count 가 findMany 앞에 *순차*
- *완전 정상화* — 마지막 페이지 데이터 표시
- *2 RTT* — 응답 시간 ↑

**트레이드오프**:

| 방식 | 정확성 | 성능 | 코드 복잡도 |
|---|---|---|---|
| 얕은 fix (우리) | UI 정상, fetch 빈 결과 | 1 RTT | 단순 |
| 깊은 정상화 | 완전 정상 | 2 RTT | 중간 |

**학습 단계 = 얕은 fix 채택**:
- *학습 단계 = 단순성 우선*
- *진짜 stale URL = 드문 케이스* — 빈 결과 메시지로 충분
- *Promise.all 패턴 유지* — Day 25 의 학습 정신 일관

**원칙**: "*얕은 fix = UI 정상화만, fetch 그대로*. *깊은 정상화 = 정확하지만 RTT 비용*. *학습 단계 = 단순 우선*, *운영 단계 = 정확성 가치 ↑ 일 때 깊은 정상화*. *드문 케이스* 의 처리 비용 vs 단순성의 트레이드오프."

---

### 발견 6: ***변수명에 처리 단계 명시*** — `parsedPage → page → displayPage`

페이지 값의 *3 단 정제 흐름*:

```ts
const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1
const displayPage = Math.min(page, totalPages)
```

**각 변수의 *책임***:
- `parsedPage` — *문자열 → 숫자* 변환 (NaN 가능성 있음)
- `page` — *검증된 자연수* (1 이상 보장)
- `displayPage` — *클램프된 표시값* (totalPages 이하 보장)

**왜 *변수명에 처리 단계***:
- *각 단계의 의도가 코드에서 자기 설명*
- *주석 줄임* — 변수명이 주석 역할
- *디버깅 ↑* — 어느 단계에서 잘못됐는지 명확

**대조 — 한 줄 압축**:
```ts
const displayPage = Math.min(
  Math.max(1, Number.isFinite(parseInt(rawPage ?? "1", 10)) ? parseInt(rawPage ?? "1", 10) : 1),
  totalPages
)
```
- *한 줄에 모든 처리* — *어느 단계가 무슨 책임인지* 불명확
- *디버깅 어려움* — 중간 값 보기 어려움
- *parseInt 중복 호출* (또는 변수 도입 필요)

**학습 코드의 *단계 명시* 가치**:
- *각 단계가 학습 대상* — 사용자가 *어디서 무엇이 일어나는지* 파악
- *원리 학습 + 코드 가독성* 둘 다 ↑

**Day 14 의 *`validatedStatus`* 패턴 회상** — *검증된 값* 을 *명시 변수* 로 분리.

**원칙**: "*변수명에 처리 단계 명시* = *주석 줄이고 코드 자기 설명*. *각 단계 = 독립 변수* + *명확한 책임명*. *학습 코드 = 단계 명시 가치 ↑*, *프로덕션 코드 = 압축 가능* 의 균형."

---

### 발견 7: ***Tailwind v4 의 `@theme inline` 패턴*** — CSS 변수 → 자동 클래스 생성

Day 28 의 *의미 토큰* 시스템 핵심:

```css
:root {
  --surface: #ffffff;
  --surface-muted: #fafafa;
  --line: #e4e4e7;
  --ink-muted: #3f3f46;
  --ink-subtle: #71717a;
  --accent: #4338ca;
  --accent-bg: #4338ca;
}

.dark {
  --surface: #18181b;
  --surface-muted: #27272a;
  --line: #27272a;
  --ink-muted: #d4d4d8;
  --ink-subtle: #a1a1aa;
  --accent: #818cf8;
  --accent-bg: #818cf8;
}

@theme inline {
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-line: var(--line);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-accent: var(--accent);
  --color-accent-bg: var(--accent-bg);
}
```

**Tailwind v4 의 마법**:
- `@theme` 안에서 `--color-X` 정의 → `bg-X`, `text-X`, `border-X` 클래스 *자동 생성*
- `:root` / `.dark` 에서 같은 변수 *다른 값으로 재정의* → 라이트/다크 자동 전환
- 컴포넌트는 *의미 클래스만* (`bg-surface`, `text-ink-muted`) — 라이트/다크 분기 *직접 안 함*

**`inline` 의 의미**:
- `@theme inline` = *주변 CSS 변수 즉시 참조* (var() 해석)
- `@theme` (inline 없음) = *변수 자체를 토큰* 으로 (정적 값)
- 우리 케이스 = `:root`/`.dark` 의 *재정의 가능 변수* 참조 → `inline` 필수

**예시 — 컴포넌트 코드의 변화**:

```tsx
// Before (Day 27 까지)
<div className="border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">

// After (Day 28)
<div className="border border-line bg-surface text-ink-muted">
```

*다크 분기 사라짐* — 의미 클래스 한 번만 쓰면 *globals.css 의 토큰 재정의* 가 알아서 처리.

**의미 토큰의 *5 가지 + 2 (accent)***:

| 토큰 | 용도 | 라이트 | 다크 |
|---|---|---|---|
| `surface` | 카드/패널 배경 | white | zinc-900 |
| `surface-muted` | 입력 필드, 테이블 헤더 | zinc-50 | zinc-800 |
| `line` | 보더 (테두리) | zinc-200 | zinc-800 |
| `ink-muted` | 보조 텍스트 | zinc-700 | zinc-300 |
| `ink-subtle` | 옅은 텍스트 | zinc-500 | zinc-400 |
| `accent` | 글씨/보더용 (인디고) | indigo-700 | indigo-400 |
| `accent-bg` | primary 버튼 배경 | indigo-700 | indigo-400 |

**원칙**: "*의미 토큰 시스템* = *컴포넌트 코드에서 다크 분기 제거*. *globals.css 의 변수 재정의* 가 *분기 책임 흡수*. *@theme inline* 이 *Tailwind v4 의 클래스 자동 생성* 다리. *디자인 시스템 = 의미 클래스 + 토큰 재정의* 의 분업."

---

### 발견 8: ***토큰 이름 충돌 회피*** — `--color-line` (border 가 아닌 line)

자연스러운 이름은 `--color-border` 일 텐데, 안 함. 이유:

```css
/* 만약 --color-border 라면 — */
border-border    /* 이상한 이름! border 가 두 번 (Tailwind 클래스 + 토큰 이름) */
```

Tailwind 의 `border` 자체가 *보더 두께* 클래스 (`border` = `border-width: 1px`). `border-border` = *너비 클래스* 와 *색 클래스* 가 어색하게 충돌.

**해결 — `--color-line`**:
```css
border-line      /* line = 색 클래스로 자연 */
```

**Day 28 의 *토큰 이름 결정 패턴***:
- *클래스 사용처를 기준* — `border-X` 의 X 는 *color 의미* 단어
- *의미 vs 형태* — 형태 (border) 보다 의미 (line) 우선
- *충돌 회피* — Tailwind 의 다른 utility 와 어색하지 않게

**다른 토큰 이름 결정 회상**:
- `ink-muted` / `ink-subtle` — *typography ink* 의미. `text-ink-muted` 자연.
- `surface` / `surface-muted` — *layer 깊이* 의미. `bg-surface` 자연.
- `accent` / `accent-bg` — *포인트 색* + *배경 한정 변형*. (발견 9 참조)

**원칙**: "*토큰 이름 = 클래스 사용처 기준*. *형태 (border, bg) 가 아닌 의미 (line, surface) 단어*. *Tailwind utility 와 충돌 회피* 가 *디자인 시스템 사용성*. *이름 결정 = 디자인 결정의 일부*."

---

### 발견 9: ***토큰 분리 패턴*** — `--accent` vs `--accent-bg`

처음에 `--accent` 한 토큰으로 *글씨 + 배경* 모두 처리하려 함:

```css
:root { --accent: #4f46e5; }  /* indigo-600 */
```

```tsx
<button className="bg-accent text-white">primary</button>     /* 흰 글씨 */
<a className="text-accent">link</a>                            /* 글씨 */
```

**대비 문제 발견**:
- `indigo-600 bg + white text` = AA Normal 통과
- *다크 모드* 에선 indigo-600 이 *너무 진해* → 변경 필요
- `indigo-400` 으로 다크 변경 시 *흰 글씨 대비 부족* (AA 부족)
- *검정 글씨* 로 변경 시 라이트 모드 indigo-600 + 검정 = AA 부족

**한 토큰의 두 용도 충돌**:
- *글씨/보더용 accent* — 진한 색 OK (배경이 surface)
- *배경용 accent* — 글씨와 대비 보장해야 함

**해결 — 토큰 분리**:

```css
:root {
  --accent: #4338ca;     /* indigo-700 — 글씨/보더 (link, NavLink active) */
  --accent-bg: #4338ca;  /* indigo-700 — primary 배경 (라이트는 흰 글씨 AAA) */
}
.dark {
  --accent: #818cf8;      /* indigo-400 — 글씨/보더 */
  --accent-bg: #818cf8;   /* indigo-400 — primary 배경 (다크는 검정 글씨 6.5:1) */
}
```

```tsx
<button className="bg-accent-bg text-white dark:text-zinc-900 font-medium">primary</button>
<a className="text-accent">link</a>
```

**WCAG 대비 자기 정정 일화**:
- 처음 계산: `indigo-500 (#6366f1) + 검정 글씨 = 6:1` 으로 *오판*
- 실제 측정: `3.94:1` *AA 부족*
- *indigo-400 (#818cf8) + 검정 = 6.5:1* AA 통과 확인
- *수치 자체 확인 후 결정* — 학습 단계의 *근거 기반 결정* 정신

**디자이너 협업의 *반복 검증* 흐름**:
- 첫 시도 (한 토큰) → 사용자 화면 확인
- 대비 문제 발견 → 토큰 분리 + 다크 톤 조정
- 자기 정정 → 다시 검증
- *3~4 회 반복 후 안정*

**원칙**: "*한 토큰의 두 용도 충돌* = *디자인 시스템의 흔한 함정*. *글씨용 vs 배경용* 분리가 *대비 문제 해결의 표준*. *WCAG 대비 = 추론 X, 측정* — 자기 정정 능력이 *학습 누적의 효과*. *디자이너 협업 = 반복 검증 + 자기 정정*."

---

### 발견 10: ***인디고 통일 + 위계 시스템*** — 의미색 폐기

Day 28 이전의 *버튼 색 시스템*:
- primary = emerald 600 (긍정)
- danger = rose 600 (부정)
- warning = amber 600 (주의)
- secondary = zinc border

Day 28 결정 — *모든 액션 = 인디고*, *위계는 형태로 구분*:

```tsx
/* Primary — surface 채움 */
<button className="bg-accent-bg text-white dark:text-zinc-900 font-medium hover:opacity-90">
  확정
</button>

/* Secondary — accent 라인 */
<button className="border border-accent text-accent hover:bg-accent/10">
  수정
</button>

/* Tertiary — 모노톤 라인 */
<button className="border border-line text-ink-muted hover:bg-surface-muted">
  취소
</button>
```

**왜 인디고 통일**:
- *의미색 (emerald/rose/amber) = 액션의 의도* 가 *버튼 색에 너무 강함*
- *디자이너 협업 결과* — *브랜드 일관성* 우선 (모든 액션이 *같은 색 톤*)
- *위계 표현은 형태로* (채움 vs 라인, 굵기 vs 옅음)

**의미색은 어디로** — *결과 표시* + *알림 박스* 에만:

```tsx
/* 결과 표시 (배지) — 의미색 유지 */
<span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
  확정됨
</span>

/* 알림 박스 (AlertBox) — 의미색 유지 */
<AlertBox variant="danger">거절 사유: ...</AlertBox>
```

**버튼 색 시스템의 *진화 흐름***:
1. *의미색 버튼* (Day 21~24) — 액션의 의도 색으로 표현
2. *라인형 버튼* 시도 (Day 28 초반) — 너무 옅음
3. *알파 surface* 시도 — 보더 없이 클릭 영역 명확하지만 *위계 표현 부족*
4. *AlertBox 분리* (의미색을 알림으로) — 버튼은 인디고 후보로
5. *인디고 통일 + 형태 위계* — 최종 채택

**원칙**: "*디자인 시스템 통일 = 의미 분리* — 색은 *상태/결과* 표현, *위계는 형태* (채움/라인, 굵기/옅음). *모든 액션을 같은 톤* = *브랜드 일관성*. *의미색 = 알림/배지 한정* 으로 *역할 명확*."

---

### 발견 11: ***AlertBox 추출 = Day 23 패턴 재현*** — 9 사용처 도달

Day 23 의 *ReasonForm 추출* 패턴을 Day 28 에 *9 사용처* 로 확장 적용:

```tsx
// app/components/AlertBox.tsx
type Variant = "danger" | "warning" | "success"

export default function AlertBox({
  variant,
  children,
}: {
  variant: Variant
  children: React.ReactNode
}) {
  const styles = {
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  }[variant]

  const Icon = { danger: AlertIcon, warning: WarningIcon, success: CheckIcon }[variant]

  return (
    <div className={`flex gap-2 rounded-md p-3 text-sm ${styles}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
```

**9 사용처** — 거절 사유, 취소 사유, 후기 표시, 받은 후기, audit-log 의 reason, seller pending 안내 등.

**Day 19 의 *세 사용처 추출* 정신 확장**:
- 3 사용처 = *최소 추출 임계*
- 9 사용처 = *반드시 추출* + *디자인 시스템 일부*

**의미색 박스의 *다크 분기 패턴***:
- 라이트: `bg-X-50 text-X-700` (옅은 배경 + 진한 글씨)
- 다크: `bg-X-900/30 text-X-300` (*진한 색 + 알파* + *옅은 글씨*)
- *인버스* — 라이트의 명도 관계를 다크에서 *반전*

**왜 *진한 색 + 알파* (다크 배경)**:
- 다크 모드의 *깊은 배경* (zinc-900) 위에 *진한 색 100%* = *너무 강함*
- *알파 30%* = *옅은 색조* 효과 + *깊이 통일*

**원칙**: "*의미색 박스 = AlertBox 추출 표준*. *라이트 = 옅은 배경 + 진한 글씨*, *다크 = 진한 알파 + 옅은 글씨* 의 인버스 패턴. *9 사용처 = 디자인 시스템 일부* — 단순 컴포넌트가 아닌 *언어*."

---

### 발견 12: ***PageTabs 추출*** — 6 사용처 + 상수 분리

admin / seller 영역의 *sub-nav* 가 중복:

```tsx
// /admin/* 페이지마다 중복
<nav className="mb-6 flex gap-2">
  <Link href="/admin/services" className="...">서비스</Link>
  <Link href="/admin/sellers" className="...">셀러</Link>
  <Link href="/admin/audit-log" className="...">감사 로그</Link>
</nav>
```

**추출 — PageTabs + 상수 분리**:

```tsx
// app/components/PageTabs.tsx
export default function PageTabs({
  items,
}: {
  items: ReadonlyArray<{ href: string; label: string }>
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <NavLink key={item.href} href={item.href} matchPrefix>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
```

```ts
// app/lib/page-tabs.ts — 상수 분리
export const ADMIN_TABS = [
  { href: "/admin/services", label: "서비스" },
  { href: "/admin/sellers", label: "셀러" },
  { href: "/admin/audit-log", label: "감사 로그" },
] as const

export const SELLER_TABS = [
  { href: "/seller/services", label: "내 서비스" },
  { href: "/seller/bookings", label: "받은 예약" },
  { href: "/seller/activity-log", label: "활동 이력" },
] as const
```

```tsx
// 사용처 (6 곳)
<PageTabs items={ADMIN_TABS} />
<PageTabs items={SELLER_TABS} />
```

**상수 분리의 *세 가치***:
- *추가/수정 단일 출처* — admin tab 추가 시 한 곳만 수정
- *타입 안전* — `as const` 로 *literal type* 유지
- *컴포넌트 props 단순* — items 만 받음

**Day 23 의 *얕은 추출 두 방식* 정신 일관**:
- ReasonForm = *컴포넌트 통합* (Day 23)
- AlertBox = *컴포넌트 통합* (Day 28)
- PageTabs + page-tabs.ts = *컴포넌트 + 상수 분리* (Day 28, 새 패턴)

**원칙**: "*sub-nav = 추출 + 상수 분리 동시*. *컴포넌트는 props 만*, *상수는 별도 파일* — *추가/수정 단일 출처* 보장. *as const = literal type 유지* 로 *타입 안전 + 자동 완성*. *추출의 두 차원* — 구조 (컴포넌트) + 데이터 (상수)."

---

### 발견 13: ***NavLink `matchPrefix` 확장*** — `boolean | string`

기존 NavLink:
```tsx
<NavLink href="/admin/services" matchPrefix>서비스</NavLink>
// matchPrefix = true → /admin/services* 전체에서 active
```

Day 28 발견 — *href 와 active 범위 다름*:
- *셀러 메뉴 active 조건* = */seller/* 전체*
- *href* = `/seller/services` (대표 페이지)

확장 — `matchPrefix: boolean | string`:

```tsx
type Props = {
  href: string
  matchPrefix?: boolean | string  // ← string 추가
  children: React.ReactNode
}

export default function NavLink({ href, matchPrefix, children }: Props) {
  const pathname = usePathname()
  const isActive = matchPrefix === true
    ? pathname.startsWith(href)
    : typeof matchPrefix === "string"
      ? pathname.startsWith(matchPrefix)  // ← 명시 prefix 사용
      : pathname === href
  // ...
}
```

```tsx
// 사용 — 헤더의 셀러 메뉴
<NavLink href="/seller/services" matchPrefix="/seller">
  셀러
</NavLink>
// active 조건 = /seller/* 전체 → /seller/bookings 같은 다른 페이지에서도 active
```

**Boolean | string 의 *유연성***:
- `matchPrefix={true}` — href 자체 prefix (기존)
- `matchPrefix="/seller"` — 명시 prefix (확장)
- `matchPrefix={undefined}` — 정확 매칭 (기본)

**대안 — 두 prop 분리** (anti-pattern?):
```tsx
<NavLink href="..." matchPrefix activePrefix="/seller">  // 두 prop
```
- *prop 갯수 ↑* + *어색* (둘 다 prefix 의미)

**Boolean | string 의 *type narrowing*** — TypeScript 자연 지원:
```ts
if (matchPrefix === true) { ... }
else if (typeof matchPrefix === "string") { matchPrefix /* string narrowed */ }
else { /* undefined or false */ }
```

**원칙**: "*Boolean | string 의 단일 prop* = *간단한 동작* (boolean) + *세밀 제어* (string) 의 두 시나리오 흡수. *prop 갯수 ↑ 회피* 의 패턴. TypeScript narrowing 이 *런타임 안전성* 보장. *진화하는 컴포넌트 API 의 자연 패턴*."

---

## 🎓 새로 배운 개념 (Day 26~28)

### Tailwind v4 `@custom-variant`
- v3 와 완전히 다른 다크 모드 활성화
- *config 파일 없음, 모든 설정 CSS 안*

### next-themes hydration 안전
- `mounted` 가드 + placeholder 패턴
- `<html suppressHydrationWarning>` 한 레벨만

### Server vs Client 경계 래퍼
- ThemeProvider 얇은 래퍼로 `'use client'` 격리
- layout.tsx 의 server 유지

### Promise.all 페이지네이션
- findMany + count 병렬 = 1 RTT
- *같은 where 공유* = 진실 일관성

### 얕은 fix vs 깊은 정상화
- displayPage 클램프 (얕은) vs count 먼저 (깊은)
- 학습 단계 = 얕은 fix

### 변수명에 처리 단계
- `parsedPage → page → displayPage` 의 3 단
- *주석 줄이고 자기 설명*

### Tailwind v4 `@theme inline`
- CSS 변수 → 자동 클래스 생성
- 컴포넌트에서 다크 분기 제거

### 토큰 이름 회피
- `--color-line` (border 가 아님) — *Tailwind utility 와 충돌 회피*
- *형태 (border) 가 아닌 의미 (line)*

### 토큰 분리 (`--accent` vs `--accent-bg`)
- 한 토큰의 두 용도 충돌 해결
- WCAG 대비 측정 + 자기 정정

### 인디고 통일 + 형태 위계
- 의미색 폐기 → primary/secondary/tertiary 형태로 구분
- *의미색 = AlertBox/배지에만*

### AlertBox 추출 (9 사용처)
- Day 23 ReasonForm 패턴 확장
- *진한 색 + 알파* (다크) 인버스 패턴

### PageTabs + 상수 분리
- 컴포넌트 + lib/page-tabs.ts 두 차원 추출
- `as const` literal type

### NavLink `matchPrefix: boolean | string`
- 한 prop 의 두 시나리오 흡수
- *prop 갯수 ↑ 회피*

---

## 📋 작성된 코드 핵심

```css
/* app/globals.css — Day 26 인프라 + Day 28 토큰 시스템 */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #171717;
  --surface: #ffffff;
  --surface-muted: #fafafa;
  --line: #e4e4e7;
  --ink-muted: #3f3f46;
  --ink-subtle: #71717a;
  --accent: #4338ca;
  --accent-bg: #4338ca;
}

.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
  --surface: #18181b;
  --surface-muted: #27272a;
  --line: #27272a;
  --ink-muted: #d4d4d8;
  --ink-subtle: #a1a1aa;
  --accent: #818cf8;
  --accent-bg: #818cf8;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-line: var(--line);
  --color-ink-muted: var(--ink-muted);
  --color-ink-subtle: var(--ink-subtle);
  --color-accent: var(--accent);
  --color-accent-bg: var(--accent-bg);
}
```

```tsx
// app/components/ThemeProvider.tsx — 얇은 client 래퍼
"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  )
}
```

```ts
// app/admin/audit-log/page.tsx — Day 27 페이지네이션 핵심
const PAGE_SIZE = 20

const parsedPage = rawPage ? parseInt(rawPage, 10) : 1
const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1

const [logs, totalCount] = await Promise.all([
  prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { actor: { select: { id: true, name: true, email: true } } },
  }),
  prisma.auditLog.count({ where }),
])

const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
const displayPage = Math.min(page, totalPages)
```

```tsx
// 페이지네이션 nav UI — page > 1 일 때만 ?page=N
{totalPages > 1 && (
  <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
    <span className="text-ink-muted">
      {(displayPage - 1) * PAGE_SIZE + 1}–{Math.min(displayPage * PAGE_SIZE, totalCount)} / {totalCount}건
    </span>
    {/* 이전 / 숫자들 / 다음 — aria-current="page" / aria-disabled */}
  </nav>
)}
```

```tsx
// app/components/AlertBox.tsx — Day 28 추출 (9 사용처)
export default function AlertBox({ variant, children }: Props) {
  const styles = {
    danger: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  }[variant]

  return (
    <div className={`flex gap-2 rounded-md p-3 text-sm ${styles}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
```

```ts
// app/lib/page-tabs.ts — Day 28 상수 분리
export const ADMIN_TABS = [
  { href: "/admin/services", label: "서비스" },
  { href: "/admin/sellers", label: "셀러" },
  { href: "/admin/audit-log", label: "감사 로그" },
] as const

export const SELLER_TABS = [
  { href: "/seller/services", label: "내 서비스" },
  { href: "/seller/bookings", label: "받은 예약" },
  { href: "/seller/activity-log", label: "활동 이력" },
] as const
```

---

## 📁 변경된 파일

### Day 26 (6 파일 — 1 의존성 추가)
```
stylefit/
├── app/
│   ├── components/
│   │   ├── ThemeProvider.tsx    [신규] next-themes 래퍼
│   │   └── ThemeToggle.tsx      [신규] Sun/Moon hydration safe
│   ├── layout.tsx               Provider wrap + suppressHydrationWarning
│   ├── globals.css              prefers-color-scheme 제거 + @custom-variant + .dark
│   ├── components/Header.tsx    ThemeToggle 삽입
│   └── lib/url-filter.ts        chipClass dark 분기 (응급)
```
*의존성*: `next-themes@0.4.6`

### Day 27 (1 파일)
```
stylefit/
└── app/admin/audit-log/page.tsx   take:50 → skip/take + Promise.all + displayPage
```

### Day 28 (30 파일 — 신규 3 + 수정 27)
```
신규:
├── app/components/AlertBox.tsx       의미색 알림 박스 (9 사용처)
├── app/components/PageTabs.tsx       sub-nav (6 사용처)
└── app/lib/page-tabs.ts              ADMIN_TABS / SELLER_TABS 상수

수정 (27): Header, NavLink, ReasonForm, ReviewForm, ServiceCard, ThemeToggle,
globals.css, dal.ts, LoginForm, SignupForm, BookingForm, CreateServiceForm,
EditServiceForm, /bookings, /services 외 페이지, /admin/*, /seller/*, not-found.
```

*묶음 1 총 37 파일 변경* (신규 5 + 수정 32 + 의존성 1).

---

## 🚀 Day 29+ 미리보기

다음 방향 후보:

**기능 후보**:
- *MessageThread 활성화* (시간 협상) — 새 도메인 첫 진입, 큰 학습
- *페이지네이션 2번째 사용처* (`/services` 또는 `activity-log`)
- *완료 처리 시점 검증* — preferredDatetime 지난 booking 만 완료 가능?

**정리 후보**:
- *환경 설정 영구 해결* — LAN IP HMR 함정
- *디자인 디테일 2차 수정* — 사용자 명시: *기능 모두 후*

**Day 29 권장 — 활동 이력 페이지네이션 (2번째 사용처)**:
- *호흡 조절* — Day 28 30 파일 디자인 큰 작업 후 *가벼운 Day*
- 페이지네이션 = Day 18 audit-log + Day 20 activity-log + Day 25 후기 = **3 사용처 도달 ✓** 이미. *얕은 헬퍼 추출* 시점 가능.
- 단 Day 23 ReasonForm 정신 — *진짜 3 사용처 도달 후 비교 가능 상태에서* 추출. 2번째 사용처 추가 = *비교 가능 상태 만들기*.

단 Day 21-28 의 *계획 재검토 정신* 따라 Day 29 진입 시 다시 따짐.

---

## 💡 Day 13~28 회고 — *디자인 시스템의 진화 호 그래프*

| Day | 디자인 단계 |
|---|---|
| 13~17 | Tailwind utility 직접 사용, *임시* |
| 18~22 | 의미색 사용 시작 (Day 21/22 액션 색 시스템) |
| 23 | ReasonForm 첫 추출 (*컴포넌트 통합* 패턴) |
| 24~25 | 후기 박스 (emerald 결과 표시) |
| **26** | **다크 인프라** (next-themes + @custom-variant) |
| 27 | 페이지네이션 (별개 도메인) |
| **28** | **다크 전체 분기 + 인디고 디자인 시스템** (의미 토큰 + 추출 + 위계 시스템) |

**16 Day 의 *디자인 호 그래프***:
- Tailwind utility 단계 (Day 13~22)
- 의미색 시스템 (Day 21~24)
- 첫 추출 (Day 23)
- 다크 인프라 (Day 26)
- *시스템 통합* (Day 28)

**Day 28 의 *총체 통합***:
- *의미 토큰* (다크 분기 흡수)
- *인디고 통일* (브랜드 일관성)
- *AlertBox / PageTabs 추출* (재사용 컴포넌트)
- *NavLink 진화* (Boolean | string)
- *위계 시스템* (primary/secondary/tertiary)

**디자이너의 *Tailwind utility → 디자인 시스템* 학습 흐름**:
- 초기 = *utility 자유* (학습 부담 ↓, 일관성 ↓)
- 중기 = *의미색 + 패턴 인식*
- 후기 = *토큰화 + 시스템 통합*
- *자연 진화 단계* — 강제 시스템 아닌 *학습 누적의 결실*

---

## ✅ 한 줄 요약

> **"*다크 모드 + 디자인 시스템의 통합 진화* — Day 26 다크 인프라 (next-themes + Tailwind v4 `@custom-variant` + ThemeProvider 래퍼 + ThemeToggle hydration safe) + Day 27 페이지네이션 첫 사용처 (Promise.all findMany+count + displayPage 클램프 + 변수명 처리 단계) + Day 28 전체 다크 분기 + 인디고 디자인 시스템 (의미 토큰 `surface/line/ink-*/accent` + `@theme inline` + 토큰 분리 `--accent` vs `--accent-bg` + AlertBox 9 사용처 + PageTabs 6 사용처 + NavLink `boolean | string` + 인디고 통일 + 형태 위계). 30 파일 변경. 디자인 시스템의 *시스템 통합 단계 도달*."**

---

## 🧠 한 가지 회고 — *작업 순서 뒤집기 vs 작업 자체 뒤집기*

Day 21/22 의 *계획 재검토 = 뒤집기* 와 Day 26 의 *뒤집기* 가 *결의 다른 결*:

**Day 21/22 = 작업 자체 뒤집기**:
- plan 의 *권장 작업* 자체를 *다른 작업* 으로 교체
- 근거: *시드 < 50 체감 X*, *추출 사용처 카운트 부정확*
- *근거 점검 → 작업 교체*

**Day 26 = 작업 순서 뒤집기**:
- plan 의 *Day 26 = 페이지네이션* 권장 → 진입 직전 *시각적 불편 발견*
- 근거: *사용자 화면 다크 칩 안 보임* (실제 시각 증거)
- *우선순위 트리거 = 사용자 시각 불편*
- 결과: *페이지네이션 = Day 27 로 1 Day 미룸* (작업은 보존)

**두 뒤집기의 공통 정신**:
- *plan = 영구 X, 가설* 의 인식
- *진입 시 진짜 상황* 우선
- *변경 자체가 가치 아님, 근거 점검의 결과*

**작업 순서 뒤집기의 *세 장점***:
- 작업 보존 — *나중에 진행 가능*
- 즉시 대응 — *진짜 불편 우선*
- *작은 변경* (vs 작업 교체)

**디자이너의 *시안 → 검토 → 조정* 흐름과 같은 결**:
- 시안 = plan
- 검토 = 진입 시 상황 확인
- 조정 = 우선순위 변경 or 작업 교체

**Day 27 의 *분리 커밋* 결정 회상**:
- Day 26 다크 미커밋 + Day 27 페이지네이션 코드 미리 작성 = 두 작업 섞임
- 결정: Day 26 → 별도 commit → Day 27 코드 검토 → commit
- *역사 분리 보존* = *학습 추적 가능성*
- *git 의 시간 단위* = *작업의 시간 단위* 일치

**AI 와 학습자의 *공통 적응*** — *plan 의 유연성*:
- 강제 plan 따르기 = 효율 ↑, *적응성 ↓*
- 진입 시 재검토 = 효율 ↓, *적응성 ↑*
- *학습 단계 = 적응성 우선*
- 누적 후 = *plan + 적응 균형* 자연

코딩 학습의 *진짜 완성* = *plan + 진입 시 재검토 + 적응적 결정* 의 *세 단계 사고*. Day 26~28 묶음이 *작업 자체 + 작업 순서 + 통합 흐름* 세 차원의 *적응적 학습* 의 첫 큰 단위. 다음 묶음 (Day 29~31 페이지네이션 추출 + 메시지 도메인) 으로 이어짐.

---

*문서 끝. Day 29 로 이어짐.*
