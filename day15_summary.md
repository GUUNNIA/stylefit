# Phase 1A — Day 15 완료 보고서

> 작성일: 2026-05-19
> 작업 범위: 셀러 본인 서비스 수정 / 숨기기 (소유권 가드 + 재검증 강제 + race-safe 토글)
> 학습자: 디자인 전공 / 코딩 15일째

---

## 🎯 큰 그림 — Day 15가 한 일

```
[Day 13] 셀러 영역 (보호 + 등록 폼 + Service 검증 상태)
[Day 14] 관리자 검증 워크플로 — 반려 사유까지 표시
   ↓                            ↑
   └─────────────────  반려 사유는 *말*만, *행동* 없음 ──┘
[Day 15] 셀러 *수정 → 재검증* + *숨기기/노출* — 반쪽 행동의 완전화  ← 지금
   ↓
[Day 16 예정] 검색·카테고리 필터 (?category=...&q=...)
```

Day 14에서 셀러는 *반려 사유는 보지만 고칠 곳이 없었음*. Day 15: **수정 폼 + 본인 소유 가드 + 재검증 강제 + 숨기기 토글** — 반려 사유가 *진짜 행동으로 이어지는* 닫힌 루프.

---

## 📅 Day 15 작업 요약

### 6 단계 (Day 14 패턴 유지 — 단계마다 OK 받고 진행)

| Step | 작업 | 새 개념 |
|---|---|---|
| 1 | `/seller/services/[id]/edit` 라우트 + *본인 소유 가드* | `findFirst` 복합 where, `notFound()` enumeration 방어 |
| 2 | 수정 폼 + Server Action — submit 시 `verificationStatus: pending` 되돌림 | `updateMany` 복합 where, durationMinutes 역변환 |
| 3 | `/seller/services` 카드 액션 바에 *수정* 버튼 | Link 기반 진입점, 반려 사유 박스 → 액션 흐름 정합 |
| 4 | `isActive` 토글 Server Action + *숨기기/다시 노출* 버튼 | 명시 set 패턴 (race-safe), 카드 안 inline form |
| 5 | 공통 ServiceForm 추출 — *판단 단계*, 보류 결정 | Day 11 "세 번째에서 추출" 원칙 *적용 사례* |
| 6 | 통합 검증 (수정→pending→admin→approved→숨기기→비노출) | 단위 검증을 *하나의 사슬*로 통과 |

### 곁다리로 해결된 두 가지

| 이슈 | 원인 | 해결 |
|---|---|---|
| `notFound()` 호출은 정상인데 *빈 화면* | `not-found.tsx` 부재 + 다크모드 색 깨짐 | root `not-found.tsx` 카드 패턴 추가 |
| 페이지가 안 그려짐 (WebSocket fail) | IP 접근 시 HMR WebSocket 거절 | `localhost:3000` 으로 접근 |

---

## 🐛 Day 15 핵심 발견·논의

### 발견 1: ***본인 소유 검증***은 *쿼리에 끼워넣는다* — 사후 검사가 아니라

```ts
// ❌ 흔한 잘못된 패턴
const service = await prisma.service.findUnique({ where: { id } })
if (service?.sellerProfileId !== mySellerId) notFound()  // race condition 위험

// ✅ Day 15 채택 패턴
const service = await prisma.service.findFirst({
  where: { id, sellerProfileId: mySellerId },  // 복합 조건 *쿼리에 직접*
})
if (!service) notFound()
```

차이: *조건이 쿼리 안에 있으면* DB가 한 번에 판단 → race condition / 검사 누락 위험 0. `update` 도 같은 원리:

```ts
// 페이지: findFirst 복합 where
// 액션:   updateMany 복합 where ({ id, sellerProfileId })
// 둘 다 *id 단독*이 아니라 *id + sellerProfileId* 매칭
```

**원칙**: "*권한 검증을 쿼리 밖*에 두면 *조건 누락 가능성*이 코드 분기마다 늘어남. *쿼리 안*에 두면 *한 곳*에서 닫힘. Prisma의 `findFirst` / `updateMany` 복합 where 가 이 표현의 도구."

### 발견 2: `notFound()` vs `redirect` — *enumeration 방어*

남의 서비스 ID를 직접 입력했을 때 두 선택지:
- (가) `redirect("/seller/services")` — "존재하지만 못 들어감" 정보 *흘림*
- (나) `notFound()` — *존재 여부 자체*를 *숨김* ✓

Day 15 채택: **(나)**. 셀러가 `/seller/services/999/edit` 직접 쳐도 *그게 있는 ID 인지 없는 ID 인지* 알 수 없음. *ID 범위 탐색 공격* 차단.

**원칙**: "*권한 부족*과 *존재하지 않음*을 *같은 응답*으로 묶으면 정보 노출 ↓. 학습 단계의 *작은 보안 습관*이 운영 단계의 *큰 차이*."

### 발견 3: ***명시 set*** vs ***토글*** — race-safe 패턴

`isActive` 토글 액션을 두 가지로 구현할 수 있음:

```ts
// 패턴 A: 토글 (현재값 읽고 반대로)
const current = await prisma.service.findFirst({...})
await prisma.service.updateMany({
  ...,
  data: { isActive: !current.isActive }
})

// 패턴 B: 명시 set (클라가 원하는 값 보냄) ✓ Day 15 채택
const nextActive = formData.get("nextActive") === "true"
await prisma.service.updateMany({
  ...,
  data: { isActive: nextActive }
})
```

차이: 두 탭에서 *동시 토글* 시 패턴 A는 *마지막 read 한 값* 기준이라 *예상과 반대*가 될 수 있음. 패턴 B는 *사용자가 본 상태 → 본 결정*이 그대로 적용.

**원칙**: "*UI 가 보여주는 *현재 상태*를 *서버가 읽지 않고* *클라가 결정값을 보내는* 게 *race-safe*. 토글이 자연스럽지만, *명시 set* 이 안전."

### 발견 4: 수정 후 *재검증 강제* — Day 14 정신의 닫힌 루프

수정 액션의 핵심 한 줄:

```ts
data: {
  ...수정값,
  verificationStatus: "pending",  // 어떤 수정이든 무조건 pending
  rejectionReason: null,           // 이전 반려 사유 클리어
}
```

이 두 줄이 *Day 14 검증 워크플로의 정신*을 닫음:
- 셀러가 *검증 통과한 내용을 조용히 바꾸는* 경로 차단
- 반려 → 수정 → 재제출 → admin 재검토 → ... 흐름이 *자연*

**대안 고려와 기각**: "*가격만 수정*은 즉시 반영, *설명·카테고리 수정*만 재검증" 같은 *세분화 정책*. 학습 단계엔 *모든 수정 = 재검증* 단순화가 옳음. 세분화는 Day 18+ *번복 이력 추적*과 같이.

**원칙**: "*기능을 끝까지* 닫지 않으면 *반쪽 정책*이 됨. *검증 워크플로* 도입은 *수정 경로의 재진입*까지 일관해야 의미가 있음."

### 발견 5: *"삭제"* 라벨은 거짓말 — *"숨기기"* 가 정직

원래 메모([[project-day15-plan]])엔 "삭제 정책 — soft delete" 적혀있었지만, 실제 *isActive 토글* 만 하면 DB 레코드와 외래키(Booking·Review) 모두 *그대로 보존* 됨. 그걸 "삭제" 라고 부르면 *셀러의 멘탈 모델*과 *실제 동작*이 어긋남.

채택 라벨:
- 활성 → *"숨기기"* (회색 버튼)
- 비활성 → *"다시 노출"* (검은 버튼, 강조)

**원칙**: "*UI 라벨은 *실제 동작*과 일치해야 함. *기존 패턴이 익숙해도* 실제와 다르면 *재설계 명명*. 디자인 전공자의 *언어 정확성* 직관이 코드 결정에 들어옴."

### 발견 6: *공통화*를 *미루기* — Day 11 원칙 *적용 사례*

15-5: CreateServiceForm + EditServiceForm. *필드 마크업·헬퍼 100% 동일*, 차이는 *상수 6개*. 기술적으로는 *깔끔한 추출 가능*.

선택: **보류**. 근거 세 가지:
1. Day 11 원칙 "*세 번째 사용처에서 추출*" — 지금은 두 번째
2. 미래 세 번째(어드민 편집 / draft / 복제) 등장 시 *모양이 달라질 수 있음*
3. 추출 비용 = 새 인터페이스 + prop chain — *상수 6개 중복*보다 비쌀 수도

**원칙**: "*추출 욕망*은 *기술적 깔끔함*보다 *세 번째 사용처의 모양*이 결정. *두 번째에서도 가능해 보일 때 미루는 경험* 자체가 학습 자산." 이 결정은 메모([[feedback-extraction-threshold]])로 박제.

### 발견 7: 데이터 형태 ≠ 입력 형태 — `durationMinutes` 역변환

DB: 단일 `Int` 분 컬럼 (`90`). 폼: *일·시간·분* 세 단위. Day 13 등록 폼은 *세 단위 → 분* 합산. Day 15 수정 폼은 *역방향* 분해 필요.

```ts
const days = Math.floor(service.durationMinutes / 1440)
const hours = Math.floor((service.durationMinutes % 1440) / 60)
const minutes = service.durationMinutes % 60
```

이걸 페이지에서 분해해 *defaultValue* 로 폼에 넘김. 입력 → 합산 → 저장 → 분해 → 표시 → 입력 → ... 의 자연 사이클.

**원칙**: "*UI 단위 ≠ DB 단위* 가 자연스러운 경우 많음 (가격: 원 vs 천원, 시간: 일/시/분 vs 분). *변환 함수가 양방향*으로 짝맞춰야 일관."

### 발견 8: 다크모드 색 깨짐 — *카드 패턴*이 *암묵적 라이트 강제*

`not-found.tsx` 첫 작성 시 *카드 마크업 없이* `text-zinc-900` 검정 글씨만 → 다크모드 배경(`#0a0a0a`) 에 *글씨가 완전히 묻힘*. 다른 페이지는 *카드 마크업의 `bg-white`* 가 *암묵적으로* 라이트 톤을 강제하던 것.

해결: not-found.tsx 도 카드 패턴 적용.

**원칙**: "*전체 페이지가 라이트 전제*인 프로젝트에서 *컨테이너 색을 명시*하지 않으면 다크모드 때 깨짐. *카드 마크업의 `bg-white`* 가 일관 안전장치." 진짜 다크모드 대응은 별도 단계.

### 발견 9: HMR WebSocket — *IP 접근의 보이지 않는 함정*

검증 중 페이지가 *완전 빈 화면*. 콘솔: `WebSocket connection to 'ws://192.168.130.119:3000/_next/webpack-hmr?id=...' failed` 6회.

원인: dev 서버는 *localhost* 기준 HMR. IP 접근 시 cross-origin 으로 분류되어 WebSocket *거절*. `allowedDevOrigins` 는 *HTTP 만* 허용, *WebSocket 별개*.

해결: `localhost:3000` 으로 접근. *모바일/다른 기기 확인용*이 아니면 IP 접근 이유 없음.

**원칙**: "*같은 컴퓨터*는 *localhost* — 보안·HMR·세션 쿠키 *모두 안전*. IP 는 *다른 기기 테스트* 때만."

### 발견 10: Prisma client *stale type* — 빌드는 되는데 IDE 만 빨간 줄

`prisma generate` 가 schema 변경 후 *자동* 도는 게 정상이지만, 어떤 이유로 안 돌면 *.next 캐시는 OK 인데 IDE TS server 가 옛 타입 캐시* 들고 있어 *코드 자체는 컴파일 되는데 빨간 줄* 만 보이는 상태.

해결 2단계:
1. `npx prisma generate` 재실행
2. VSCode: `Ctrl+Shift+P` → `TypeScript: Restart TS Server`

**원칙**: "*런타임은 정상인데 IDE 만 에러* 시 *Prisma client / TS server* 둘 중 하나가 stale. *빌드 결과*와 *IDE diagnostics*는 *다른 캐시*."

---

## 🎓 새로 배운 개념 (Day 15)

### `findFirst` 복합 where — *권한 + 조회 한 쿼리로*
- `findUnique` 는 *단일 unique 필드*만 받음
- `findFirst` 는 *여러 조건 AND* 가능 → `{ id, sellerProfileId }` 같은 *권한 + 식별* 조합
- *권한을 쿼리 밖*에 두지 말고 *쿼리 안*으로

### `updateMany` 복합 where — *update + 권한 한 쿼리로*
- `update` 는 *단일 unique where* 만 받음 — 권한 조건 못 끼움
- `updateMany` 는 *조건 자유* — 본인 소유 update 표준 패턴
- 결과의 `count` 로 *진짜 update 됐는지* 확인

### `notFound()` (Next.js)
- App Router 표준 — *404 응답 + 가장 가까운 `not-found.tsx` 렌더*
- `redirect()` 처럼 *throw 스타일* — try/catch 안에서 호출 금지

### root `not-found.tsx`
- 어떤 페이지든 `notFound()` 호출 시 *가장 가까운* `not-found.tsx` 렌더
- 라우트별 별도 안 두면 *이 root 가 fallback*
- *없으면 빈 화면* — Next.js dev 모드 함정

### 명시 set vs 토글 — *race-safe* 패턴
- 토글: 서버가 *현재값 읽고 반대로* → race condition 위험
- 명시 set: 클라가 *원하는 nextValue 명시* → 본 결정 그대로

### `revalidatePath` 여러 경로
- 데이터 한 번 변경이 *여러 화면*에 영향 → 모두 무효화
- Day 15 수정: `/seller/services` + `/services` + `/admin/services` 셋 다

### *데이터 형태 ≠ 입력 형태* 변환
- 저장 단위 (분) ≠ 입력 단위 (일/시/분)
- *합산 함수* (입력 → 저장) + *분해 함수* (저장 → 입력) 짝
- formatDuration (표시용) 까지 *세 변환* 일관

### *enumeration 방어*
- 권한 부족 / 존재하지 않음을 *같은 응답*으로 묶기
- ID 범위 탐색 차단

### *Day 11 원칙 적용 — 두 번째에서 추출 보류*
- 기술적 가능 ≠ 추출 적기
- *세 번째 사용처의 모양*이 *추상화 모양*을 결정
- 미루는 경험 자체가 학습

---

## 📋 작성된 코드 핵심

```ts
// app/seller/services/[id]/edit/page.tsx — 본인 소유 가드
const service = await prisma.service.findFirst({
  where: { id: serviceId, sellerProfileId: sellerProfile.id },
})
if (!service) notFound()
```

```ts
// app/seller/services/[id]/edit/actions.ts — 본인 소유 update + 재검증 강제
const { count } = await prisma.service.updateMany({
  where: {
    id: serviceId,
    sellerProfileId: sellerProfile.id,  // 권한 *쿼리 안*
  },
  data: {
    ...수정값,
    verificationStatus: "pending",  // 재검증 강제
    rejectionReason: null,
  },
})
if (count === 0) redirect("/seller/services")  // 본인 소유 아님 → 조용히
```

```ts
// app/seller/services/actions.ts — 명시 set 토글
const nextActive = formData.get("nextActive") === "true"  // 현재값 안 읽음
await prisma.service.updateMany({
  where: { id: serviceId, sellerProfileId: sellerProfile.id },
  data: { isActive: nextActive },
})
```

```tsx
// app/seller/services/page.tsx — 카드 안 inline form (Client component 없이)
<form action={setServiceVisibilityAction}>
  <input type="hidden" name="serviceId" value={s.id} />
  <input type="hidden" name="nextActive" value={s.isActive ? "false" : "true"} />
  <button type="submit">{s.isActive ? "숨기기" : "다시 노출"}</button>
</form>
```

---

## 📁 현재 폴더 상태 (Day 15 추가분 ★)

```
stylefit/app/
├── not-found.tsx                                ★ Day 15 (root 404 UI)
├── seller/
│   ├── services/
│   │   ├── page.tsx                             — 액션 바 추가 (수정/숨기기) (Day 15)
│   │   ├── actions.ts                           ★ Day 15 (setServiceVisibility)
│   │   ├── new/                                 — Day 13 유지
│   │   └── [id]/edit/                           ★ Day 15 (전체 새 라우트)
│   │       ├── page.tsx                         ★ 본인 소유 가드 + duration 역변환
│   │       ├── actions.ts                       ★ updateMany 복합 where + 재검증 강제
│   │       └── EditServiceForm.tsx              ★ Create 폼의 *수정 버전*
│   └── pending/                                 — Day 14 유지
└── admin/                                       — Day 14 유지
```

---

## 🚀 Day 16 미리보기 — *URL 쿼리 패턴 재사용*

[[project-day15-plan]] 메모대로 다음은 **검색·카테고리 필터** (`/services?category=...&q=...`).

Day 14에서 만든 *URL 쿼리 + Prisma where 동적 조립* 패턴이 *진짜 활용* 되는 시점:
- 화이트리스트 검증 + default fallback (Day 14)
- 다중 조건 조립 (`AND` / `OR`, `contains`)
- *category + q + status* 같은 *여러 축* 동시 필터

Day 16 분량도 적정 — Day 14 의 *한 축 필터* 가 *여러 축*으로 자연 확장.

---

## 💡 Day 14 → 15 회고 — *말 → 행동*

| Day | 셀러가 *반려 사유*를 보면 |
|---|---|
| 14 | 보긴 함. 하지만 *고치는 곳이 없음* — 새로 등록하거나 Studio 수동 |
| 15 | *수정* 버튼 → 폼 → 저장 → *자동 pending 재검증* → admin 재검토 → ... 닫힌 루프 |

Day 14의 *반려 사유는 말만, 행동 없음* 상태가 Day 15에 *말 → 행동 → 재검토* 한 사슬로 닫힘. *셀러 입장의 진짜 가용성*에 도달.

---

## ✅ 한 줄 요약

> **"반려 사유가 *말로 끝나지 않고* *수정 → 재검증 → 재제출* 한 사슬로 닫혔다 — Day 14의 닫히지 않았던 루프가 닫힘."**

---

## 🧠 한 가지 회고 — *공통화를 미루는 경험*

Day 15의 *진짜 학습*은 15-5. 두 폼 (Create + Edit) 이 *기술적으로 추출 가능*했는데 *Day 11 원칙*("세 번째에서 추출") 따라 **보류** 했음.

처음엔 손이 가려움 — *상수 6개 중복*이 *비효율* 같음. 그러나 *세 번째 사용처가 등장하면 모양이 달라질 수 있다* 는 *시간축 사고*가 결정을 바꿈. 추상화는 *기술이 아니라 시간*. 두 점만 보고 그은 직선이 *세 번째 점*과 안 맞는 경험이 *추출 보류의 가치* 를 가르침.

이 결정을 *기억하기 위해* 메모([[feedback-extraction-threshold]])로 박제. *다음에 비슷한 상황* 이 오면 *지금의 판단 근거*를 즉시 꺼낼 수 있게.

**디자인 전공자가 *코드 미적 욕망*보다 *시간축 트레이드오프*를 우선시한 결정** — 이게 Day 15의 가장 큰 자산이에요. *기술적으로 깔끔한 추출*이 *지금* 옳은 결정과 다를 수 있다는 직감.

---

*문서 끝. Day 16으로 이어짐.*
