# Phase 1A — Day 9 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: 첫 화면 — 서비스 목록 페이지 (Server Component + Tailwind 카드)
> 학습자: 디자인 전공 / 코딩 9일째

---

## 🎯 큰 그림 — Day 9가 한 일

```
[Day 1~8] 백엔드 골격 — DB 7개 테이블, 읽기·쓰기 API, JWT 인증
   ↓
[Day 9] 첫 화면 — /services 서비스 목록 (Server Component, 세 섹션)  ← 지금
   ↓
[지금] PowerShell이 아니라 *브라우저*로 데이터가 보임. 진짜 사이트 시작
```

Day 8까지: 모든 검증이 *PowerShell의 Invoke-RestMethod*. 데이터는 있지만 *눈에 안 보임*.
Day 9: 시드 데이터가 *카드*로 렌더링. *진짜 마켓플레이스의 첫 인상*.

---

## 🔀 Day 9 큰 결정 — *Server Component + prisma 직접 호출*

원래 직관: `/services` 페이지에서 *`fetch('/api/services')`* 호출하면 되겠지.

`node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md` 읽고 발견:
> "Since Server Components are rendered on the server, credentials and query logic will not be included in the client bundle so you can safely make database queries using an ORM or database client."

→ **Server Component에서 *prisma 직접 호출*이 표준**.

### 왜
- *HTTP 왕복 제거*: 같은 서버 안에서 같은 데이터를 굳이 HTTP로 거치는 건 낭비.
- *credentials·쿼리 로직이 클라이언트 번들에 안 포함됨*: 보안.
- 더 단순한 코드.

### 그럼 Day 5의 `/api/services` route.ts는?
*외부 클라이언트*(모바일 앱, 다른 도메인, Client Component의 SWR 등)가 씀. 화면 렌더링은 *직접 DB*. 두 진입점이 *목적별로 공존*.

---

## 📅 Day 9 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | `app/services/page.tsx` 골격 — async Server Component | 첫 prisma 직접 호출 |
| 1.6 | 카드 디자인 — 명시적 색 + 위계 | 다크 OS에서도 흰 카드로 떠 보임 |
| 2 | `app/components/ServiceCard.tsx` 분리 | DRY, 타입 export로 재사용 |
| 3 | 세 섹션 (핫·추천·전체) + `Promise.all` | 병렬 데이터 페치 |
| 3.5 | `app/lib/format.ts` — `formatDuration` | 2880분 → "2일" 자연스럽게 |
| - | `app/page.tsx` 홈 정리 | 오타 수정 + `/services` 링크 |

---

## 🐛 Day 9 핵심 발견·논의

### 발견 1: *검정 배경*은 누구의 의도도 아니었음

화면 처음 봤을 때 *검정 배경 + 어두운 회색 글자*로 *글자가 안 보임*. 디자이너 직감: "왜 #000000을 썼지?"

`globals.css:15-20`에 *create-next-app 기본 템플릿*이 깔아둔 게 있었음:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

즉 *OS 다크 모드 자동 응답*. 내 코드의 `text-gray-500/600`이 다크 배경 위에서 *어두운 회색 = 사라짐*.

### 디자이너 의견 → 카드만 *명시적 색*

globals.css 자체는 보류 (큰 변경 회피). 대신 카드를 *명시적 `bg-white text-zinc-900`*으로 → 다크 OS여도 *카드는 흰색으로 떠 보임*. 페이지 배경은 시스템 따라가지만 카드는 *고정 라이트*. *훑기에 유리한 트레이드오프*.

### 발견 2: `durationMinutes` 단위 통일 — 디자인 원칙

화면에 *"2880분", "4320분"* 표시. 시드 데이터는 *의도된 값*(2880분 = 2일 작업), UI 표시만 *분 단위 강제*가 문제.

**디자인 원칙**: "비교 화면에서는 단위를 통일한다." 60분/1440분/14400분이 *같은 단위*로 카드에 표시되면 *훑기 깨짐*. `formatDuration` 헬퍼로 자동 변환:
- < 60: "X분"
- 60 ~ 1439: "X시간" 또는 "X시간 Y분"
- ≥ 1440: "X일" 또는 "X일 Y시간"

60분 → "1시간" 결정: *일관성 > 마케팅 직관*. 마케팅적 "60분 세션"은 *상세 페이지의 문장*에서 살리기.

### 발견 3: *큐레이션*은 어떻게 DB에 표현되나

질문: *"추천/Best/Hot 같은 영역을 보이려면 DB에 있어야 필터링되는 거야?"*

답: 4가지 패턴.
1. **boolean 플래그** (`isFeatured`) — 단순. 카테고리 늘 때마다 스키마 변경.
2. **큐레이션 테이블 (다대다)** — `collection` + `collection_service`. 운영 유연성 ↑.
3. **계산된 값** — Best = *평점 4.8 + 후기 50개 이상*, Hot = *최근 7일 예약 N건*. 자동.
4. **하이브리드** — 수동 큐레이션 + 자동 계산. 실무 표준.

Phase 1A 진입로: **Day 9는 디자인 구조만, 데이터는 Day 10~**. 세 섹션 *공간*만 잡고 임시로 *정렬만 다르게*. Day 10에 패턴 2 도입.

### 발견 4: `Promise.all`로 *병렬 페치*

세 섹션 데이터를 *순차 await 3번*이면 (t1 + t2 + t3) 시간. *각 쿼리가 끝나야 다음 시작*.

`Promise.all([...])`이면 max(t1, t2, t3) 시간. *동시에 보내고 다 끝나면 묶음*. 세 쿼리가 *서로 독립*이라 가능.

**원칙**: "병렬 가능한 건 병렬로."

### 발견 5: 컴포넌트 분리 기준 — *재사용성*

ServiceCard는 *세 섹션이 같이 씀* → `app/components/`로 분리.
Section은 *services 페이지 안에서만* 씀 → 같은 파일 안 inline 정의.

**원칙**: "다른 페이지에서도 쓰게 되면 그때 분리." 미리 분리하면 *premature abstraction*.

---

## 🎓 새로 배운 개념 (Day 9)

### Server Component
- `export default async function Page()` — 컴포넌트가 *async*
- 서버에서 *렌더링 전*에 데이터 다 가져옴
- *DB·credentials*가 클라이언트 번들에 안 들어감
- `fetch`도 가능, ORM(prisma)도 가능

### Prisma relation `include`
- `sellerProfile: { include: { user: { select: { name: true } } } }` — 두 단계 relation
- `select` 화이트리스트로 *필요한 필드만* (passwordHash 등 차단)

### TypeScript props 타입 + export
- props 타입을 *별도 export* → 다른 컴포넌트가 재사용
- `import ServiceCard, { type ServiceCardData } from "..."`

### Tailwind 핵심 패턴
- `mx-auto max-w-6xl px-4` — 가운데 정렬 + 최대 폭 + 좌우 여백
- `grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3` — 반응형 그리드
- `text-zinc-*` — 중성 회색 팔레트
- `transition hover:border-zinc-300 hover:shadow-sm` — 인터랙션
- `bg-white` 명시 — *시스템 다크 모드 무시*하고 카드 흰색 고정

### Next.js `<Link>`
- *내부 페이지 이동*은 `<a>` 대신 `<Link>` — 클라이언트 사이드 라우팅 + prefetch
- 외부 링크는 `<a target="_blank">` 그대로

### `Promise.all` 패턴
- 독립 쿼리 여러 개 → 병렬 페치
- 한 쿼리 실패하면 전체 실패 (필요 시 `Promise.allSettled`)

---

## 📋 작성된 코드 핵심 (Day 9)

```tsx
// app/services/page.tsx (핵심)
const [hot, featured, all] = await Promise.all([
  prisma.service.findMany({ where: { isActive: true }, include: SECTION_INCLUDE, orderBy: { createdAt: "desc" }, take: 3 }),
  prisma.service.findMany({ where: { isActive: true }, include: SECTION_INCLUDE, orderBy: { id: "asc" }, take: 3 }),
  prisma.service.findMany({ where: { isActive: true }, include: SECTION_INCLUDE, orderBy: { createdAt: "desc" }, take: 12 }),
])

return (
  <main className="mx-auto w-full max-w-6xl px-4 py-10">
    <h1 className="mb-10 text-3xl font-bold tracking-tight">서비스 둘러보기</h1>
    <Section title="지금 핫한 서비스" services={hot} />
    <Section title="에디터 추천" services={featured} />
    <Section title="전체 서비스" services={all} />
  </main>
)
```

```tsx
// app/components/ServiceCard.tsx (핵심)
<article className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 transition hover:border-zinc-300 hover:shadow-sm">
  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
    {s.category} · {s.serviceType === "online" ? "온라인" : "오프라인"}
  </p>
  <h2 className="mt-3 text-lg font-semibold leading-snug">{s.title}</h2>
  <p className="mt-1 text-sm text-zinc-600">by {s.sellerProfile.user.name}</p>
  <div className="mt-4 flex items-baseline justify-between border-t border-zinc-100 pt-4">
    <span className="text-base font-semibold">₩{s.price.toLocaleString()}</span>
    <span className="text-sm text-zinc-500">{formatDuration(s.durationMinutes)}</span>
  </div>
</article>
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/
│   ├── components/
│   │   └── ServiceCard.tsx             ★ Day 9 (재사용 카드)
│   ├── lib/
│   │   ├── format.ts                   ★ Day 9 (formatDuration)
│   │   ├── dal.ts                      (Day 8)
│   │   ├── session.ts                  (Day 8)
│   │   └── prisma.ts                   (Day 5)
│   ├── services/
│   │   └── page.tsx                    ★ Day 9 (Server Component, 세 섹션)
│   ├── api/                            (Day 5~8)
│   ├── page.tsx                        ★ Day 9 (오타 수정 + /services 링크)
│   ├── layout.tsx
│   └── globals.css                     (보류 — 다크 모드 자동 응답은 다음에)
└── ...
```

---

## 🚀 Day 10 미리보기 — 로그인/회원가입 UI

Day 7·8의 *API 위에 진짜 화면*. 새 개념:
- **Server Action** — `<form action={serverAction}>` 패턴. fetch 안 거치고 서버 함수 직접.
- **`useActionState`** — React 19의 새 훅. 폼 상태·에러·pending 관리.
- **Client Component** — `"use client"` 지시어. 폼 인터랙션 자리.

Server Component(Day 9) ↔ Server Action(Day 10)의 *역할 비교*가 핵심 학습.

---

## 💡 Day 8 + 9 함께 되돌아보기

Day 7 끝까지: *서버 동작* 다 PowerShell로만 검증.
Day 9 끝: *사이트 같은 사이트* — URL 치면 화면이 뜸, 카드가 그리드로 깔림, 클릭 가능.

| Day | 한 줄 | 코드 양 |
|---|---|---|
| 8 | 인증 (JWT + DAL + 보호 API) | ~170줄 |
| 9 | 첫 화면 (Server Component + 카드) | ~120줄 |

**총 ~290줄로 *상태 있는 마켓플레이스의 첫 인상* 완성.**

---

## ✅ 한 줄 요약

> **"PowerShell에서 *데이터*만 보던 게, 브라우저에서 *서비스*로 보이기 시작했다."**

---

*문서 끝. Day 10 (로그인 UI)로 이어짐.*
