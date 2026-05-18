# Phase 1A — Day 11 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: 서비스 상세 + 예약 폼 + /bookings 내 예약 목록 + UX 마찰 7개 정리
> 학습자: 디자인 전공 / 코딩 11일째

---

## 🎯 큰 그림 — Day 11이 한 일

```
[Day 9] /services 목록 (Server Component)
[Day 10] 로그인·회원가입 UI (Server Action) — *상태 있는 마켓플레이스 골격*
   ↓
[Day 11] 상세·예약·내 예약 + UX 마찰 정리 — *마켓의 첫 행위*  ← 지금
   ↓
[지금] 사용자가 *진짜 무엇을 하는* 마켓 — 보기 → 예약 → 추적
```

Day 10까지: 로그인 + 화면. 다만 *마켓에서 할 수 있는 행위*는 없음.
Day 11: **첫 트랜잭션** — 사용자가 예약을 *만들고* *추적*. 마켓의 *행위 단계 시작*.

---

## 📅 Day 11 작업 요약

### Phase 1 — 핵심 기능 (Step 1~4)
| Step | 파일 | 새 개념 |
|---|---|---|
| 1 | `app/services/[id]/page.tsx` | 동적 라우트 *page* (Day 6 route의 page 응용), `notFound()`, 조건부 분기(로그인 여부) |
| 2 | `app/services/[id]/BookingForm.tsx` | Server-Client 합성, props로 최소 데이터만 |
| 3 | `app/services/[id]/actions.ts` | DAL `verifySession()` *두 번째 사용처*, 보호된 mutation, 5가지 서버 검증 |
| 4 | `app/bookings/page.tsx` | 첫 *보호 페이지* (DAL + redirect), 빈 상태, status 라벨 매핑 |

### Phase 2 — UX 마찰 7개 정리
| # | 마찰점 | 해결 |
|---|---|---|
| ① | 로그인 후 *원래 위치 복귀 안 됨* | `?from=` + `safeReturnUrl` (open redirect 방어) |
| ② | 예약·회원가입 성공 *피드백 없음* | `SuccessBanner` + `?success=1` / `?welcome=1` |
| ③ | 과거 날짜를 *입력 단계*에서 차단 X | `useEffect`로 클라이언트 min 설정 |
| ④ | 예약 폼에 *서비스 제목* 컨텍스트 없음 | `serviceTitle` props 추가 |
| ⑤ | `/bookings` 카드 일부만 클릭 가능 | 카드 전체를 `<Link>`로 감싸기 |
| ⑥ | 상세 페이지 뒤로가기 *hardcoded* (어디서 왔든 /services로) | `?from=` 기반 *동적 라벨+href* |
| ⑦ | 헤더에 *현재 페이지 강조* 없음 | `NavLink` Client Component 분리 |

---

## 🐛 Day 11 핵심 발견·논의

### 발견 1: 디자이너의 *진짜 사용자 흐름* 시뮬레이션 효과

내가 코드를 작성하고 *"시나리오상 작동함"*에 만족한 직후, 사용자가 *진짜 사용자처럼 따라가며 7개 마찰점*을 짚어냄. *코드가 작동하는 것*과 *진짜 쓸 만한 것*은 다름.

**원칙**: 디자이너가 코드 리뷰에 참여하는 가치 — *기능 검증과는 다른 층의 비판*. 백엔드 개발자가 못 보는 *흐름의 마찰*을 잡아냄.

### 발견 2: Server Component에서 *useSearchParams* 못 씀 → 분리 패턴

login/signup의 `?from=` 처리 위해 *searchParams 읽기*가 필요. 가장 idiomatic한 길:
- **Server Component**가 `searchParams` props로 받음
- *Client Component*에 `from`을 props로 전달

이게 Day 11 *세 번째 Server-Client 합성*:
1. `services/[id]` (Server) + `BookingForm` (Client)
2. `login/page` (Server) + `LoginForm` (Client)
3. `signup/page` (Server) + `SignupForm` (Client)
4. `Header` (Server) + `NavLink` (Client) — *반대 방향* (Header에 DAL이 필요해 Server, NavLink에 usePathname이 필요해 Client)

**원칙**: "default = Server. 인터랙션·훅 필요한 *최소 부분만* Client로 분리." 이 분리가 *진짜 Next.js 16의 핵심 정신*.

### 발견 3: Open redirect 방어 — `safeReturnUrl` 헬퍼

`?from=https://evil.com` 같은 외부 URL을 *그대로 redirect*하면 **피싱 가능**. 사용자가 "로그인 성공했네" 라며 evil.com에 도착 → 가짜 페이지에 또 로그인 정보 입력.

방어:
```ts
export function safeReturnUrl(candidate, fallback) {
  if (!candidate) return fallback
  if (!candidate.startsWith("/")) return fallback
  if (candidate.startsWith("//")) return fallback  // protocol-relative 차단
  return candidate
}
```

**원칙**: "사용자가 보내는 모든 URL은 의심. 내부 경로만 허용." 보안 표준 패턴.

### 발견 4: `?` (nullish coalescing) vs `||` (logical OR)의 함정

뒤로가기 매핑 코드:
```ts
const backLink = (from && BACK_LINKS[from]) ?? BACK_LINKS["/services"]
```

이게 *타입 에러*를 던졌음. 이유:
- `from === ""` → `(from && BACK_LINKS[from])` = `""` (빈 문자열 반환)
- `??`는 *nullish*(null/undefined)만 fallback. *빈 문자열은 통과*.
- → backLink가 `"" | {...}` 형태가 됨 → `.href` 접근 시 타입 에러.

해결: `||` 사용 — *모든 falsy*가 fallback.

**원칙**: "*nullish인지 falsy인지*를 정확히 구분. ?? 와 ||는 *다른 함수*." 작은 차이지만 *버그 원천*.

### 발견 5: `defaultValue + key` 트릭 (Day 10) 의 확장 적용

회원가입에 *email + name 둘 다* 보존. 또 *Day 10 패턴이 재사용 가능*한 증거. 패턴이 굳음.

### 발견 6: PRG 패턴의 확장 — *성공 피드백을 URL에 실어*

성공 후 redirect할 때 *URL query param*으로 *어떤 성공인지* 전달:
- `redirect("/bookings?success=1")` → /bookings 페이지가 *success를 읽고* 배너 표시
- `redirect("/services?welcome=1")` → /services 페이지가 *welcome을 읽고* 배너 표시

자연 dismiss: 사용자가 다른 페이지로 이동하면 *URL이 바뀌어 query 사라짐* → 배너도 사라짐. *useEffect나 timer 없이* 단순.

**원칙**: "URL query가 *컴포넌트 상태의 단순한 대안*이 될 수 있음." React state로 갈 일도 search param이 *깔끔하고 새로고침 안전*한 경우 많음.

### 발견 7: YAGNI 결정 — *모든 완성도를 다 추구하지 않음*

내가 *"비로그인 /bookings → 로그인 후 자동 복귀"* 추가 마찰점을 *제안*했지만, 사용자가 *반박*:
- *흔치 않은 시나리오* (북마크 정도)
- *치명적 마찰 아님* (헤더 클릭으로 2-step 복귀)
- *코드 복잡도 ↑*

→ **안 함**. Day 12+에 보호 페이지 늘어나면 *그때 한꺼번에 패턴화*. 

**원칙**: "*생기지 않은 문제를 미리 해결하지 마라*. 패턴화는 *세 번째 사용처*에서." 학습 단계엔 더 중요.

### 발견 8: Server Component + DAL의 *세 번째 사용처*

Day 8 만든 `verifySession()`:
- Day 8: `/api/me` (1)
- Day 10: 헤더의 `getCurrentUser()` (2 — wrapper지만 본질 같음)
- Day 11: `bookServiceAction`, `/bookings`, 상세 페이지 (3·4·5)

세 번째 이상부터 *DAL 패턴이 진짜로* 가치 있음을 증명. 모든 인증 검증이 *한 곳*에서 → 변경 시 *한 곳만* 고치면 됨.

---

## 🎓 새로 배운 개념 (Day 11)

### 동적 라우트의 page 버전
- `params: Promise<{ id: string }>` (Next.js 15+)
- `await params`로 풀고 사용
- `notFound()` from `next/navigation` — throw처럼 작동, 404 응답

### `searchParams` (Server Component)
- `searchParams: Promise<{ from?: string }>`
- `await searchParams`
- *URL의 ?key=value* 읽기

### `useState` + `useEffect` (React 기본 훅)
- `useState(초기값)` — 컴포넌트 state
- `useEffect(() => {...}, [])` — *마운트 후 한 번* 실행 (빈 의존성 배열)
- Hydration mismatch 방어용 — Date.now() 같은 *서버/클라이언트 시간 차이*가 있는 코드를 클라이언트에서만 실행

### `usePathname` 훅
- 현재 URL 경로 반환
- Client Component 전용
- *active state* 표시 등에 사용

### Server Component ↔ Client Component 합성 패턴
- Server가 데이터 페치·DB 접근
- Client가 인터랙션·훅
- props로 *Server → Client* 일방향 전달
- 같은 페이지 안에 *섞어 쓰기* 가능

### `redirect()` from `next/navigation`
- Server Component·Server Action에서 사용
- 내부적으로 throw → 그 아래 코드 실행 안 됨
- try/catch 안에서 redirect는 *위험* — catch가 throw 먹어버림

### URL search param을 *상태로* 활용
- `?success=1`, `?welcome=1`, `?from=...`
- 새로고침 안전, 공유 가능, 자연 dismiss
- React state로 갈 필요 없을 때 *대안*

### Open redirect 방어
- 사용자 입력 URL을 검증 *없이* redirect = 피싱 위험
- 내부 경로만 허용 (`/`로 시작 + `//`로 시작 X)

---

## 📋 작성된 코드 핵심

```tsx
// app/services/[id]/page.tsx (핵심)
const [service, user] = await Promise.all([
  prisma.service.findUnique({ where: { id: serviceId }, include: {...} }),
  getCurrentUser(),
])

const backLink = (from && BACK_LINKS[from]) || BACK_LINKS["/services"]

return (
  <main>
    <Link href={backLink.href}>{backLink.label}</Link>
    <article>{/* 서비스 정보 */}</article>
    {user
      ? <BookingForm serviceId={service.id} serviceTitle={service.title} ... />
      : <Link href={`/login?from=${encodeURIComponent(`/services/${service.id}`)}`}>
          로그인하고 예약하기
        </Link>}
  </main>
)
```

```ts
// app/services/[id]/actions.ts (핵심)
"use server"
export async function bookServiceAction(_prev, formData) {
  const session = await verifySession()  // ← DAL 두 번째 사용처
  if (!session) return { error: "로그인이 필요합니다." }

  // Zod 검증, 미래 시간 검증, 서비스 존재·자기 서비스 차단 ...

  await prisma.booking.create({
    data: { buyerId: session.userId, serviceId, sellerProfileId, preferredDatetime, buyerMemo },
  })
  redirect("/bookings?success=1")
}
```

```tsx
// app/components/NavLink.tsx (헤더 active state)
"use client"
import { usePathname } from "next/navigation"
export default function NavLink({ href, children, matchPrefix }) {
  const pathname = usePathname()
  const isActive = matchPrefix ? pathname.startsWith(href) : pathname === href
  return <Link href={href} className={isActive ? "font-semibold ..." : "..."}>{children}</Link>
}
```

---

## 📁 현재 폴더 상태

```
stylefit/app/
├── components/
│   ├── Header.tsx                      (Day 10) — NavLink 도입 (Day 11)
│   ├── NavLink.tsx                     ★ Day 11
│   ├── ServiceCard.tsx                 (Day 9) — Link 감싸기 (Day 11)
│   └── SuccessBanner.tsx               ★ Day 11
├── login/
│   ├── actions.ts                      (Day 10) — from 처리 (Day 11)
│   ├── page.tsx                        ★ Day 11 (Server로 전환)
│   └── LoginForm.tsx                   ★ Day 11
├── signup/
│   ├── actions.ts                      (Day 10) — from 처리 (Day 11)
│   ├── page.tsx                        ★ Day 11 (Server로 전환)
│   └── SignupForm.tsx                  ★ Day 11
├── services/
│   ├── [id]/
│   │   ├── page.tsx                    ★ Day 11
│   │   ├── BookingForm.tsx             ★ Day 11
│   │   └── actions.ts                  ★ Day 11
│   └── page.tsx                        (Day 9) — welcome 배너 (Day 11)
├── bookings/
│   └── page.tsx                        ★ Day 11 (첫 보호 페이지)
└── lib/
    └── format.ts                       (Day 9) — safeReturnUrl (Day 11)
```

---

## 🚀 Day 12 미리보기 — 큐레이션 데이터 or 셀러 페이지

여러 후보:
- **큐레이션 테이블 도입** — /services의 핫/추천/전체에 *진짜 다른 데이터*. 다대다 관계 학습.
- **셀러 어드민 페이지** — 셀러가 *자기 서비스 관리*. 보호 페이지 두 번째.
- **예약 액션** — 사용자가 *예약 취소*. mutation 패턴 두 번째.
- **메시지 스레드** — 예약과 1:1 관계 활용. 실시간 느낌은 *훨씬 나중*.

어느 쪽을 가든 *Day 8~11의 패턴이 굳음*: Server Component + DAL + Server Action + Server-Client 합성.

---

## 💡 Day 8~11 통합 회고 — *4 Day의 기적*

| Day | 한 줄 | 코드 |
|---|---|---|
| 8 | 인증 (JWT + DAL + 보호 API) | ~170 |
| 9 | 첫 화면 /services (Server Component) | ~120 |
| 10 | 로그인·가입 UI + 헤더 (Server Action) | ~250 |
| 11 | 예약 묶음 + UX 마찰 7개 정리 | ~400 |
| **합계** | **마켓의 1회 완결 흐름** | **~940줄** |

4 Day, ~940줄로:
- *비회원이 둘러보기 → 회원가입·로그인 → 예약 → 추적*까지 **한 흐름**
- *백엔드·프론트·인증·보안·UX* 다 통합
- Next.js 16 핵심 패턴(Server/Client 합성, Server Action, DAL, PRG) 다 학습

---

## ✅ 한 줄 요약

> **"디자이너가 자기 손으로 만든 마켓에서 예약 한 번 한다 — 11일 전엔 빈 폴더였던 게."**

---

## 🧠 한 가지 회고 — *디자이너와 AI의 협업*

이번 Day의 *진짜 학습*은 코드가 아니라 *흐름*. 내가 *기능 작동에 만족*한 직후, 사용자가 *진짜 사용자처럼 따라가며 마찰을 짚어냄*. 

"새로고침 시 다이얼로그", "비번 틀려도 이메일 유지", "검정 배경", "뒤로가기 hardcoded" — *백엔드 개발자가 안 보는 영역*을 *디자이너가 잡음*. 

이게 *AI + 디자이너 + 학습자*가 *함께 만들 때 가능한 결과*. 셋 중 하나라도 빠지면 *반쪽*.

---

*문서 끝. Day 12로 이어짐.*
