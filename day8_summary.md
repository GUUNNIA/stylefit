# Phase 1A — Day 8 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: JWT 세션 기반 로그인/로그아웃 + 보호된 API 패턴
> 학습자: 디자인 전공 / 코딩 8일째

---

## 🎯 큰 그림 — Day 8이 한 일

```
[Day 7] 회원가입 (POST + Zod + bcrypt)
   ↓
[Day 8] 로그인 + 로그아웃 + 보호된 API + DAL  ← 지금
   ↓
[지금] 마켓플레이스가 *상태*를 가짐 — 누가 로그인했는지 서버가 안다
```

Day 7까지: 회원가입은 가능. 하지만 *로그인 못 함* → DB에 user는 있는데 *내가 누군지* 시스템이 모름.
Day 8: 진짜 *로그인 + 세션 + 보호된 라우트*. 향후 *예약, 후기, 메시지*가 *"내 것"*이 되는 토대.

---

## 🔀 Day 8의 큰 방향 결정 — NextAuth 대신 *직접 구현*

원래 Day 7 끝에 계획한 건 *NextAuth (Auth.js) v5* 도입. Day 8 시작 시 재검토:

### NextAuth를 *안 쓴* 이유 3가지
1. **Next.js 16 공식 인증 가이드 자체가 NextAuth 안 씀** — `node_modules/next/dist/docs/01-app/02-guides/authentication.md`. 가이드 전체가 *jose(JWT) + cookies + Server Actions* 패턴.
2. **AGENTS.md 경고** — "This is NOT the Next.js you know. Read the relevant guide in node_modules/next/dist/docs/ before writing any code." NextAuth v5는 Next.js 14/15 기반 베타 → 16 호환성 미검증.
3. **학습 가치** — Day 7에 *bcrypt 직접·Zod 직접*. 일관성 유지하려면 *cookie + JWT + session*도 직접. 라이브러리 블랙박스보다 *원리 빌드업*.

→ `jose` 한 패키지만 추가, 나머지는 직접 구현.

---

## 📅 Day 8 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | jose 설치 + SESSION_SECRET 생성 + .env | 환경 준비 |
| 2 | `app/lib/session.ts` | JWT encrypt/decrypt + cookie 관리 |
| 3 | `POST /api/auth/login` | bcrypt.compare + 쿠키 발급 |
| 4 | `POST /api/auth/logout` | 쿠키 삭제 |
| 5 | 4가지 시나리오 검증 | 정상·잘못된 비번·없는 이메일·로그아웃 |
| 6 | `app/lib/dal.ts` | verifySession + getCurrentUser |
| 7 | `GET /api/me` | 첫 보호된 API |

---

## 🐛 Day 8 핵심 발견·논의

### 발견 1: JWT는 *암호화*가 아니라 *서명*

**오해**: "JWT는 토큰이니까 *암호화*돼서 내용이 안 보이겠지?"

**진실**: JWT 본문은 *base64 인코딩* — 누구나 *읽을 수 있음*. 핵심은 *변조 방지*. 서버가 secret으로 *서명(sign)*하면, 누가 본문 바꿔도 *서명이 깨져서 무효화*됨.

**의미**: payload에 *민감 정보(이메일 전체, 카드번호 등)* 절대 X. 최소한의 식별자(userId)만.

### 발견 2: `httpOnly` 쿠키 — XSS 방어선

쿠키 옵션 `httpOnly: true` → *JavaScript에서 못 읽음*. 만약 XSS 공격으로 악성 JS가 페이지에 주입돼도 *세션 쿠키를 훔쳐갈 수 없음*.

또 `secure: true`(production) → HTTPS에서만 전송. 평문 네트워크에서 가로채기 차단.

### 발견 3: User enumeration 방어 — *친절함 vs 보안의 트레이드오프*

```ts
// 로그인 시
if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return Response.json({ error: "Invalid email or password" }, { status: 401 })
}
```

*"이메일 없음"*과 *"비밀번호 틀림"*을 **구분 안 함**. 같은 401, 같은 메시지.

**왜?** 구분하면 공격자가 *"이 이메일이 가입된 계정인지"* 추측 가능 → *유효 이메일 사전 빌드* → 표적 공격.

검증 시나리오 B(잘못된 비번)와 C(없는 이메일)가 *완전히 같은 응답*이 나오는 게 *방어 작동의 증거*.

### 발견 4: `bcrypt.compare`는 *constant-time*

문자열 비교 `===`는 *틀린 첫 글자에서 즉시 종료* → 응답 시간 차이로 *맞은 글자수 추측 가능* (timing attack).

`bcrypt.compare`는 *항상 같은 시간* 걸림. timing attack 방어 내장.

### 발견 5: Logout이 *왜 POST인가*

GET이면 `<img src="/api/auth/logout">` 같은 *수동적 요청*으로 *악성 사이트가 강제 로그아웃 시킴* (CSRF 변형). POST는 그게 어려움.

원칙: **상태를 바꾸는 행위는 POST**.

### 발견 6: PowerShell의 *WebRequestSession* — 쿠키 들고 다니기

HTTP 클라이언트가 *쿠키를 다음 요청에 자동으로 붙이려면* 세션 객체 필요:
```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod ... -WebSession $session
```

쿠키 없이 호출하면 *매번 로그인 풀린 상태*. 브라우저는 이걸 *자동*으로 해 줌.

---

## 🎓 새로 배운 개념 (Day 8)

### JWT 구조
- header.payload.signature 세 부분, 점으로 구분
- header·payload는 base64 인코딩 (읽힘)
- signature는 secret으로 서명 (변조 방지)

### `jose` 라이브러리
- `SignJWT(payload).setExpirationTime('7d').sign(encodedKey)` — JWT 만들기
- `jwtVerify(token, encodedKey, {algorithms: ["HS256"]})` — 검증
- 검증 실패는 *throw* → `try/catch`로 잡고 null 반환 패턴

### `cookies()` from `next/headers`
- *서버에서만* 호출 가능. Client Component에서 호출하면 에러.
- Next.js 15+부터 *async*. `const cookieStore = await cookies()`
- `.set(name, value, options)`, `.delete(name)`, `.get(name)?.value`

### Data Access Layer (DAL)
- 보호된 라우트·데이터 접근의 *단일 진입점*
- `verifySession()` = "유효한 세션인가?"의 비즈니스 질문
- `getCurrentUser()` = `select` 화이트리스트로 *passwordHash 절대 안 흘림*
- 변경이 한 곳에서 끝나도록 *추가 검증(role, isActive 등) 들어갈 진화 자리*

### HTTP status codes
- 200 OK (로그인 성공, 보호 API 응답)
- 401 Unauthorized (인증 실패·세션 없음)
- 403 Forbidden (인증은 됐지만 권한 X — 아직 안 씀)

---

## 📋 작성된 코드 (Day 8)

```ts
// app/lib/session.ts (핵심)
const SESSION_COOKIE = "session"
const secret = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secret!)

export async function encrypt(payload) {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

export async function createSession(userId) {
  const token = await encrypt({ userId })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 7*24*60*60*1000),
    sameSite: "lax",
    path: "/",
  })
}
```

```ts
// app/api/auth/login/route.ts (핵심)
const user = await prisma.user.findUnique({ where: { email } })
if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return Response.json({ error: "Invalid email or password" }, { status: 401 })
}
await createSession(user.id)
return Response.json({ id: user.id, ... }, { status: 200 })
```

```ts
// app/lib/dal.ts (핵심)
export async function getCurrentUser() {
  const session = await verifySession()
  if (!session) return null
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, profileImageUrl: true, createdAt: true },
  })
}
```

---

## 🛠️ 자주 쓴 명령어 (Day 8)

```powershell
# 의존성 설치
npm install jose

# SESSION_SECRET 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell에서 쿠키 유지하며 API 호출
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"...","password":"..."}' `
  -WebSession $session
Invoke-RestMethod -Uri "http://localhost:3000/api/me" -WebSession $session
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── .env                                ★ Day 8 (SESSION_SECRET 추가)
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          ★ Day 8
│   │   │   ├── logout/route.ts         ★ Day 8
│   │   │   └── signup/route.ts         (Day 7)
│   │   ├── me/route.ts                 ★ Day 8 (첫 보호 API)
│   │   ├── services/                   (Day 5~6)
│   │   └── sellers/                    (Day 5~6)
│   └── lib/
│       ├── dal.ts                      ★ Day 8
│       ├── session.ts                  ★ Day 8
│       └── prisma.ts                   (Day 5)
└── ...
```

---

## 🚀 Day 9 미리보기 — 첫 화면

다음: PowerShell로만 검증하던 API를 *진짜 화면*으로. Server Component + Tailwind.

---

## ✅ 한 줄 요약

> **"6개 파일·~170줄로 *상태 있는 마켓플레이스*가 됐다. 누가 로그인했는지 서버가 안다."**

---

*문서 끝. Day 9로 이어짐.*
