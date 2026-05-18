# Phase 1A — Day 10 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: 로그인/회원가입 UI + 글로벌 헤더 (Server Action 첫 진입)
> 학습자: 디자인 전공 / 코딩 10일째

---

## 🎯 큰 그림 — Day 10이 한 일

```
[Day 7~8] 인증 API (회원가입·로그인·로그아웃·me) — PowerShell로만 검증 가능
   ↓
[Day 9] /services Server Component — 누구나 보는 첫 화면
   ↓
[Day 10] 로그인·회원가입 UI + 헤더 — 진짜로 *상태 있는 마켓플레이스*  ← 지금
   ↓
[지금] 헤더에 "{이름}님" 보이고, 카드 그리드 보고, 로그아웃 가능 — 사이트답다
```

Day 9까지: 백엔드 + 화면 1개. *로그인 흐름은 PowerShell로만*.
Day 10: 진짜 *폼 → 인증 → redirect → 헤더 변화* 전체 흐름이 *브라우저로* 작동.

---

## 🔀 Day 10 큰 결정 — *Server Action* (fetch API 안 씀)

이미 Day 7~8에 `/api/auth/login`, `/signup` 같은 *Route Handler*가 있음. 폼에서 `fetch('/api/auth/login')`로 충분히 가능. *그럼에도* Server Action을 쓴 이유:

1. **JS 비활성 사용자도 작동** — Server Action은 *기본 HTML form submission* 위에서 동작. JS 꺼도 폼 제출 가능 (접근성).
2. **CSRF 보호 내장** — Next.js가 자동 처리. fetch면 토큰을 수동 관리해야.
3. **타입 안전** — 서버 함수를 *직접 import*해서 호출. fetch는 *URL 문자열 + JSON 직렬화* 거침.
4. **Next.js 16 공식 권장**.

> Day 7~8의 `/api/auth/*` route는 *외부 클라이언트(모바일 등)* 용으로 그대로 유지. 두 진입점이 *목적별로 공존*.

---

## 📅 Day 10 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | `app/login/{actions.ts, page.tsx}` | Server Action + useActionState + 폼 |
| 2 | `app/signup/{actions.ts, page.tsx}` | 가입 + 자동 로그인 (createSession 즉시) |
| 3 | `app/components/Header.tsx` + layout 통합 | 로그인 여부 분기 표시 + 글로벌 헤더 |
| 3.5 | 폼 UX 수정 — `defaultValue` + `key` 트릭 | 실패 시 *이메일만 복원*, 비번은 *초기화* |

---

## 🐛 Day 10 핵심 발견·논의

### 발견 1: 폼 input이 *둘 다 초기화*되던 문제

화면 처음 봤을 때 비번 틀리면 *이메일까지 사라짐*. 디자이너 직감: "왜? 의도한 거야?"

**솔직한 답**: 의도 *없음*. *방어 안 해서 기본 동작 노출*.

**원인**: React form + Server Action 흐름에서 *form auto reset*이 일어남 → uncontrolled input은 빈 상태가 됨. 내가 `<input>`에 `value`/`defaultValue` 명시 안 함.

**UX 원칙** (디자이너가 잡아내야 정상):
| 필드 | 제출 후 | 이유 |
|---|---|---|
| **이메일** | *유지* | 사용자가 *방금 입력한 걸 또 치게* 만들면 짜증. 민감 정보 X |
| **비밀번호** | *초기화* | ① 시각 보안 (남이 화면 봤을 때 노출 시간 ↓) ② 틀린 비번 한 글자만 고치는 것보다 *처음부터* 치는 게 실수 ↓ |

### 발견 2: `defaultValue`는 *초기 렌더에만 읽힘* — `key` 트릭 필요

React 규칙: `defaultValue`는 *컴포넌트 첫 mount* 시점에만 읽음. 이후 props가 바뀌어도 *무시*.

해결: `key` prop을 *같이 변경* → React가 *컴포넌트를 새로 mount* → 새 `defaultValue` 반영.

```tsx
<input
  key={state?.email ?? "initial"}      // ← state 바뀌면 key 변경 → 새 mount
  defaultValue={state?.email ?? ""}    // ← 새 mount 시점에 새 값 읽음
/>
```

이걸 *email input만*에 적용 → 비번 input은 *그대로* → form auto reset에 따라 빈 상태 유지. 분리 명확.

### 발견 3: 새로고침 시 *"양식 다시 제출 확인"* 다이얼로그

비번 틀린 후 F5 → 브라우저가 다이얼로그. *내가 처리한 게 아님*. *POST 요청의 표준 안전망*.

**원리**:
1. 폼 제출 = POST 요청
2. 서버가 *같은 페이지* 다시 렌더링 (에러 응답)
3. 현재 brower history entry = *"POST 요청의 결과"*
4. 새로고침 → 브라우저: *"POST를 또 보내야 함"* → 명시적 동의 요구

**왜?** POST는 *상태 변경*. 결제 폼이면 *두 번 결제*, 댓글 폼이면 *댓글 두 개* 같은 사고 방지.

**표준 해결 = PRG (Post-Redirect-Get)**: POST 응답으로 *결과를 직접 렌더링하지 말고 redirect 줘라*. 브라우저가 GET으로 새 페이지 → 새로고침 안전.

**우리 코드**:
- 로그인 *성공*: `redirect("/services")` → GET → 새로고침 안전 ✓
- 로그인 *실패*: state 반환만, 머무름 → 새로고침 다이얼로그 ✗

**왜 안 고쳤나**: 실패 시 PRG로 가려면 *입력값·에러를 URL search param*에 실어야 함 → 이메일이 URL에 노출(나쁜 UX), 비번은 절대 못 넣음. *현재 다이얼로그가 안전망이라 그대로 두는 게 표준*.

### 발견 4: Server Component ↔ Client Component 합성

- `Header` = Server Component (DAL 직접 호출, 로그인 여부 서버에서 판정)
- `/login`, `/signup` 페이지 = Client Component (`useActionState` 같은 훅 필요)
- *layout(Server)이 부모, login(Client)이 자식*으로 자연스럽게 합성됨

**원칙**: "default는 Server Component, *인터랙션·훅 필요한 곳만* Client Component."

### 발견 5: 자동 로그인 패턴

회원가입 폼:
1. `prisma.user.create` (가입)
2. `createSession(user.id)` (즉시 세션 발급)
3. `redirect("/services")`

Day 7 `/api/auth/signup`은 *가입만*. Day 10 signupAction은 *가입 + 로그인 한 흐름*. UI 입장에서 *연속된 경험*. *한 번 더 로그인하라*고 안 함.

### 발견 6: User enumeration 방어 — 회원가입엔 *해당 없음*

로그인: "이메일 없음"과 "비번 틀림"을 *구분 X* (Day 8 학습).
회원가입: "이미 가입된 이메일"은 *명확히 알려줌*. *이유?* 가입 시도 자체가 *"내가 이 이메일 쓸 수 있나?"* 질문이라 *enumeration 방어 의미 X*.

---

## 🎓 새로 배운 개념 (Day 10)

### Server Action
- 파일 또는 함수 상단에 `"use server"` 지시어
- *서버에서만 실행*. 클라이언트에선 *호출 stub*만.
- `<form action={fn}>` 또는 `useActionState`로 호출
- Next.js가 CSRF 토큰·직렬화 자동 처리
- `redirect("/path")`로 흐름 종료 가능 (내부적으로 throw)

### Client Component
- 파일 상단 `"use client"` 지시어
- React 훅 (`useState`, `useActionState`, `useEffect` 등) 사용 가능
- 브라우저에서 JS로 실행
- *기본은 Server Component*, 필요할 때만 Client로 전환

### `useActionState` (React 19)
```ts
const [state, formAction, pending] = useActionState(actionFn, initialState)
```
- `state` — 직전 Action 반환값
- `formAction` — `<form action={...}>`에 넘길 wrapped 함수
- `pending` — 제출 중 여부 (버튼 disable·"로딩 중..." 표시)

### `defaultValue` + `key` 트릭
- React의 *uncontrolled input*은 `defaultValue`로 초기값 지정
- `defaultValue`는 *첫 mount에만 읽힘* → 후속 변경 무시
- `key` prop을 같이 변경 → 컴포넌트 새 mount → 새 `defaultValue` 반영

### inline Server Action (in Server Component)
```tsx
// Header.tsx (Server Component)
async function logoutAction() {
  "use server"
  await deleteSession()
  redirect("/")
}
// ...
<form action={logoutAction}><button>로그아웃</button></form>
```
- Server Component 안에서 *함수 자체에 "use server"* 지시
- 별도 파일 분리 안 해도 됨

### Next.js `<Link>` vs `<a>`
- 내부 페이지: `<Link>` (prefetch + 클라이언트 라우팅)
- 외부 페이지: `<a target="_blank">`

### PRG 패턴 (Post-Redirect-Get)
- POST 응답으로 *결과 직접 렌더링 X*, *redirect 응답 줘라*
- 새로고침 안전 + 브라우저 history 자연스러움
- 우리 코드: 성공만 PRG, 실패는 *의도적으로* 머묾

---

## 📋 작성된 코드 핵심 (Day 10)

```ts
// app/login/actions.ts (핵심)
"use server"
export type LoginState = { error?: string; email?: string } | undefined

export async function loginAction(_prev, formData) {
  const email = (formData.get("email") as string) ?? ""
  // ... Zod 검증, user 조회, bcrypt.compare ...
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다.", email }
  }
  await createSession(user.id)
  redirect("/services")
}
```

```tsx
// app/login/page.tsx (핵심)
"use client"
const [state, formAction, pending] = useActionState(loginAction, undefined)

return (
  <form action={formAction}>
    <input
      name="email"
      key={state?.email ?? "initial"}
      defaultValue={state?.email ?? ""}
    />
    <input name="password" type="password" />
    {state?.error && <p className="text-red-600">{state.error}</p>}
    <button disabled={pending}>{pending ? "로그인 중..." : "로그인"}</button>
  </form>
)
```

```tsx
// app/components/Header.tsx (핵심)
async function logoutAction() {
  "use server"
  await deleteSession()
  redirect("/")
}

export default async function Header() {
  const user = await getCurrentUser()
  return (
    <header>
      {user ? (
        <>
          <span>{user.name}님</span>
          <form action={logoutAction}><button>로그아웃</button></form>
        </>
      ) : (
        <>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
        </>
      )}
    </header>
  )
}
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/
│   ├── components/
│   │   ├── Header.tsx                  ★ Day 10
│   │   └── ServiceCard.tsx             (Day 9)
│   ├── login/
│   │   ├── actions.ts                  ★ Day 10
│   │   └── page.tsx                    ★ Day 10
│   ├── signup/
│   │   ├── actions.ts                  ★ Day 10
│   │   └── page.tsx                    ★ Day 10
│   ├── lib/                            (Day 5~9)
│   ├── api/                            (Day 5~8)
│   ├── services/                       (Day 9)
│   ├── layout.tsx                      ★ Day 10 (Header 통합)
│   └── page.tsx                        (Day 9)
└── ...
```

---

## 🚀 Day 11 미리보기 — 예약 mutation 묶음

다음: *보호된 mutation API + UI 한 번에*. 새 개념:
- **`POST /api/bookings`** (보호 API) — DAL의 `verifySession()` 활용
- **`/services/[id]` 상세 페이지** — Day 6 API의 *화면*. 예약 폼 자리
- **`bookServiceAction`** — Server Action으로 예약 처리
- **`/bookings` 내 예약 목록** — 보호 페이지 (비로그인 시 /login redirect)

Day 8 DAL이 *두 번째 사용처*를 만나면서 패턴이 굳음. Server Action이 *데이터 변경*까지 닿음.

---

## 💡 Day 8 + 9 + 10 함께 되돌아보기

| Day | 한 줄 | 코드 |
|---|---|---|
| 8 | JWT 인증·DAL·보호 API (PowerShell 검증) | ~170줄 |
| 9 | /services 첫 화면 (Server Component) | ~120줄 |
| 10 | 로그인·가입 UI·헤더 (Server Action) | ~250줄 |
| **합계** | **상태 있는 마켓플레이스 골격** | **~540줄** |

3 Day 만에 *PowerShell-only* 에서 *진짜 사이트*로 진화.

---

## ✅ 한 줄 요약

> **"폼에 입력 → 헤더에 내 이름이 뜬다. 4 Day 전엔 *데이터*만 있던 게, 이제 *나*라는 존재가 있다."**

---

*문서 끝. Day 11 (예약 묶음)로 이어짐.*
