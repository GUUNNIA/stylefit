# Phase 1A — Day 7 완료 보고서

> 작성일: 2026-05-15 (Day 5·6·7 같은 세션, 연속 진행)
> 작업 범위: 첫 POST API — `POST /api/auth/signup` (회원가입)
> 학습자: 디자인 전공 / 코딩 7일째

---

## 🎯 큰 그림 — Day 7이 한 일

```
[Day 1~3] 환경 + Prisma 7개 테이블
   ↓
[Day 4] 시드 데이터 39개 행
   ↓
[Day 5] 목록 API 2개 (findMany)
   ↓
[Day 6] 상세 API 2개 (findUnique + 동적 라우트 + 404)
   ↓
[Day 7] 첫 *쓰기 API* — 회원가입 (POST + Zod + bcrypt)  ← 지금
   ↓
[지금] 외부에서 *진짜 데이터 생성* 가능 — DB에 새 User 행 추가
```

**Day 5~6는 *읽기*, Day 7은 *쓰기* 첫 진입**. *read-only 마켓 → 진짜 양방향 마켓*으로 한 걸음.

---

## 📅 Day 7 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | 라이브러리 설치 — `zod`, `bcryptjs`, `@types/bcryptjs` | 입력 검증·해싱 도구 확보 |
| 2 | `app/api/auth/signup/route.ts` 작성 | POST 핸들러 + Zod + bcrypt + 중복 체크 |
| 3 | 4가지 시나리오 검증 (정상·중복·짧은비번·약관누락) | 201 / 409 / 400 / 400 모두 정확 |

---

## 🐛 Day 7 핵심 발견·논의

### 발견 1: dev 서버 *연결 안 됨* — 두 터미널 분리 원칙

**상황**: 회원가입 첫 시도 시 `Invoke-RestMethod : 원격 서버에 연결할 수 없습니다` 에러.

**원인**: `npm install` 명령을 *기존 dev 서버가 떠 있던 터미널*에서 실행 → *dev 서버 자동 종료*. *한 터미널 = 하나의 주 프로세스* 원칙.

**해결**: VS Code의 **새 터미널 열기** 기능 사용. 두 터미널 동시 운영.

**핵심 통찰**: **풀스택은 *터미널 여러 개 동시 운영이 정상***. 
- 터미널 1 (전용): `npm run dev` — *계속 떠 있어야 함*
- 터미널 2: 일회성 명령 (`git`, `npm install`, API 호출 등)
- 터미널 3 (선택): `npx prisma studio`

### 발견 2: PowerShell의 `???` — *데이터 vs 표시는 다른 층*

**상황**: 회원가입 응답에 `name: ????` 표시 → 사용자 "이상한데?".

**원인**: PowerShell의 *표시 인코딩 한계*. *데이터는 정상* (UTF-8 한글), *터미널 출력만 깨짐*.

**검증**: Prisma Studio에서 *진짜 데이터* 확인 → "새사용자" 한글 정상.

**핵심 통찰**: **데이터 자체와 *터미널 표시*는 *다른 층***. *진짜 검증*은 *DB / 브라우저*에서. *터미널 깨짐*은 *데이터 무결성 문제가 아님*.

### 발견 3: 빨간 에러 메시지가 *기대된 응답*

**상황**: 시나리오 2 (이메일 중복) 시도 → PowerShell 빨간 메시지 → 사용자 "에러 난거같은데?"

**현실**: 메시지에 `(409) 충돌`이 정확히 들어있음. **우리 API가 의도대로 409 응답**한 것을 *PowerShell이 빨간 에러로 표시*.

**원인**: `Invoke-RestMethod`의 *기본 동작*이 *4xx/5xx 응답을 예외로 던짐*.

**핵심 통찰**: **HTTP status code의 *비즈니스 의미*와 *클라이언트 도구의 표시*는 별개**. *진짜 검증*은 *기대 status가 메시지에 정확히 들어있는지*. 프론트엔드 코드에선 `response.status === 409`로 *분기*해서 *"이미 가입된 이메일입니다"* UI 표시.

### 발견 4: `...` 축약 표기의 함정

**상황**: 내가 문서용으로 `Invoke-RestMethod ... '{...}'`로 적은 *축약 표시*를 사용자가 *literal로 입력* → PowerShell이 *"위치 매개변수를 찾을 수 없음"* 에러.

**원인**: *문서용 표기*와 *실제 명령어*의 구분 불명확.

**해결**: 이후부터 *완전한 명령어*만 제공.

**핵심 통찰**: **학습자에게는 *복사·붙여넣기로 그대로 작동하는 명령어*가 안전**. *축약 표기*는 *경험 있는 사람만* 해석 가능.

---

## 🎓 새로 배운 개념 (Day 7)

### POST 핸들러 패턴
- **`export async function POST(request: Request)`**: 요청 객체 매개변수 사용
- **`await request.json()`**: 요청 본문 JSON 파싱
- **응답 status code 다양**: 201 (Created), 400, 409, 500
- **`Response.json(data, { status: 201 })`**: status 명시

### Zod — 런타임 입력 검증
- **TypeScript의 한계 보완**: TypeScript는 *컴파일 시점*만, Zod는 *런타임 외부 입력* 검증
- **스키마 정의**: `z.object({...})`로 객체 모양
- **타입 메서드**: `z.email()`, `z.string().min(8)`, `z.literal(true)` 등
- **`safeParse(data)`**: 결과를 `{ success, data | error }` 객체로 반환 (try/catch 불필요)
- **`result.error.issues`**: 검증 실패 상세 (어떤 필드가 어떻게 잘못됐는지)

### bcrypt — 비밀번호 해싱
- **`bcrypt.hash(password, 10)`**: salt rounds 10으로 해싱
- **복원 불가능**: 같은 입력이라도 매번 *다른 해시* (salt 자동)
- **검증 시**: `bcrypt.compare(plain, hash)` (Day 8+ 로그인에서)
- **`bcryptjs` vs `bcrypt`**: 순수 JS vs 네이티브 의존성 — *bcryptjs가 *서버리스 환경 안정*

### HTTP status code 표준
- **201 Created**: 새 리소스 생성 성공 (POST 표준)
- **400 Bad Request**: 입력 형식·검증 실패
- **409 Conflict**: 리소스 이미 존재 (중복)
- **클라이언트 분기 입력**: 프론트엔드가 status 보고 *UI 결정*

### 보안 패턴
- **`select` 화이트리스트** (Day 5~6에서 학습): 응답에 *passwordHash 포함 X*
- **서버가 신뢰할 데이터는 *서버가 채움***: `agreedTermsAt: new Date()` — 클라이언트 시간 신뢰 X
- **중복 체크의 *코드 차원 방어선***: DB의 `@unique`보다 *먼저* 코드에서 체크 → 친절한 409 응답

### 풀스택 환경 패턴
- **터미널 여러 개 동시 운영**: 풀스택 개발의 *일상*
- **데이터 vs 표시 분리**: 디버깅 시 *층 구분*

---

## 📋 작성된 코드 (Day 7)

```ts
// app/api/auth/signup/route.ts
import { prisma } from "@/app/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const SignupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(1).max(20),
  agreedTerms: z.literal(true),
})

export async function POST(request: Request) {
  const body = await request.json()

  const result = SignupSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: "Invalid input", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { email, password, name } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json(
      { error: "Email already exists" },
      { status: 409 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      agreedTermsAt: new Date(),
    },
    select: { id: true, email: true, name: true },
  })

  return Response.json(user, { status: 201 })
}
```

---

## 🛠️ 자주 쓴 명령어 (Day 7)

```
# 라이브러리 설치
npm install zod bcryptjs
npm install --save-dev @types/bcryptjs

# POST API 호출 (PowerShell)
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/signup" -ContentType "application/json" -Body '{"email":"new1@example.com","password":"securepass123","name":"새사용자","agreedTerms":true}'
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── signup/
│   │   │       └── route.ts          ★ Day 7
│   │   ├── services/
│   │   │   ├── route.ts              (Day 5)
│   │   │   └── [id]/route.ts         (Day 6)
│   │   └── sellers/
│   │       ├── route.ts              (Day 5)
│   │       └── [id]/route.ts         (Day 6)
│   └── lib/prisma.ts                 (Day 5)
├── prisma/                           (Day 3~4)
└── ...
```

---

## 🚀 Day 8 미리보기 — NextAuth 인증

다음 작업: **로그인 + 세션 관리**.

### 예상 작업
| 단계 | 내용 |
|---|---|
| 1 | NextAuth (Auth.js) 설치 + 설정 |
| 2 | Credentials provider (이메일·비밀번호 로그인) |
| 3 | `bcrypt.compare`로 비밀번호 검증 |
| 4 | 세션 관리 (JWT 또는 DB session) |
| 5 | `auth()` 헬퍼로 *보호된 라우트* 처리 |

### Day 7이 Day 8에 미치는 영향
- *signup으로 만든 사용자*가 *Day 8 로그인 테스트 대상*
- *bcrypt.hash → bcrypt.compare* 짝꿍 패턴
- *Zod 검증 패턴* → 로그인 입력 검증에도 동일

---

## 💡 Day 5+6+7 한 세션 회고 — *코딩 5일에 풀스택 *읽기·쓰기* 다 닫음*

| Day | 핵심 학습 | 코드 |
|---|---|---|
| 5 | 목록 조회 (findMany + where + include + select) | ~30줄 |
| 6 | 상세 조회 + 동적 라우트 + 404 | ~50줄 |
| 7 | 쓰기 + Zod + bcrypt + 보안 패턴 | ~50줄 |
| **총** | **목록·상세·쓰기** | **~130줄** |

**130줄 *세 Day 한 세션 분량***. 추가 학습 패턴:
- POST 패턴 + 요청 본문 파싱
- Zod 런타임 입력 검증
- bcrypt 비밀번호 해싱
- 4가지 HTTP status 분기
- 두 터미널 분리 원칙
- 데이터 vs 표시 층 분리
- 풀스택 디버깅의 *층 분리* 사고

---

## ✅ 한 줄 요약

> **"3개 파일·130줄로 *Phase 1A 마켓플레이스 골격의 절반 (read API + write API)*이 작동한다."**

- *기본 *읽기·쓰기 API* 완결*
- Day 8 인증 + Day 9~ 화면 만들면 *진짜 마켓플레이스* 동작
- 미래 어떤 도메인(법률·의료 등)으로 바꿔도 *코드 구조 그대로 재활용 가능*

---

*문서 끝.*

*Day 7 완료. Day 8 (NextAuth 인증)으로 갈 준비 됨.*
