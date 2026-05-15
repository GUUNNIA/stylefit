# Phase 1A — Day 6 완료 보고서

> 작성일: 2026-05-15 (Day 5와 같은 세션, 연속 진행)
> 작업 범위: 동적 라우트 + 상세 API — `GET /api/services/[id]` + `GET /api/sellers/[id]`
> 학습자: 디자인 전공 / 코딩 6일째

---

## 🎯 큰 그림 — Day 6이 한 일

```
[Day 5] 목록 API (findMany + where + include + select)
   ↓
[Day 6] 상세 API (findUnique + 동적 라우트 + 404 처리)  ← 지금
   ↓
[지금] 9개 서비스 + 3명 셀러의 *상세 데이터*까지 외부 접근 가능
```

**Day 5의 목록 API와 함께 *마켓플레이스 화면 만들기 위한 *기본 API 셋***이 완성됨.

---

## 📅 Day 6 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | Day 6 결정사항 합의 (404 처리, 관계 데이터 범위, pending 처리 등) | 6개 결정 |
| 2 | `app/api/services/[id]/route.ts` 작성 | 동적 라우트 + findUnique |
| 3 | `app/api/sellers/[id]/route.ts` 작성 | services 포함, approved만 |
| 4 | 4가지 시나리오 검증 | 정상 2개 + 404 2개 모두 의도대로 |

---

## 🐛 Day 6 핵심 결정·발견

### 결정 1: 404 처리 방식 — JSON 에러 + status

**선택**: `Response.json({ error: "..." }, { status: 404 })`

**왜**: 클라이언트(*프론트엔드*)가 *어떤 종류 에러인지* 알 수 있게. 미래 UI에서 *"존재하지 않는 페이지" 컴포넌트*로 분기 가능.

### 결정 2: 비즈니스 룰을 코드로 표현

**선택**: pending 셀러 직접 요청도 *404로 처리*.

```ts
if (!seller || seller.verificationStatus !== "approved") {
  return Response.json({ error: "Seller not found" }, { status: 404 })
}
```

**왜**: 
- 목록 API에서 *안 보이는 셀러*가 *상세 직접 접근으로는 보이면* 일관성 깨짐
- *"미승인이라 못 봐"* 알려주면 *셀러 존재 자체를 노출*
- 404로 *"없다고 침"*이 *깔끔하고 안전*

### 결정 3: 관계 데이터 깊이

- **Service 상세**: `sellerProfile → user`까지 (셀러 누군지 표시)
- **Seller 상세**: `user + services 목록`까지 (셀러의 서비스 다 보임)

**왜**: 진짜 상세 페이지에 *필요한 데이터를 한 번에*. *별도 API 호출 줄임*. 다만 *너무 깊어지면 응답 무거움* — reviews는 *별도 페이지네이션 API*로 미룸.

### 발견 1: 동적 라우트의 *컴파일 효율성*

검증 시 흥미로운 관찰:

| 케이스 | 시간 |
|---|---|
| 첫 호출 | 679ms / 503ms |
| 두 번째 호출 | 18ms / 9ms |

**Next.js의 lazy 컴파일**: 라우트를 *처음 만났을 때만* 컴파일. 그 이후 *모든 id 요청*에 *그 컴파일 결과 재사용*.

→ **`[id]` 동적 라우트 = 1번 컴파일 = 무한 id 처리**. 효율성의 핵심.

> 프로덕션 빌드(`npm run build`)에선 *미리 다 컴파일*해서 첫 호출도 빠름.

### 발견 2: Next.js 15+의 *params Promise* 변경

```ts
// 이전 (Next.js 14 이하)
context: { params: { id: string } }
const id = context.params.id

// 현재 (Next.js 15+) — 우리가 쓴 패턴
context: { params: Promise<{ id: string }> }
const { id } = await context.params
```

**핵심**: AGENTS.md의 *"NOT the Next.js you know"*가 *바로 이런 부분*. *params가 Promise로 감싸짐*. **이걸 놓치면 옛 패턴 → 경고 또는 에러**.

### 발견 3: HTTP status code = *비즈니스 의미 전달*

```ts
Response.json(data)                                              // 200 OK
Response.json({ error: "Invalid id" }, { status: 400 })         // 400 Bad Request
Response.json({ error: "Service not found" }, { status: 404 }) // 404 Not Found
```

미래 클라이언트 코드에서:
```ts
if (response.status === 404) showNotFoundPage()
if (response.status === 400) showInvalidInputError()
```

→ **status code가 *프론트엔드 분기의 입력*.** *비즈니스 의미가 *통신 규약 레벨*에서 표현*.

---

## 🎓 새로 배운 개념 (Day 6)

### 동적 라우트
- **`[id]` 폴더**: Next.js의 *동적 파라미터* 컨벤션
- **URL 패턴 = 핸들러 하나**: `/api/services/37`·`/api/services/100`·`/api/services/abc` 모두 같은 핸들러
- **`params.id`는 *문자열***: `parseInt`로 변환 필수
- **lazy 컴파일**: 첫 호출만 느림, 이후 빠름

### Prisma 단일 조회
- **`findUnique`**: 단일 객체 또는 `null` 반환
- **where는 @unique 필드만**: id, email 등
- **null 체크 패턴**: `if (!service) return 404`

### HTTP status code
- **200**: 성공 (디폴트)
- **400**: 잘못된 요청 (사용자 입력 오류)
- **404**: 리소스 없음 (또는 비즈니스 룰에 따라 *안 보임*)
- **status가 *프론트엔드 분기*의 입력**

### 보안·비즈니스 룰
- **3중 중첩 select**: 깊은 관계에도 *민감 필드 차단* 일관 적용
- **비즈니스 룰을 *404로 표현***: 미승인 셀러 *존재 자체 숨김*
- **불필요한 정보 노출 회피**: *"왜 안 보이는지" 알려주는 것도 정보*

### Next.js 15+ 신패턴
- **`params: Promise<...>`**: await 필수
- AGENTS.md 안내의 *"breaking changes"* 중 하나

---

## 📋 작성된 코드 (Day 6)

### `app/api/services/[id]/route.ts`
```ts
import { prisma } from "@/app/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const serviceId = parseInt(id, 10)

  if (isNaN(serviceId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      sellerProfile: {
        include: {
          user: {
            select: { id: true, name: true, profileImageUrl: true },
          },
        },
      },
    },
  })

  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 })
  }

  return Response.json(service)
}
```

### `app/api/sellers/[id]/route.ts`
```ts
import { prisma } from "@/app/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const sellerId = parseInt(id, 10)

  if (isNaN(sellerId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      user: {
        select: { id: true, name: true, profileImageUrl: true },
      },
      services: true,
    },
  })

  if (!seller || seller.verificationStatus !== "approved") {
    return Response.json({ error: "Seller not found" }, { status: 404 })
  }

  return Response.json(seller)
}
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/
│   ├── api/
│   │   ├── services/
│   │   │   ├── route.ts                  (Day 5 — 목록)
│   │   │   └── [id]/
│   │   │       └── route.ts              ★ Day 6 (상세)
│   │   └── sellers/
│   │       ├── route.ts                  (Day 5 — 목록)
│   │       └── [id]/
│   │           └── route.ts              ★ Day 6 (상세)
│   ├── lib/
│   │   └── prisma.ts                     (Day 5 — 싱글톤)
│   └── ... (Day 1 기본 페이지)
├── prisma/                               (Day 3~4)
└── ... (기본 Next.js 파일들)
```

---

## 🚀 Day 7 미리보기 — POST API (쓰기 패턴)

다음 작업 후보: **`POST /api/bookings` 또는 `POST /api/auth/signup`**.

### 예상 작업
| 단계 | 내용 |
|---|---|
| 1 | POST 핸들러 패턴 (`export async function POST()`) |
| 2 | 요청 본문 파싱 (`await request.json()`) |
| 3 | **Zod로 입력값 검증** — Phase 1A 핵심 도구 |
| 4 | Prisma `create` 호출 |
| 5 | 응답 status code (201 Created) |

### Day 5+6이 Day 7에 미치는 영향
- *Route Handler 기본 패턴* → POST에도 그대로
- *404 / 400 status* 학습 → POST에선 422 (Unprocessable Entity) 등 추가
- *보안 화이트리스트* → POST 응답에도 동일
- *Prisma create* → 시드에서 익숙

---

## 💡 Day 5+6 종합 회고 — *코드 적음, 학습 풍부*

| 작업 | 코드 줄 수 |
|---|---|
| Day 5 (services + sellers 목록 + 싱글톤) | ~30줄 |
| Day 6 (services/[id] + sellers/[id]) | ~50줄 |
| **총 ~80줄** | |

**80줄로 *시드 데이터 39개*가 *진짜 마켓플레이스 API*로 외부에 노출됨**. 코드 양보다 *학습 패턴*이 *훨씬 큼*:

| 학습 | Day |
|---|---|
| Route Handler 폴더·함수 컨벤션 | 5 |
| Prisma 싱글톤 패턴 | 5 |
| findMany + where + include + select | 5 |
| 보안 화이트리스트 | 5 |
| 동적 라우트 `[id]` | 6 |
| Next.js 15+ params Promise | 6 |
| findUnique + null 처리 | 6 |
| HTTP status code 의미 | 6 |
| 비즈니스 룰을 404로 표현 | 6 |
| Vertical Slice 사고 (학습 단위 분리) | 5~6 |

---

## ✅ 한 줄 요약

> **"동적 라우트(`[id]`) 두 파일 만들었더니 *진짜 마켓플레이스 상세 페이지의 데이터 다리*가 됐고, *Next.js 15+ 신패턴(params Promise) + 404 처리 + 비즈니스 룰 코드화*까지 한 흐름에 익혔다."**

- *5일 만에 *목록 + 상세 API*까지 완결* — Phase 1A 골격 절반 완료
- Day 7부터 *POST 패턴*과 *입력 검증(Zod)*으로 *쓰기 영역* 진입
- 미래 화면(`/sellers`, `/sellers/[id]`, `/services/[id]`)이 *호출할 API 다 준비됨*

---

*문서 끝.*

*Day 6 완료. Day 7 (POST API + Zod 입력 검증)으로 갈 준비 됨.*
