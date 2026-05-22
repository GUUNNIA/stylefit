# Phase 1A — Day 29~31 완료 보고서 (묶음)

> 작성일: 2026-05-22
> 작업 범위: 활동 이력 페이지네이션 (Day 29) → Booking 메시지 도메인 (Day 30) → 메시지 실시간 진화 (Day 31)
> 학습자: 디자인 전공 / 코딩 29~31일째

---

## 🎯 큰 그림 — 묶음 2 가 한 일

```
[Day 26~28] 다크 + 디자인 시스템 (큰 디자인 작업)
   ↓
[Day 29] 활동 이력 페이지네이션 — audit-log 두 번째 사용처, 1 파일  ← 호흡 조절
   ↓
[Day 30] Booking 메시지 도메인 — 새 도메인 첫 진입, Client Component 첫 도입, 카톡식 UI  ← 큰 도약
   ↓
[Day 31] 메시지 실시간 진화 — 자동 스크롤 + visibility 폴링 + isRead 뱃지 + PagePoller 일반화  ← 완성도 ↑
   ↓
[Day 32+ 예정] 환경설정 / 진짜 실시간 (SSE) / 페이지네이션 추출 / 디자인 2차
```

**세 Day 의 *호흡 곡선*** — Day 29 *가벼움* (1 파일, 호흡 조절) → Day 30 *큰 도약* (새 도메인 + 첫 Client) → Day 31 *진화 패키지* (4 작업 + 큰 학습). Day 28 의 30 파일 디자인 직후 *가볍게 시작 → 점점 무거워지는 자연 흐름*.

**메시지 도메인의 *11 Day 뒤늦은 활성화*** — `MessageThread + Message` 모델은 *기획 초반* 부터 schema 에 있었으나 *액션/화면 미구현* 으로 20+ Day 휴면. Day 30 이 *발견 + 활성화* 의 시작.

**가장 큰 학습 사건**: Day 31 의 *Next.js 16+ render 중 mutation 차단* — anti-pattern 우회 시도가 *프레임워크 차단* 으로 *정도(正道) 강제*. *Server Action + Client 마운트 패턴* 의 진정한 의미 학습.

---

## 📅 Day 29 작업 요약 — 활동 이력 페이지네이션 (호흡 조절)

### 작업 단계 (5)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 사용자 순서 합의 — "1번 → 3번, 2번은 제일 나중에" | Day 30 = 시간 협상, 디자인 2차 = 마지막 |
| 1 | 사용처 선택 — `/services` vs `/seller/activity-log` → audit-log 와 *동형* 선택 | *복붙 패턴 검증* 본질 |
| 2 | PAGE_SIZE = 20 (audit-log 동일, *일관 정책*) | 시드 적어 nav 미렌더 OK |
| 3 | 복붙 + 차이점 적용 — searchParams 타입, page 파싱, Promise.all, displayPage, nav 마크업 | *동일 vs 다름* 명시 |
| 4 | 시각 검증 — 자체 시드 2건 (nav 미렌더 정상) + audit-log 25건에서 동형 마크업 확인 | *검증 전이* |

---

## 📅 Day 30 작업 요약 — Booking 메시지 도메인 (새 도메인 첫 진입)

### 작업 단계 (10)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 청사진 4 결정 — 예약 후만 + 단일 Message + 셀러/구매자만 + Server 새로고침 | 사용자 OK |
| 1 | **schema 발견** — MessageThread + Message *이미 존재*. relation 다 연결됨 | *기획 초반 의도 발견* |
| 2 | 청사진 vs schema 정반대 → C 옵션 (UX 만 제약, 모델 그대로) | *기존 작업 버리지 않음* |
| 3 | 인덱스 좁힘 — `(buyerId, sellerProfileId)` YAGNI → `Message (threadId, createdAt)` 하나만 | *현재 쿼리만 인덱스* |
| 4 | MessageThread 컴포넌트 — 카톡식 말풍선 + form action 입력 | *threadId 없을 수 있음* → bookingId 만 |
| 5 | sendMessage 헬퍼 + 양쪽 actions — *책임 분리* (비즈니스 vs 권한) | *처음부터 헬퍼 추출* |
| 6 | 양쪽 페이지 — `findFirst with 권한 조건` (DB 단 권한 필터) | findUnique PK 제약 회피 |
| 7 | 목록 카드 [메시지 →] 링크 — 모든 상태 (cancelled 도) | *사후 협의 가치* |
| 8 | **실시간 동기화 누락 발견** (사용자 체험) — 청사진 약점 *예측대로 노출* | 폴링 도입 결정 |
| 9 | **Client Component 첫 도입** — MessagesPoller (5초 setInterval + router.refresh) | *책임 분리*: Poller=client, Thread=server |
| 10 | UI 미세 조정 — 버튼 위치 → 멀티라인 거부 → 버튼 사이즈 → 색 위계 | *디자이너 협업* |

---

## 📅 Day 31 작업 요약 — 메시지 실시간 진화 패키지 (큰 학습)

### 작업 단계 (7)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 1 | 자동 스크롤 — AutoScrollAnchor (Client 두 번째) | useRef + scrollIntoView |
| 2 | visibility 폴링 — `document.visibilityState` + `visibilitychange` | 탭 가시성 추적 |
| 3 | isRead 뱃지 — Prisma `_count with where` (filtered relation count) | Prisma 5+ 정식 |
| 4 | **render 중 mutation 차단 발견** — `revalidatePath used during render which is unsupported` | *우회 불가, 정도 강제* |
| 5 | 재설계 — Server Action + Client 마운트 (MarkAsReadOnMount) | *Server Action ref 를 props 로* |
| 6 | **PagePoller 일반화** — MessagesPoller 4 사용처 도달 → git mv rename | extraction threshold 도달 |
| 7 | 메시지 영역 고정 + scrollbar 디자인 — max-h-[60vh] + .scrollbar-thin 유틸 | 의미 토큰 재활용 |

---

## 🐛 묶음 2 의 핵심 발견·논의

### 발견 1: ***두 번째 사용처의 본질*** — 차이점 발견이 학습 본체

Day 27 의 audit-log 페이지네이션을 Day 29 에 *복붙* — 같은 패턴이 *진짜 다른 데서도 통하는지* 검증.

**audit-log 와 activity-log 의 *동일한 것***:
- PAGE_SIZE 상수
- Promise.all([findMany, count]) 병렬
- totalPages = Math.max(1, ceil) 계산
- displayPage 클램프 (얕은 fix)
- nav 마크업 100% (이전/숫자/다음 + range 표시)

**발견된 *차이점 (3)***:

```ts
// audit-log — 두 축 보존 (action + targetType)
const where = {
  ...(action ? { action } : {}),
  ...(targetType ? { targetType } : {}),
}

// activity-log — 한 축 보존 (activity 만) + 본인 격리 spread
const where = {
  sellerProfileId: sellerProfile.id,   // ← 항상 들어감 (필터 무관)
  ...(activity ? { activity } : {}),   // ← 동적
}
```

```ts
// audit-log — buildUrl 인자 3개
buildUrl("/admin/audit-log", { action, targetType, page })

// activity-log — buildUrl 인자 2개
buildUrl("/seller/activity-log", { activity, page })
```

**두 번째 사용처의 *가치***:
- *복붙 = 빠른 결과*
- *차이점 발견 = 진짜 학습*
- *세 번째 사용처 = 추출 (extraction threshold)*

Day 19 의 `feedback-extraction-threshold` 정신 — 두 번째는 *복붙 OK*, 추출은 *세 번째에서*. 학습 본체는 *차이점이 어디서 발생하는지* 인식.

**원칙**: "*두 번째 사용처 = 차이점 발견 단계*. 동일 마크업 + 다른 변수가 *추출 후보 패턴*. *세 번째 도달 시 비교 가능 상태에서 추출* 이 자연. *복붙이 곧 학습 X, 차이점 인식이 학습*."

---

### 발견 2: ***검증 전이 패턴*** — 시드 빈약 시 동형 페어로 신뢰

activity-log 본인 시드 2건 → nav 미렌더 (`totalPages > 1` 조건). *자체 화면으로 검증 불가* 상황.

**검증 전략 — 동형 페어**:
- audit-log 25건 (admin 자기) → nav 마크업 정상 확인 (← 이전 disabled / [1] 활성 / [2] 라인 / 다음 → 활성)
- *마크업 동일성* 이 근거 → activity-log 도 동일 동작 확신

**왜 *동형 페어* 신뢰 가능**:
- 두 페이지의 nav 코드 = *100% 동일* (변수만 다름)
- nav 동작은 *totalPages > 1 분기 + 마크업 + buildUrl* 결정
- *변수 차이 (filter 축)* 는 nav 동작과 무관
- 한 페이지 검증 = 마크업 동작 검증 = 다른 페이지 *전이*

**대조 — 자체 검증 강제**:
- 시드 보강 (activity-log 20+ 건 만들기) — *오버스펙*, *학습 부담 ↑*
- 실 데이터 쌓기 기다림 — *비현실적*

**원칙**: "*동형 페어 검증 전이* = 시드 빈약 환경의 정직한 대응. *마크업 동일성* 이 *검증 전이의 근거*. 학습 단계 시드의 한계 인정 + *간접 검증의 가치*. *모든 화면을 자체 검증* 강박 회피."

---

### 발견 3: ***청사진 무력화 + 적응*** — 기존 schema 와 정반대 발견

Day 30 의 *큰 사건* — 시간 협상 도메인 설계 시작 직후 *MessageThread + Message 가 schema 에 이미 존재* 발견. 사용자: "기획 초반부터 DB 짤 때 이미 있던 것 같은데".

**기존 schema 결정 (과거 사용자 의도)**:
- `MessageThread.relatedBookingId @unique` 이지만 *nullable* → 예약 전 메시지 *허용*
- `Message` 가 `MessageThread` 와 분리 → 1:1 (Booking : Thread) 이지만 메타 (lastMessageAt, isRead) 저장
- `buyerId + sellerProfileId` 직접 참조 → Booking 없어도 thread 가능

**오늘 청사진 (4 결정)** vs *정반대*:
- 청사진 = 예약 후만 + 단일 Message + 셀러/구매자만 + Server 새로고침
- schema = 예약 전 가능 + Thread/Message 분리 + 더 유연

**세 옵션**:
- A. schema 단순화 (relatedBookingId NOT NULL, Message 합치기) — *기존 결정 무시 + 마이그레이션 부담*
- B. 청사진 변경 (schema 따라가기) — *유연성 ↑, 학습 부담 ↑*
- C. **모델 그대로 + UX 만 제약** (relatedBookingId 항상 채움) — *기존 존중 + 적응*

**C 채택 이유**:
- *가장 보수적* — 마이그레이션 0, 기존 데이터 손실 0
- *기존 작업 버리지 않음* 정신 — 과거 사용자 결정 = *미래 확장 의도*
- *UX 만 제약* — 학습 단계 단순화 + 미래 확장 여지 보존

**원칙**: "*청사진과 기존 코드 충돌 시 = 기존 의도 존중 + UX 만 제약* 이 디폴트. *마이그레이션 부담 vs 적응 부담* 트레이드오프 — 학습 단계는 *적응 우선*. *기존 작업 버리지 않음* = 학습 단계의 *보수 정신*."

---

### 발견 4: ***Client Component 첫 도입*** — `'use client'` 의 의미

Day 30 이 *Client Component 첫 도입*. Day 13~29 까지 *모두 Server Component*.

```tsx
// app/components/MessagesPoller.tsx (Day 30, 후에 PagePoller 로 일반화)
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function MessagesPoller({ intervalMs = 5000 }) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs)
    return () => clearInterval(id)
  }, [router, intervalMs])

  return null  // 렌더 출력 X, 부수 효과만
}
```

**`'use client'` 의 *진짜 의미***:
- *서버 + 클라이언트* 둘 다 실행 (NOT *클라이언트만*)
- 초기 HTML = 서버에서 렌더 (SSR)
- hydration 후 = 클라이언트에서 *interactive*
- useEffect / useState / 브라우저 API 접근 가능

**Server Component 와 *책임 분리***:
- Server: 데이터 fetch + 마크업
- Client: 부수 효과 (setInterval, DOM 접근, 사용자 입력 등)

**`MessageThread` 는 Server 유지**:
- form action 만 받고 server action 호출
- *클라이언트 인터랙티비티 불필요* → Server 로 충분
- *번들 크기 ↑ 회피*

**Poller 패턴의 *책임 분리***:
- *전체 페이지* = Server (데이터 fetch + 마크업)
- *Poller* = Client (setInterval 부수 효과)
- Poller 가 *router.refresh()* 호출 → *Server fetch 재실행*
- *클라이언트 인터랙티비티 + 서버 데이터 갱신* 의 다리

**원칙**: "*Client Component = 부수 효과 + 인터랙티비티 한정*. Server Component 와 *책임 분리* 가 *번들 최소화 + server-first 정신*. *얇은 Client 래퍼* 가 *interaction 영역 격리*. router.refresh 가 *Client → Server fetch 재실행* 의 다리."

---

### 발견 5: ***`router.refresh()` vs `revalidatePath`*** — 두 갱신 메커니즘

Next.js App Router 의 *두 갱신 메커니즘*:

```ts
// Server Action 안
revalidatePath("/bookings")  // 서버 측 캐시 무효화
```

```tsx
// Client Component 안
const router = useRouter()
router.refresh()  // 클라이언트 측 트리거
```

**비교**:

| 도구 | 어디서 | 무엇 |
|---|---|---|
| `revalidatePath` | Server Action / Route Handler | *서버 측 Router Cache + Data Cache 무효화* |
| `router.refresh()` | Client Component | *현재 페이지 server fetch 재실행 + 클라이언트 리렌더* |

**둘 다 *server fetch 재실행*** — 결과는 비슷하지만 *호출 시점/위치* 다름:
- revalidatePath = *mutation 후* 캐시 무효화 (다음 fetch 가 fresh)
- router.refresh = *언제든* 트리거 (Poller 의 setInterval 처럼)

**`router.refresh()` 의 *클라이언트 상태 보존***:
- 브라우저 새로고침 (F5) = *클라이언트 상태 초기화* (form 입력, 스크롤 위치)
- `router.refresh()` = *클라이언트 상태 보존* + server fetch 재실행
- 메시지 입력 중에 폴링 발생해도 *입력 값 유지*

**둘 다 안 됨 — 우리 시도 (Day 31 차단)**:
- Server Component *render 중* `revalidatePath` 호출 → Next.js 16+ 차단
- "언제 캐시 무효화될지 모호 → 의미 일관성 깨짐"

**원칙**: "*revalidatePath = 서버 mutation 후 캐시 무효화*, *router.refresh = 클라이언트에서 server fetch 재실행*. 둘은 *호출 위치 + 시점* 다르지만 *결과는 비슷*. 클라이언트 상태 보존이 *router.refresh 의 보너스*. Server *render 중* 호출은 *프레임워크 차단*."

---

### 발견 6: ***Interactive transaction 진화*** — upsert 결과 재사용

Day 18/20/21 의 `$transaction` 진화:
- Day 18: *배열 형태* (`[op1, op2, op3]`) — 각 op 독립
- Day 20/21: *callback 형태* (`async (tx) => { ... }`) — step 결과 다음 step 에 사용

Day 30 의 *발전형* — upsert + create + update *세 step 의 결과 의존*:

```ts
// app/lib/messages.ts
await prisma.$transaction(async (tx) => {
  // step 1 — upsert
  const thread = await tx.messageThread.upsert({
    where: { relatedBookingId: bookingId },
    create: {
      buyerId: booking.buyerId,
      sellerProfileId: booking.sellerProfileId,
      relatedBookingId: bookingId,
    },
    update: {},  // 존재하면 아무것도 안 함
  })

  // step 2 — create (thread.id 사용)
  await tx.message.create({
    data: {
      threadId: thread.id,   // ← step 1 결과 재사용
      senderId: senderUserId,
      content: cleanContent,
    },
  })

  // step 3 — update (thread.id 또 사용)
  await tx.messageThread.update({
    where: { id: thread.id },  // ← step 1 결과 또 재사용
    data: { lastMessageAt: new Date() },
  })
})
```

**upsert 의 *race safety***:
- `relatedBookingId @unique` 보장 → DB 레벨 race 안전
- 두 요청 동시 시 *DB 가 직렬화*
- *중복 thread 생성 0%*

**Day 21 confirmBookingAction 과 *진화 비교***:
- Day 21: read → update → log (3 step, 모두 *참조 의존*)
- Day 30: upsert → create → update (3 step, *upsert 결과를 두 번 재사용*)
- Day 30 = *공유 결과를 다중 step 에서 재사용* 의 패턴

**원칙**: "*Interactive transaction* = step 간 결과 의존 표현. *upsert + create + update* = *공유 결과 재사용 패턴*. `@unique` 가 *race safety* 보장 → upsert 가 *race-safe find-or-create*. 트랜잭션 = *원자성 + 의존성 표현* 두 가치."

---

### 발견 7: ***findFirst with 권한 조건*** — DB 단 권한 필터

권한 검증의 *두 패턴*:

```ts
// Pattern A — 분리 (anti-pattern? 또는 case-by-case)
const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
if (!booking) notFound()
if (booking.buyerId !== session.userId) notFound()  // 권한 별도 검증

// Pattern B — 통합 (Day 30 채택)
const booking = await prisma.booking.findFirst({
  where: { id: bookingId, buyerId: session.userId },  // ← 권한 + 존재 한 쿼리
})
if (!booking) notFound()  // 권한 없음 OR 존재 안 함 → 둘 다 같은 응답
```

**B 패턴의 *세 장점***:
- *DB 단 필터* — 권한 조건 *SQL 단에서* 적용
- *권한 vs 존재 안 함* 가림 — 정보 노출 방지 (보안)
- *한 쿼리* — 두 쿼리 분리 X

**왜 `findFirst` (not `findUnique`)**:
- `findUnique` = PK / unique 컬럼 *하나만* (id 단일)
- `findFirst` = *조건 매칭 첫 결과* — 다중 조건 가능
- 권한 + 존재 동시 검증 시 `findFirst` 필요

**NaN bookingId 자연 처리** — Number(undefined) = NaN 으로 들어와도 매칭 실패 → null 반환 → notFound. *별도 가드 불필요*.

**Day 24 의 `createReviewAction` 4 조건 와 *결의 같음***:
- where: id + buyerId + status + review null = 4 조건
- *액션의 전제 한눈에*
- *조건 갯수 = 액션의 복잡도 시각화*

**원칙**: "*findFirst with 권한 조건* = *DB 단 권한 필터* + *권한/존재 가림*. *한 쿼리 다중 책임* 의 표준 패턴. `findFirst` 가 `findUnique` 의 다중 조건 확장. *권한 vs 존재* 같은 응답 = *보안 + UX 일관성*."

---

### 발견 8: ***책임 분리 — 헬퍼 vs Server Action*** — 처음부터 추출

Day 30 의 *2 사용처 (구매자/셀러) 인데 처음부터 헬퍼 추출*:

```
app/lib/messages.ts                      ← 비즈니스 로직 (트랜잭션)
app/bookings/[id]/messages/actions.ts    ← 구매자 권한 검증
app/seller/bookings/[id]/messages/actions.ts ← 셀러 권한 검증
```

```ts
// app/lib/messages.ts
export async function sendMessage({ bookingId, senderUserId, content }) {
  // 비즈니스 로직: trim + slice + booking 검증 + 트랜잭션
}

// app/bookings/[id]/messages/actions.ts (구매자)
export async function sendMessageAction(formData: FormData) {
  const session = await verifySession()
  if (!session) redirect("/login")
  
  // 권한 — 본인 booking 인지
  const booking = await prisma.booking.findUnique({ where: { id }, select: { buyerId: true } })
  if (!booking || booking.buyerId !== session.userId) notFound()
  
  await sendMessage({ bookingId, senderUserId: session.userId, content })  // ← 헬퍼 호출
  revalidatePath(`/bookings/${bookingId}/messages`)
}

// app/seller/bookings/[id]/messages/actions.ts (셀러) — 대칭
```

**왜 *처음부터 헬퍼* (extraction threshold 위배 보임)**:
- *2 사용처* = 추출 시점 *X* (Day 19 정신)
- 그러나 *비즈니스 로직 자체* 가 *트랜잭션 일관성* 위험 영역
- *권한 분기마다 다른 트랜잭션* = *동기화 어려움 + 버그 위험*
- *비즈니스 로직 = 한 곳* 이 *트랜잭션 안전성* 의 본질

**extraction threshold 의 *예외 인식***:
- *UI 컴포넌트 / 헬퍼 함수* = 3 사용처 추출 임계
- *비즈니스 로직 (트랜잭션, 권한, 멱등성)* = *처음부터 한 곳*
- *책임의 성격* 따라 임계 다름

**원칙**: "*비즈니스 로직 = 처음부터 헬퍼 추출* — extraction threshold 의 예외. *트랜잭션 일관성 = 단일 진입점 필수*. *권한 검증* 만 페이지별 분기 (사용자 컨텍스트 다름). *책임의 성격이 추출 임계 결정*."

---

### 발견 9: ***Single text input = Enter 자동 submit*** — 멀티라인 거부의 보너스

Day 30 의 *카톡식 메시지 입력* UI 결정:

```tsx
<form action={action}>
  <input type="hidden" name="bookingId" value={bookingId} />
  <input
    type="text"   // ← textarea 아님!
    name="content"
    required
    maxLength={1000}
    placeholder="메시지를 입력하세요..."
  />
  <button type="submit">전송</button>
</form>
```

**Enter 키 동작 비교**:

| 입력 요소 | Enter 동작 |
|---|---|
| `<input type="text">` (form 안) | *자동 submit* (HTML 표준) |
| `<textarea>` | *줄바꿈* (form submit 안 됨) |
| `<input>` (form 밖) | 동작 없음 |

**우리 패턴의 *보너스***:
- *멀티라인 거부 결정* (학습 단계 단순화) → textarea 안 씀 → input
- input + form = *Enter 자동 submit* (HTML 표준)
- *Client Component 없이* 카톡식 UX 완성
- JavaScript onKeyDown 핸들러 불필요

**대안 — textarea + Client + onKeyDown**:
```tsx
"use client"
<textarea onKeyDown={(e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    formRef.current?.requestSubmit()
  }
}} />
```
- *복잡* + *Client Component 강제* + *번들 ↑*
- 학습 단계 *오버스펙*

**디자이너의 *형태 결정이 동작 결정*** — *멀티라인 거부* 라는 *UX 단순화 결정* 이 *기술 선택 (input)* + *동작 (Enter submit)* 까지 *자연 결정*.

**원칙**: "*HTML 표준 동작 활용* = *Client Component 회피* 가능. *형태 결정이 동작 결정* — UX 단순화 (멀티라인 거부) 가 *Enter 자동 submit* 보너스. *프레임워크 강제 X, 표준 활용* 의 패턴."

---

### 발견 10: ***카톡식 UI 위계 시스템*** — 액션 vs 메시지 강도 분리

Day 30 메시지 UI 의 *디자인 위계 결정*:

```tsx
{/* 전송 버튼 — primary 액션 */}
<button className="bg-accent-bg text-white dark:text-zinc-900">전송</button>

{/* 내 메시지 — 액션 아닌 말 자체 */}
<div className="bg-accent/15 text-foreground">내가 보낸 메시지</div>

{/* 상대 메시지 — 중성 */}
<div className="bg-surface-muted text-foreground">상대가 보낸 메시지</div>
```

**위계 두 축**:

| | 색조 | 강도 |
|---|---|---|
| 전송 버튼 | 인디고 | *채움* (100%) |
| 내 메시지 | 인디고 | *알파 15%* |
| 상대 메시지 | 회색 | *알파 surface* |

**축 1 — 색조 (내 vs 상대)**:
- 내 = 인디고 (브랜드 톤)
- 상대 = 회색 (중성)

**축 2 — 강도 (액션 vs 메시지)**:
- 액션 (전송) = 채움 (100% 강조)
- 메시지 (말) = 알파 (옅음, 액션보다 *덜 강조*)

**왜 *액션 > 메시지* 강도**:
- *사용자 행동 유도* = 액션 (전송 버튼) 이 *가장 눈에 띔*
- 메시지 = *읽기 대상* (액션 아님) → 옅게
- *시각 위계 = 행동 의도 가이드*

**Day 28 의 인디고 통일 + 형태 위계 와 *결의 같음***:
- Day 28: primary/secondary/tertiary 위계
- Day 30: 액션/메시지 위계
- 모두 *색조 vs 강도* 의 두 축 활용

**디자이너의 *대화창 UI 직관***:
- 카톡 = 내 (노란) / 상대 (흰)
- 우리 = 내 (인디고 알파) / 상대 (회색)
- *색조 분리* 가 *발신자 시각 식별* 의 표준

**원칙**: "*대화 UI 위계 = 색조 + 강도 두 축*. *색조 = 발신자 식별 (내/상대)*, *강도 = 행동 유도 (액션/메시지)*. *액션 > 메시지* 강도가 *시각 위계의 행동 의도 가이드*. 디자이너 직관 + 디자인 시스템 = 자연 적용."

---

### 발견 11: ***Next.js 16+ render 중 mutation 차단*** — 큰 학습 사건

Day 31 의 *큰 사건* — 박서연 메시지 클릭 → 런타임 에러:

```
Route /bookings/[id]/messages used 'revalidatePath /bookings'
during render which is unsupported.
```

**상황**:
- 메시지 페이지 마운트 시 *상대방 메시지 읽음 처리* 필요
- *Server Component 안* 에서 `prisma.message.updateMany` + `revalidatePath` 시도
- 사용자 OK 받음 ("anti-pattern 이지만 학습 단계 OK")
- **Next.js 16+ 가 *명시적으로 차단*** — *우회 불가*

**왜 차단**:
- Server Component render = *데이터 fetch 단계*
- 그 안에서 mutation = *언제 캐시 무효화될지 모호*
- *의미 일관성 깨짐* — 같은 페이지 안의 fetch 가 *fresh 인지 stale 인지 불명*
- Next.js = *프레임워크 수준* 에서 보호

**우회 시도 → 모두 차단**:
- `await` 없이 fire-and-forget → 여전히 차단
- 다른 위치 시도 (layout, page 함수 내부) → 동일

**해결 — Server Action + Client 마운트 패턴**:

```tsx
// Server Component 페이지
<MarkAsReadOnMount bookingId={booking.id} action={markAsReadAction} />
```

```tsx
// Client Component
"use client"
export default function MarkAsReadOnMount({ bookingId, action }) {
  useEffect(() => {
    action(bookingId)  // ← 마운트 후 호출 (render 밖)
  }, [bookingId, action])
  return null
}
```

```ts
// Server Action
"use server"
export async function markAsReadAction(bookingId: number) {
  // 권한 검증 + updateMany + revalidatePath ← render 밖에서 OK
}
```

**학습의 *역설***:
- *anti-pattern 우회 시도* → *프레임워크 차단* 으로 *정도(正道) 강제*
- *학습 단계 OK* 라는 사용자 의도가 *현실 제약* 으로 *정확한 패턴 강제 학습*
- *우회 실패 = 학습 가속*

**원칙**: "*Server Component render 중 mutation = unsupported*. *anti-pattern 이 아니라 작동 안 함*. *Server Action + Client 마운트* 패턴이 정도. 우회 불가 = *프레임워크의 의미적 보호*. *anti-pattern 시도 → 차단 → 정도 학습* 의 자연 흐름."

---

### 발견 12: ***Server Action ref 를 props 로 Client 전달*** — Next.js 표준 패턴

`MarkAsReadOnMount` 의 *Server Action ref 받기*:

```tsx
// Server Component 페이지
import { markAsReadAction } from "./actions"

<MarkAsReadOnMount
  bookingId={booking.id}
  action={markAsReadAction}   // ← Server Action 함수 자체를 prop 으로
/>
```

```tsx
// Client Component
"use client"
export default function MarkAsReadOnMount({
  bookingId,
  action,
}: {
  bookingId: number
  action: (bookingId: number) => Promise<void>  // ← 함수 타입
}) {
  useEffect(() => {
    action(bookingId)  // ← Client 가 직접 호출
  }, [bookingId, action])
  return null
}
```

**Next.js 의 *자동 직렬화***:
- `"use server"` 함수는 *어디서든 호출 가능* (Server / Client 양쪽)
- Client 가 호출 시 = *자동 HTTP POST* (RPC)
- 함수 ref = *직렬화 가능 식별자*
- *props 로 전달 = 정상 패턴*

**대조 — 직접 import** (Client 에서):
```tsx
"use client"
import { markAsReadAction } from "./actions"  // ← OK 도 함

useEffect(() => {
  markAsReadAction(bookingId)
}, [bookingId])
```
- *작동* 하지만 *컴포넌트가 특정 액션에 결합*
- *재사용 어려움* — 다른 액션 받기 X

**Props 패턴의 *재사용성***:
- 같은 `MarkAsReadOnMount` 컴포넌트가 *구매자 액션 / 셀러 액션* 모두 받음
- *컴포넌트 = 일반화*, *액션 = 페이지별*
- Day 30 의 *책임 분리* 정신 일관 (헬퍼 vs Server Action)

**원칙**: "*Server Action 함수 = 직렬화 가능 식별자*. *Client 에 props 로 전달 = 정상 패턴*. 자동 RPC 처리. *컴포넌트 일반화 + 액션 페이지별* = *재사용 + 격리* 두 가치. *Next.js 의 server/client 다리* 자연 활용."

---

### 발견 13: ***`scrollIntoView` 자동 컨테이너 인식*** — Day 31 자동 스크롤

`AutoScrollAnchor` 의 핵심:

```tsx
"use client"
import { useEffect, useRef } from "react"

export default function AutoScrollAnchor({ trigger }: { trigger: number }) {
  const ref = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [trigger])

  return <div ref={ref} />
}
```

**`scrollIntoView` 의 *자동 컨테이너 인식***:
- *가장 가까운 스크롤 가능 ancestor* 자동 사용
- 페이지 자체가 스크롤 → *페이지 스크롤*
- `overflow-y-auto` 컨테이너 안 → *컨테이너 스크롤*
- *코드 변경 없이* 환경 변화 흡수

**Day 31 의 *환경 변화*** — 메시지 영역 `max-h-[60vh] + overflow-y-auto` 추가:
- 변경 전: 페이지 스크롤
- 변경 후: 컨테이너 스크롤
- AutoScrollAnchor 는 *코드 변경 없이* 컨테이너 스크롤로 자연 전환

**`trigger=messages.length` 의 *재발동***:
- messages 배열 길이 변경 → useEffect 재실행 → scrollIntoView 호출
- *새 메시지 추가 시 자동 스크롤*

**`useRef` vs `useState`**:
- DOM 접근 = `useRef` (재렌더 트리거 X)
- 값 변경 = `useState` (재렌더 트리거)
- 여기는 DOM 접근 → ref

**원칙**: "*scrollIntoView 자동 컨테이너 인식* = *환경 변화 흡수* 의 강점. *trigger prop = 의존성 변화 시 재발동*. `useRef` = DOM 접근 (재렌더 X), `useState` = 값 변경 (재렌더). 브라우저 API 활용이 *Client Component 의 본질*."

---

### 발견 14: ***visibility API 폴링 최적화*** — 탭 가시성 추적

Day 31 의 *PagePoller 진화*:

```tsx
useEffect(() => {
  let intervalId: ReturnType<typeof setInterval> | null = null

  const start = () => {
    if (intervalId) return
    intervalId = setInterval(() => router.refresh(), intervalMs)
  }
  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      router.refresh()  // ← 돌아오면 즉시 동기화
      start()           // ← 폴링 재시작
    } else {
      stop()            // ← 가려지면 중단
    }
  }

  if (document.visibilityState === "visible") start()
  document.addEventListener("visibilitychange", handleVisibilityChange)

  return () => {
    stop()
    document.removeEventListener("visibilitychange", handleVisibilityChange)
  }
}, [router, intervalMs])
```

**`visibility API` 의 *두 신호***:
- `document.visibilityState` = `"visible"` | `"hidden"` (현재 상태)
- `visibilitychange` 이벤트 = 상태 변경 트리거

**최적화 효과**:
- 탭 가려짐 → 폴링 중단 → *브라우저 리소스 + 서버 부하 절약*
- 탭 돌아옴 → *즉시 새로고침* + 폴링 재시작 → *가려진 사이 변경사항 즉시 동기화*

**브라우저 자체 최적화 (background tab throttling)**:
- 브라우저가 *백그라운드 탭 setInterval 강제 throttle* (1초 이상 강제)
- 우리 명시 중단 = *완전 0 호출* (브라우저 throttle 보다 적극적)
- *학습 단계 정직성* — 브라우저 자동 처리 알면서도 *명시 제어* 가 *명확*

**광범위 활용 영역**:
- 폴링 / 백그라운드 작업 / 알림 / 분석 / 자동 저장 등

**원칙**: "*visibility API = 탭 가시성 추적의 표준*. *백그라운드 폴링 중단 = 리소스 절약*. *돌아옴 시 즉시 동기화 = UX*. 브라우저 자체 최적화 (throttle) 있지만 *명시 제어* 가 *학습 + 정확성*. 광범위 활용 패턴."

---

### 발견 15: ***PagePoller 일반화 = extraction threshold 도달*** — git mv 패턴

Day 30 의 `MessagesPoller` 가 Day 31 에 *4 사용처 도달* → 일반화:

**사용처 누적**:
- Day 30: 메시지 페이지 2곳 (구매자 + 셀러)
- Day 31: Booking 목록 2곳 (구매자 + 셀러) — *isRead 뱃지 실시간 갱신*
- **총 4 사용처** → extraction threshold (3) *초과*

**리팩토링**:
- 이름: `MessagesPoller` → `PagePoller` (책임이 *메시지 한정 X*)
- 코드: 메시지 관련 코멘트 제거 + 일반화
- 의미: *router.refresh 폴링* 자체가 *어떤 페이지든 활용 가능*

**git mv 로 rename** (history 보존):
```bash
git mv app/components/MessagesPoller.tsx app/components/PagePoller.tsx
# 내용 95% 이상 동일 → git 이 *rename 인식*
```

**왜 *git mv* 중요**:
- 단순 delete + create = *history 분리*
- git mv = *history 연결* (`git log --follow` 추적)
- 학습 단계 = *학습 추적 보존* 가치

**Day 23 ReasonForm 추출 패턴과 *결의 같음***:
- Day 23: 폼 통합 + 새 컴포넌트
- Day 31: 컴포넌트 rename + 일반화
- *세 사용처 (또는 그 이상) 도달 후 추출* 정신

**비즈니스 로직 vs 패턴 추출**:
- Day 30: sendMessage = *비즈니스 로직 처음부터* (extraction threshold 예외)
- Day 31: PagePoller = *기술 패턴, 4 사용처 도달 후 추출* (정신 그대로)

**원칙**: "*extraction threshold 실제 도달 시 즉시 추출* — 학습 추적 가능. *git mv = history 보존 rename*. *비즈니스 로직 = 처음부터*, *기술 패턴 = 3+ 사용처 후*. *추출 임계 = 책임의 성격* 따라."

---

## 🎓 새로 배운 개념 (Day 29~31)

### Day 29
- *두 번째 사용처 = 차이점 발견*
- *검증 전이 (동형 페어)*

### Day 30
- *청사진 무력화 + 적응 (C 옵션)*
- *Client Component 첫 도입 + `'use client'` 의미*
- *`router.refresh()` vs `revalidatePath`*
- *Interactive transaction 진화 (upsert 결과 재사용)*
- *findFirst with 권한 조건 (DB 단 권한 필터)*
- *책임 분리: 헬퍼 (비즈니스) vs Server Action (권한)*
- *Single text input = Enter 자동 submit*
- *카톡식 UI 위계 (색조 + 강도 두 축)*

### Day 31
- *Next.js 16+ render 중 mutation 차단*
- *Server Action ref 를 props 로 Client 전달*
- *`scrollIntoView` 자동 컨테이너 인식*
- *visibility API 폴링 최적화*
- *Prisma `_count` with `where`*
- *PagePoller 일반화 + git mv rename*

---

## 📋 작성된 코드 핵심

```ts
// app/lib/messages.ts (Day 30) — 헬퍼 + interactive transaction
export async function sendMessage({ bookingId, senderUserId, content }) {
  const cleanContent = content.trim().slice(0, 1000)
  if (!cleanContent) return

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { buyerId: true, sellerProfileId: true },
  })
  if (!booking) return

  await prisma.$transaction(async (tx) => {
    const thread = await tx.messageThread.upsert({
      where: { relatedBookingId: bookingId },
      create: {
        buyerId: booking.buyerId,
        sellerProfileId: booking.sellerProfileId,
        relatedBookingId: bookingId,
      },
      update: {},
    })

    await tx.message.create({
      data: { threadId: thread.id, senderId: senderUserId, content: cleanContent },
    })

    await tx.messageThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    })
  })
}
```

```ts
// app/bookings/[id]/messages/actions.ts (Day 30, Day 31 markAsReadAction 추가)
"use server"
export async function sendMessageAction(formData: FormData) {
  const session = await verifySession()
  if (!session) redirect("/login")

  const bookingId = Number(formData.get("bookingId"))
  const content = String(formData.get("content") ?? "")

  // 권한 + 존재 = 한 쿼리
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { buyerId: true },
  })
  if (!booking || booking.buyerId !== session.userId) notFound()

  await sendMessage({ bookingId, senderUserId: session.userId, content })
  revalidatePath(`/bookings/${bookingId}/messages`)
}

// Day 31 — 읽음 처리 (render 밖에서만 가능)
export async function markAsReadAction(bookingId: number) {
  const session = await verifySession()
  if (!session) return

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { buyerId: true, messageThread: { select: { id: true } } },
  })
  if (!booking || booking.buyerId !== session.userId) return
  if (!booking.messageThread) return

  const result = await prisma.message.updateMany({
    where: {
      threadId: booking.messageThread.id,
      senderId: { not: session.userId },
      isRead: false,
    },
    data: { isRead: true },
  })

  if (result.count > 0) revalidatePath("/bookings")
}
```

```tsx
// app/components/PagePoller.tsx (Day 31, Day 30 MessagesPoller 일반화)
"use client"
export default function PagePoller({ intervalMs = 5000 }) {
  const router = useRouter()

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    const start = () => {
      if (intervalId) return
      intervalId = setInterval(() => router.refresh(), intervalMs)
    }
    const stop = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        router.refresh()
        start()
      } else stop()
    }

    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [router, intervalMs])

  return null
}
```

```tsx
// app/components/MarkAsReadOnMount.tsx (Day 31)
"use client"
export default function MarkAsReadOnMount({
  bookingId,
  action,
}: {
  bookingId: number
  action: (bookingId: number) => Promise<void>
}) {
  useEffect(() => {
    action(bookingId)  // ← render 밖
  }, [bookingId, action])
  return null
}
```

```tsx
// app/components/MessageThread.tsx 입력 폼 (Day 30) — input + Enter 자동 submit
<form action={action} className="relative">
  <input type="hidden" name="bookingId" value={bookingId} />
  <input
    type="text"        // ← textarea 아님 — Enter 자동 submit
    name="content"
    required
    maxLength={1000}
    placeholder="메시지를 입력하세요..."
    className="w-full rounded-lg border border-line bg-surface py-5 pl-3 pr-24 text-sm"
  />
  <button type="submit" className="absolute right-5 top-1/2 ...">전송</button>
</form>
```

```tsx
// /bookings/page.tsx (Day 31) — isRead 뱃지
include: {
  messageThread: {
    select: {
      _count: {
        select: {
          messages: {
            where: { senderId: { not: session.userId }, isRead: false },
          },
        },
      },
    },
  },
}

// 렌더
{unreadCount > 0 && (
  <span className="rounded-full bg-accent-bg px-2 py-0.5 text-xs text-white dark:text-zinc-900">
    {unreadCount}
  </span>
)}
```

---

## 📁 변경된 파일

### Day 29 (1 파일)
```
stylefit/
└── app/seller/activity-log/page.tsx   페이지네이션 추가 (audit-log 두 번째 사용처)
```

### Day 30 (11 파일)
```
신규 (7):
├── app/components/MessageThread.tsx       카톡식 UI
├── app/components/MessagesPoller.tsx      Client 첫 (5초 폴링, Day 31 에 PagePoller 로 rename)
├── app/lib/messages.ts                    sendMessage 헬퍼 (interactive transaction)
├── app/bookings/[id]/messages/actions.ts  구매자 Server Action
├── app/bookings/[id]/messages/page.tsx    구매자 페이지
├── app/seller/bookings/[id]/messages/actions.ts 셀러 Server Action
└── app/seller/bookings/[id]/messages/page.tsx 셀러 페이지

수정 (2):
├── app/bookings/page.tsx                  [메시지 →] 링크
└── app/seller/bookings/page.tsx           [메시지 →] 링크

스키마 + 마이그레이션:
├── prisma/schema.prisma                   @@index([threadId, createdAt])
└── prisma/migrations/add_message_index/
```

### Day 31 (10 파일)
```
신규 (2):
├── app/components/AutoScrollAnchor.tsx    useRef + scrollIntoView
└── app/components/MarkAsReadOnMount.tsx   useEffect → Server Action

Rename (1):
└── MessagesPoller.tsx → PagePoller.tsx    git mv (history 보존)

수정 (7):
├── app/globals.css                        .scrollbar-thin 유틸
├── app/components/MessageThread.tsx       AutoScrollAnchor + max-h/overflow
├── app/bookings/[id]/messages/actions.ts  markAsReadAction
├── app/seller/bookings/[id]/messages/actions.ts markAsReadAction 대칭
├── app/bookings/[id]/messages/page.tsx    MarkAsReadOnMount + PagePoller
├── app/seller/bookings/[id]/messages/page.tsx 동일
└── app/bookings/page.tsx, /seller/bookings/page.tsx  _count 뱃지 + PagePoller
```

*묶음 2 총 22 파일 변경* (신규 9 + rename 1 + 수정 12).

---

## 🚀 Day 32+ 미리보기

**작업 후보**:
- *환경설정 영구 해결* (Day 24~ 부터 미뤄둔 빚 청산) — 사용자 명시 결정
- *진짜 실시간 (SSE / WebSocket / Pusher)* — 폴링 베이스 위 진화
- *페이지네이션 3 사용처 + paginate 추출* — extraction threshold 도달
- *디자인 디테일 2차 수정* — 기능 모두 후 (사용자 명시)

**Day 32 권장 — 환경설정 영구 해결**:
- 사용자 명시 결정 (Day 31 끝나며)
- *기능/도메인 잠시 환기* 후 빚 청산
- Day 33+ 에 SSE 또는 디자인 2차 자연

단 Day 21~ 의 *계획 재검토 정신* 따라 Day 32 진입 시 다시 따짐.

---

## 💡 묶음 2 회고 — *메시지 도메인의 9 Day 압축 호*

Booking 도메인이 *Day 13~24 의 11 Day* 에 걸쳐 누적된 반면, 메시지 도메인은 *Day 30~31 의 2 Day* 에 *카톡식 UX 완성도* 도달:

| | Booking 도메인 (11 Day) | 메시지 도메인 (2 Day) |
|---|---|---|
| 모델 도입 | Day 13 | (기획 초반, 이미 존재) |
| 모델 발견 | (없음) | Day 30 *큰 발견* |
| 액션 도입 | Day 18~22 (4 Day) | Day 30 (1 Day) |
| 실시간 | (없음) | Day 31 (1 Day) |
| 의외 발견 | 분기 의존성, race, 환경 | 청사진 vs schema, render 중 mutation 차단 |
| Client Component | (없음) | Day 30~31 (3 개 신규) |

**메시지 도메인의 *압축 호***:
- Day 30: 새 도메인 + 첫 Client + 카톡식 UI
- Day 31: 자동 스크롤 + 폴링 진화 + isRead + render 차단 학습
- *2 Day 안에 디자인 + 기능 + 실시간 + 일반화* 모두 누적

**왜 *압축 가능***:
- Booking 도메인 누적이 *액션 패턴 안정화* — 메시지에 *재적용*
- Day 28 디자인 시스템 — 카톡식 UI 의 *바로 활용*
- *기존 schema 발견* — 모델 작업 0
- *Client Component 첫 도입의 학습 폭발* — 한 번 도입 후 *추가 활용 자연*

**디자이너의 *디자인 시스템 활용 가속*** — Day 28 의 시스템 토큰 + AlertBox / PageTabs / NavLink 정비 후 *새 도메인에 즉시 활용*. *시스템 통합 = 미래 작업 가속* 의 가시적 증거.

---

## ✅ 한 줄 요약

> **"*호흡 조절 → 새 도메인 진입 → 실시간 진화 패키지* 의 3 Day 흐름. Day 29 = 페이지네이션 두 번째 사용처 (차이점 발견 + 검증 전이). Day 30 = 메시지 도메인 + Client Component 첫 도입 + 청사진 무력화 적응 (C 옵션) + 카톡식 UI 위계. Day 31 = 실시간 진화 패키지 4 작업 + *Next.js 16+ render 중 mutation 차단 학습* + PagePoller 일반화 (4 사용처 도달). 11 → 22 → 1 파일의 호흡 곡선 + 메시지 도메인 2 Day 압축 호."**

---

## 🧠 한 가지 회고 — *프레임워크 차단의 학습 가치*

Day 31 의 *render 중 mutation 차단* 이 이 묶음의 가장 큰 학습.

**시간 순 흐름**:
1. *anti-pattern 인식 + 시도* — Server Component 안 mutation
2. *사용자 OK* — "학습 단계 OK"
3. **프레임워크 차단** — `revalidatePath used during render which is unsupported`
4. *우회 시도 실패* — 모든 위치에서 차단
5. *재설계* — Server Action + Client 마운트
6. *진짜 패턴 학습* — Server Action ref 를 props 로 client 전달

**학습 가치의 *역설***:
- *사용자 OK 인 anti-pattern* = *학습 누락 위험* (그냥 작동했으면 그대로 갔을 것)
- *프레임워크 차단* = *학습 강제 트리거*
- *우회 불가 = 정도 학습*

**Next.js 16+ 의 *철학적 결정***:
- "*불완전한 패턴은 지원하지 않음*"
- *학습자 보호* — 진짜 안전한 패턴으로 강제
- *런타임 차단 = 컴파일 타임 보호 의 확장*

**다른 *프레임워크 차단 사례들* 회상**:
- TypeScript strict null checks → null 체크 강제
- React `useEffect` 의 cleanup return → 메모리 누수 보호
- ESLint rules → 안티패턴 차단
- *Next.js render 중 mutation* → 같은 결의 *프레임워크 보호*

**디자이너의 *디자인 시스템 강제* 와 같은 결**:
- 디자인 시스템 = *임의 색 사용 차단* (토큰만 허용)
- *제약 = 일관성 보장*
- *Next.js 의 mutation 차단 = 의미 일관성 보장*

**학습 단계의 *제약 가치***:
- 학습자 = *몰라서 안티패턴 가능*
- 프레임워크/도구 = *경계 명시 + 우회 불가*
- *학습 효율 ↑* — 잘못된 경로 즉시 차단

**AI 협업의 *프레임워크 역할*** — AI 도 *학습 단계 OK* 라는 *느슨한 의사결정* 가능. 프레임워크가 *진짜 안전 경계* 를 *명시적으로 보호* → 학습자/AI 모두 *정도 학습* 강제.

코딩 학습의 *진짜 안전망* = *AI 합의 + 프레임워크 차단 + 사용자 검증* 의 *3 단 보호*. 묶음 2 의 메시지 도메인 진화가 *이 3 단의 가시적 사례*. Day 32+ 의 환경설정 / SSE 진화로 이어짐.

---

*문서 끝. Day 32~33 묶음 으로 이어짐.*
