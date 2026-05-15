# Phase 1A — Day 5 완료 보고서

> 작성일: 2026-05-15
> 작업 범위: 첫 공개 API — `GET /api/services` + `GET /api/sellers`
> 학습자: 디자인 전공 / 코딩 5일째

---

## 🎯 큰 그림 — Day 5가 한 일

```
[Day 1] Next.js 환경 + 첫 화면
   ↓
[Day 2~3] Prisma + 7개 테이블 schema
   ↓
[Day 4] 빈 DB에 시드 데이터 39개 행 자동 생성
   ↓
[Day 5] 시드 데이터를 *외부에 공개*하는 첫 API 작성  ← 지금
   ↓
[지금] localhost:3000/api/services 호출 시 9개 데이터 JSON 응답
```

---

## 📅 Day 5 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | Prisma Client 싱글톤 (`app/lib/prisma.ts`) 생성 | dev hot reload 대비 |
| 2 | `GET /api/services` 작성 — 가장 단순한 첫 API | 9개 서비스 JSON 응답 |
| 3 | 개발 서버에서 검증 (`localhost:3000/api/services`) | 정상 동작 |
| 4 | `GET /api/sellers` 작성 — 필터 + join + 보안 패턴 | approved 셀러 3명만, passwordHash 차단 |
| 5 | 개발 서버에서 검증 (`localhost:3000/api/sellers`) | 정상 동작 |
| 6 | Git WIP commit + push | `65e8057` 커밋 |

---

## 🐛 Day 5 핵심 발견·논의

### 발견 1: "진짜 A 맞아?" — 추천을 *눈치 보고 흔들리지 말 것*

**상황**: 첫 API 시작점으로 A(services) 추천 → 사용자 "진짜 A 맞아?" → 내가 *논리 재검토 없이* B(sellers)로 *추천 뒤집음*.

**문제**: *논리에 기반한 변경*이 아니라 *사용자 의구심에 *답하려고* 동조*해버림. 지적 정직성 결여.

**해결**: 사용자가 "추천 뒤집지 말고 *논리적으로 설명*"하라고 함. *A의 진짜 강점*을 다시 정리 — 인지 부담 최소화, 단계적 학습(기본→응용), 시드 데이터 활용도, IA "없음"이 *지금 안 만들 이유 아님*.

**핵심 통찰**: **사용자 의구심 = *논리 재검토 신호*, *동조 신호가 아님*.** 추천 근거가 *진짜 정당*하면 *근거를 더 풀어*야지, *추천을 뒤집지 말 것*.

### 발견 2: "이렇게 가는게 베스트?" — *재검토 정직성*

**상황**: B(sellers) 결정사항 제시 후 사용자가 *다시 점검 요청*. 이번엔 *논리적으로 재검토*.

**재검토 결과**: 처음 추천이 *베스트 유지*. 다만 *내가 빠뜨린 짚을 점 2가지* 정직하게 인정:
- 정렬(`orderBy`) 결정 누락 — *지금은 생략 OK* (페이지네이션 도입 시 명시)
- SellerProfile 필드 노출 범위 — *현재 그대로 OK* (Service API와 일관성)

**핵심 통찰**: *재검토 정직성*. 추천이 베스트면 그대로 유지하되, *내가 놓친 게 있으면 정직하게 짚기*. *추천 유지 = 흔들림 없음, 정직 인정 = 학습 깊이*.

### 발견 3: URL 헷갈림 — *디버깅의 첫 단계*

**상황**: `/api/sellers` 호출했다고 했으나 *응답이 `/api/services`* 모양 → 사용자 "userId 안 보이는데?".

**원인**: URL 오타 또는 이전 탭 그대로. 결국 *Service 응답을 보면서 SellerProfile 필드 기대*.

**핵심 통찰**: **"내가 보고 있는 응답이 *진짜 내가 부른 URL의 응답*인가?"** — *풀스택 디버깅의 가장 흔한 시작점*. 캐시·오타·이전 탭 등으로 *다른 응답*을 보는 경우 빈번.

### 발견 4: "http 메서드 vs https?" — *층이 다른 개념*

**상황**: 사용자가 *"HTTP 메서드(GET) 쓰고 HTTPS 안 쓴 이유?"* 질문 → 두 개념의 *층이 헷갈림*.

**해결**: 명확한 분리.
- **HTTP 메서드**: GET/POST/PUT/DELETE — *동사 종류*
- **HTTPS**: HTTP + TLS 암호화 — *프로토콜*

같은 GET 핸들러가 *HTTP에서도 HTTPS에서도* 그대로 작동. *localhost는 HTTP, 배포는 Vercel이 자동 HTTPS*.

**핵심 통찰**: 비슷한 단어가 *서로 다른 층*에 속하는 경우가 많음. 헷갈리면 *층을 분리해서* 정리.

### 발견 5: "이 한 Flow에 중요한 부분?" — *학습 단위 응집도*

**상황**: B 확장 후 *동적 라우트(`[id]`)*를 *Day 5에 끼울지* 결정 → 사용자가 *"응용단계면 뒤로 미루는 게 낫지 않을까?"* 물음.

**해결**: 진짜 *Vertical Slice 사고*.
- *Day 5 Flow* = "Route Handler + 목록 조회 패턴 익히기" → A + B로 *이미 완결*
- *동적 라우트* = "상세 조회 패턴" → *다른 학습 단위*, Day 6의 *본론*

**핵심 통찰**: **각 Day는 *1~2개 핵심 패턴*만 깊이 익히기**. *얕게 많이*보다 *좁고 깊게*. 학습 단위 응집도가 *진짜 학습 깊이*의 비결.

---

## 🎓 새로 배운 개념 (Day 5)

### Next.js API 인프라
- **파일명 = 라우트 핸들러**: `app/api/.../route.ts` 파일이 *해당 URL의 API*
- **export 함수 이름 = HTTP 메서드**: `export async function GET()` → GET 요청 처리
- **폴더 구조 = URL 구조**: `app/api/services/[id]/route.ts` → `/api/services/[id]`
- **`Response.json(data)`**: Web 표준 응답 생성. 자동 Content-Type 헤더

### Prisma Client 싱글톤
- **왜 필요한가**: Next.js dev의 hot reload가 *PrismaClient를 매번 새로* 만들어 *연결 누적*
- **해결**: `globalThis`에 인스턴스 캐싱, dev 환경에서만
- **위치 컨벤션**: `app/lib/prisma.ts` (App Router 표준)
- **사용**: `import { prisma } from "@/app/lib/prisma"`

### Prisma 조회 패턴
- **`findMany()`**: 모든 행 조회. `create`의 짝꿍
- **`where: {...}`**: SQL의 WHERE 절. 필터 조건
- **`include: {...}`**: 관계 데이터 같이 가져오기 (= SQL JOIN)
- **`select: {...}`**: 필드 제한 — 화이트리스트 방식
- **`include` 안에 `select` 중첩**: 같이 가져오는 관계의 필드까지 제어

### 보안 첫 원칙
- **화이트리스트 vs 블랙리스트**: 노출할 필드를 *명시적으로 적기*. 미래에 schema에 *민감 필드 추가돼도 자동 차단*
- **passwordHash 절대 노출 금지**: OWASP Top 10의 "Sensitive Data Exposure"
- **이메일도 신중**: 사칭·스팸 위험. *진짜 필요한 곳에만*

### HTTP vs HTTPS
- **층 분리**: 메서드(동사) vs 프로토콜(통신 규약)
- **localhost는 HTTP**: 인증서 불필요, 개발 효율
- **배포는 HTTPS 자동**: Vercel 등 플랫폼이 처리

### 협업 패턴
- **추천이 정당하면 흔들리지 말 것**: 사용자 의구심 = 논리 재검토 신호
- **재검토 정직성**: 베스트면 유지 + 빠뜨린 점은 정직하게 인정
- **Vertical Slice 사고**: 각 Day마다 *1~2개 핵심 패턴* 좁고 깊게

---

## 📋 작성된 코드 (Day 5)

### `app/lib/prisma.ts` (싱글톤)
```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### `app/api/services/route.ts` (목록 API — 가장 단순)
```ts
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  const services = await prisma.service.findMany()
  return Response.json(services)
}
```

### `app/api/sellers/route.ts` (목록 API — 필터 + join + 보안)
```ts
import { prisma } from "@/app/lib/prisma"

export async function GET() {
  const sellers = await prisma.sellerProfile.findMany({
    where: { verificationStatus: "approved" },
    include: {
      user: {
        select: { id: true, name: true, profileImageUrl: true },
      },
    },
  })
  return Response.json(sellers)
}
```

---

## 🛠️ 자주 쓴 명령어 (Day 5)

```
# 개발 서버 켜기
cd stylefit
npm run dev

# 브라우저에서 API 호출
http://localhost:3000/api/services
http://localhost:3000/api/sellers
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/
│   ├── api/                       ★ Day 5 새로 생김
│   │   ├── services/
│   │   │   └── route.ts           ★
│   │   └── sellers/
│   │       └── route.ts           ★
│   ├── lib/                       ★ Day 5 새로 생김
│   │   └── prisma.ts              ★ (싱글톤)
│   ├── page.tsx                   (Day 1 기본)
│   └── layout.tsx                 (Day 1 기본)
├── prisma/
│   ├── schema.prisma              (Day 3 완성)
│   ├── seed.ts                    (Day 4)
│   └── dev.db                     (Day 4 시드 데이터)
└── ... (기본 Next.js 파일들)
```

---

## 🚀 Day 6 미리보기 — 동적 라우트 + 상세 API

다음 작업: **`GET /api/services/[id]` + `GET /api/sellers/[id]`**.

### 예상 작업
| 단계 | 내용 |
|---|---|
| 1 | Next.js 동적 라우트 패턴 (`[id]` 폴더) |
| 2 | URL 파라미터 받기 (`params.id`) |
| 3 | Prisma `findUnique` — 단일 행 조회 |
| 4 | 404 처리 — 존재하지 않는 id |
| 5 | 셀러 상세에 *그 셀러의 서비스 목록* 함께 (include) |

### Day 5가 Day 6에 미치는 영향
- *Route Handler 패턴* → 동적 라우트에 그대로 적용
- *`include` + `select`* → 셀러 상세에 services 함께 가져올 때 사용
- *보안 화이트리스트* → 상세 API에도 동일 원칙
- *Prisma 싱글톤* → 새 라우트에서도 그대로 import

---

## 💡 Day 5 협업 회고 — *코딩 5일째에 나아간 점*

| 발견 | 의미 |
|---|---|
| "진짜 A 맞아?" | *추천에 의문 제기 — 시니어 검증 패턴* |
| "이렇게 가는게 베스트?" | *결정 직전 재점검* |
| "http vs https?" | *유사 개념의 *층 분리* 사고* |
| "이 한 Flow에 중요?" | **Vertical Slice 사고** — 학습 단위 분리 |
| URL 헷갈림 정직 인정 | *디버깅 첫 단계 체득* |

→ **Day 4에서 시작된 *천천히 검증·왜 묻기* 패턴이 Day 5에 더 깊어짐.** 특히 *학습 단위 응집도 사고*가 새로 등장.

---

## ✅ 한 줄 요약

> **"파일 3개 (총 ~30줄) 만들었더니 *시드 데이터가 진짜 API로 외부에 노출됐고*, 그 과정에서 *추천 흔들지 말기·재검토 정직성·Vertical Slice* 협업 패턴을 익혔다."**

- *코드 적음, 학습 깊음* — Day 5의 본질
- 미래 화면 만들 때 *API 다리*가 이미 준비됨
- Day 6의 동적 라우트도 *같은 패턴*에서 자라남

---

*문서 끝.*

*Day 5 완료. Day 6 (동적 라우트 + 상세 API)으로 이어짐.*
