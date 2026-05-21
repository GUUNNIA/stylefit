# Phase 1A — Day 21 완료 보고서

> 작성일: 2026-05-21
> 작업 범위: Booking 흐름 — 셀러 *확정/거절* 액션 + 활동 이력 enum 확장 + buyer 측 거절 사유 표시
> 학습자: 디자인 전공 / 코딩 21일째

---

## 🎯 큰 그림 — Day 21이 한 일

```
[Day 13] /seller/bookings — 읽기 전용 페이지 ("// TODO(Day 14+): Server Action으로")
[Day 18] AuditLog events + $transaction (참조 의존성)
[Day 20] SellerActivityLog events + $transaction (분기 의존성)
   ↓
[Day 21] Booking 액션 — 확정/거절 + 활동 이력 세 번째 사용처 (enum 확장)  ← 지금
   ↓
[Day 22+ 예정] 페이지네이션? extract*Reason 추출? 시간 협상?
```

기능 ↔ 정리 리듬의 *네 번째 기능 Day*. Day 13 의 *읽기 전용 약속* 이행 + Day 18/20 의 *events 패턴 세 번째 적용*. **계획 재검토** 가 Day 21 의 첫 학습 — Day 20 plan 에 적은 *페이지네이션 권장* 을 *두 사용처 = 추출 시기 X* 라는 근거로 뒤집고 Booking 으로 갈아탐.

---

## 📅 Day 21 작업 요약

### 작업 단계 (8)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 계획 재검토 — Day 20 권장 (페이지네이션) 뒤집기 | *두 사용처 추출 = Day 19 정신과 모순* 인식 |
| 1 | 스키마: `Booking.rejectionReason` + `SellerActivity` 2 값 확장 | Day 14/18 패턴 그대로 (컬럼 + metadata 이중) |
| 2 | 마이그레이션 + EPERM/TS 캐시 트러블슈팅 | *환경 문제 진단* (Day 20 의 *세션 안전망* 다음) |
| 3 | `/seller/bookings/actions.ts` — `$transaction` *분기 + 참조 의존성 동시* | updateMany 의 data 한계 → read-then-write 패턴 |
| 4 | `/seller/bookings/page.tsx` — pending 카드에 [확정] / RejectBookingForm + 라벨 분기 + 사유 표시 | admin reject UI 복붙 (두 번째 사용처) |
| 5 | `/bookings/page.tsx` (buyer) — cancelled + 거절 사유 표시 | seller 측과 대칭 |
| 6 | `/seller/activity-log` — enum 2 값 라벨/배지 + 비고 컬럼 추가 + `extractRejectionReason` 복붙 | Day 18 audit-log 패턴 대칭 |
| 7 | 시드 보강 — GUUN 셀러용 booking 3개 (pending 2 + cancelled+사유 1) | *자기 충족 시드* 원칙 |
| 8 | 학습 문서 + 메모리 + 커밋 | |

---

## 🐛 Day 21 핵심 발견·논의

### 발견 1: ***계획 재검토*** — 어제 적은 권장을 뒤집을 수 있는가

Day 20 plan 의 마지막 줄: *Day 21 = 페이지네이션 권장*. 오늘 첫 본능: *그대로 따르기*.

하지만 [[feedback-pushback-default]] 적용 — *동의 메아리 금지, 약점 먼저*. 검토 결과:
- *두 사용처 (audit-log + activity-log)* 에서 추출 = Day 19 의 *세 번째 도달 후* 원칙과 *직접 모순*
- *시드 데이터에서 take 50 한계 체감 X* → 추상 학습 가치만 남음
- *진짜 부재 기능 (Booking 셀러 액션)* 이 *더 큰 가치*

→ Day 20 plan 의 권장을 *뒤집고* Booking 선택.

**메타 학습**: *어제의 권장* 이 *오늘의 명령* 이 아님. 메모리는 *맥락* 이지 *결정* 이 아님. 정리 Day 마지막에 적는 *다음 Day 후보* 는 *그 시점의 추정* — 다음 Day 시작 시 *재검토 가치*.

**원칙**: "*과거의 나의 결정* 도 *현재의 나* 가 *근거를 다시 따져* 뒤집을 수 있음. *메모리 기록 = 사고 출발점*, *현재 검토 = 사고 결과점*. 두 가지의 *동의 의무 X*."

---

### 발견 2: ***events 패턴의 세 번째 사용처*** — 모델 *재사용* vs 추출 *유혹*

Day 18 (admin AuditLog) + Day 20 (SellerActivityLog) + Day 21 (Booking 활동도 SellerActivityLog) → *세 번째 사용*.

하지만 *추출 트리거 X* — *모델 자체가 추상* 이라 *새 액션이 enum 확장으로 자연 적응*:

```ts
// Day 20 enum
enum SellerActivity {
  created
  updated
  toggled
}

// Day 21 enum (확장만)
enum SellerActivity {
  created
  updated
  toggled
  bookingConfirmed   // ← 추가
  bookingRejected    // ← 추가
}
```

`/seller/activity-log` 페이지 코드는 *거의 안 건드림* — `ACTIVITY_LABEL` / `ACTIVITY_BADGE` Record 에 *키 2개 추가* + 비고 컬럼만.

**Day 19 의 url-filter 추출 vs Day 21 의 enum 확장**:
- Day 19: *세 사용처가 비슷한 코드* → *공통 함수* 로 추출
- Day 21: *세 번째 사용처가 같은 모델의 새 액션* → *enum 값 추가* 로 자연 확장

같은 *세 번째 도달* 이지만 *대응 방식 다름*. Day 20 의 *분리 결정 (도메인 정규화)* 이 *제대로 작동* — 활동 이력의 *권한·격리 패턴* 이 새 액션에도 그대로 적용됨.

**원칙**: "*세 번째 사용처 = 추출* 이 *고정 공식* 이 아님. *코드 패턴 추출 (Day 19)* 과 *모델 확장 (Day 21)* 의 *대응 방식이 다름*. *데이터 모델이 이미 잘 일반화돼 있으면* 새 사용처는 *값 추가로 흡수*. 추출 X. *모델 재사용 가치 = 추출 비용보다 큼*."

---

### 발견 3: ***분기 + 참조 의존성 동시*** — `$transaction` 의존성 유형의 완전체

Day 18: 참조 의존성 (서비스 만든 후 그 id 를 log 에)
Day 20: 분기 의존성 (count > 0 일 때만 log)
Day 21: **둘 다 동시** — 다음 패턴 등장:

```ts
await prisma.$transaction(async (tx) => {
  // 1) read — *본인 + pending* booking. *보안 + 멱등 + 참조* 데이터 획득
  const booking = await tx.booking.findFirst({
    where: {
      id: bookingId,
      sellerProfileId: sellerProfile.id,
      status: BookingStatus.pending,
    },
    select: { id: true, serviceId: true, preferredDatetime: true },
  })
  if (!booking) return  // 분기 1: 본인 X / 이미 처리됨

  // 2) update — *status: pending* 한 번 더 (race 최후 보루)
  const { count } = await tx.booking.updateMany({
    where: { id: booking.id, status: BookingStatus.pending },
    data: {
      status: BookingStatus.confirmed,
      confirmedDatetime: booking.preferredDatetime,  // ← 참조!
    },
  })
  if (count === 0) return  // 분기 2: race 충돌

  // 3) log — booking 의 serviceId 참조
  await tx.sellerActivityLog.create({
    data: {
      sellerProfileId: sellerProfile.id,
      activity: SellerActivity.bookingConfirmed,
      serviceId: booking.serviceId,           // ← 참조!
      metadata: { bookingId: booking.id },    // ← 참조!
    },
  })
})
```

**왜 read 가 필요한가** — `updateMany` 의 `data` 에 *컬럼 값 참조* 불가능:
```ts
// ❌ Prisma updateMany 는 이런 표현 X
data: {
  confirmedDatetime: { fromColumn: "preferredDatetime" },
}
```

→ *값으로 update* 하려면 *update 전에 read* 필요. raw SQL `SET confirmed = preferred` 도 가능하지만 *학습 단계 오버스펙*.

**의존성 유형의 완전체** — 한 트랜잭션 안에 *세 종류 모두*:
- *Read → Update*: serviceId/preferredDatetime/존재 확인을 위해 read 필요
- *Update count → log 분기*: count > 0 일 때만 log
- *Update 결과 → log 참조*: log 의 serviceId/bookingId

**원칙**: "*$transaction 의 의존성 유형은 누적*. Day 18 의 참조 + Day 20 의 분기가 *현실에선 동시 등장*. *learn 단계별 단순화* 가 *현실의 복합* 으로 자연 진화. interactive callback 의 *진짜 가치* 가 여기서 드러남."

---

### 발견 4: ***status 멱등*** — where 에 현재 상태 끼우기

`updateMany` 의 where 에 *목표 status 의 전제 조건* 끼우기:

```ts
where: {
  id: bookingId,
  sellerProfileId: sellerProfile.id,
  status: BookingStatus.pending,   // ← 핵심
}
```

**효과**:
- *이미 confirmed 인 booking 을 또 confirm 요청* → matches X → count=0 → log 안 만듦 (조용히 무시)
- *동시 두 탭에서 confirm + reject* → 두 트랜잭션 중 *한 번만 success* (다른 하나는 count=0)
- *남의 booking 조작* → matches X (sellerProfileId 조건도 함께)

**Day 15 의 *명시 set 패턴* 정신과 일치** — 현재값 read 하지 않고 *조건 + 목표값* 으로 update. *race-safe + 멱등 + 보안* 한 쿼리에서.

**Day 20 의 토글 액션 ↔ Day 21 의 booking 액션 차이**:

| | Day 20 토글 | Day 21 booking |
|---|---|---|
| 현재값 read | X (race-safe) | O (serviceId/preferredDatetime 필요) |
| where 조건 | id + sellerProfileId | id + sellerProfileId + status |
| 멱등 | 같은 값 set OK | *pending* 만 처리 |
| 로그 | 항상 (count>0) | 항상 (count>0) |

Day 20 의 *현재값 read 거부* 와 Day 21 의 *read 필요* 는 *모순 X* — *목적이 다름*. Day 20 은 *어떤 값 set 할지 결정* 위해 read X. Day 21 은 *그 booking 의 serviceId 알기* 위해 read O. *race-safe 정신* 은 `where: status: pending` 으로 *update 시점에 보장*.

**원칙**: "*멱등의 표현은 where 조건*. *현재값 read* 도 *race-safe 와 모순* 이 아님 — *read 후 update 의 where 에 조건 한 번 더* 끼우면 OK. *race-safe* 의 본질 = *update 시점의 조건 명시*, *현재값 read 금지* 가 아님. Day 15 정신의 *정확한 재해석*."

---

### 발견 5: ***cancelled 의 의미 분기*** — rejectionReason 유무로 간접 구분

설계 유혹: *셀러 거절* vs *buyer 취소* 를 *별도 enum 값* 으로 분리.

```ts
// 유혹
enum BookingStatus {
  pending
  confirmed
  completed
  cancelled    // buyer 취소
  rejected     // ← 새로 추가? 셀러 거절
}
```

채택 안 함 — *간접 구분* 으로 충분:
- `cancelled` + `rejectionReason != null` = *셀러 거절*
- `cancelled` + `rejectionReason == null` = *buyer 취소*

**왜 분리 X**:
- *학습 단계 단순화* — enum 늘리면 *모든 status 분기 코드* 늘림 (라벨/색/정렬/페이지마다)
- *데이터 정합성 위험* — `rejected` enum 도입 시 *기존 cancelled 데이터 마이그레이션* 필요 (메타 보고 분리)
- *간접 구분 가능* — rejectionReason 컬럼이 *분리 신호* 역할

**미래 확장 여지**:
- buyer 취소 액션 도입 시 *그대로 cancelled* 사용. 사유는 buyer 가 입력 → metadata 또는 별도 컬럼
- *진짜 분리 필요* 시 enum 도입 — 학습 부담 *그때 감수*

**대조 — buyerMemo 와 rejectionReason 의 *의미적 대칭***:
- `buyerMemo` = buyer 가 booking 만들 때 적은 메모
- `rejectionReason` = 셀러가 거절 시 적은 사유
- 둘 다 *각자 영역* 의 *자유 텍스트* — 컬럼으로 자연

**원칙**: "*상태의 의미 분기* 가 *반드시 enum 분리* 일 필요 X. *컬럼 유무* 로 *간접 구분 가능* 하면 *enum 부담* 안 짊. *학습 단계 = 단순화* + *미래 진화 여지 보존*. *enum 도입은 비싼 결정* — 분기 코드 늘림, 데이터 정합 비용."

---

### 발견 6: ***본인 액션 reminder*** — admin/seller 대칭 패턴

Day 14 admin/services 의 rejected 카드에서:
```tsx
{s.verificationStatus === "rejected" && s.rejectionReason && (
  <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
    <strong>반려 사유:</strong> {s.rejectionReason}
  </div>
)}
```

Day 21 /seller/bookings 의 cancelled 카드:
```tsx
{b.status === BookingStatus.cancelled && b.rejectionReason && (
  <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
    <strong>거절 사유:</strong> {b.rejectionReason}
  </div>
)}
```

*같은 사용자* (admin / seller 본인) 가 *본인이 입력한 사유* 를 *나중에 본다* — *과거 의사결정 reminder* UX.

**왜 본인 화면에도 표시** (당연한 듯하지만):
- *왜 내가 거절했는지* 시간 지나면 *잊음*
- *분쟁 발생 시* 사유 확인 — *기록 우선*
- *사유 표시 = 일관성* — buyer 도 보고 seller 도 봄 (대칭 정보)

**대조 — admin 의 *반려* vs 셀러의 *거절***:
- admin: *공식 절차* — "반려" 카피
- seller: *개인 의사결정* — "거절" 카피
- *같은 행동 패턴, 다른 어휘* — 카피가 *문맥 형성*

**원칙**: "*본인이 한 액션* 도 *본인 화면에 표시*. *현재 상태 = 과거 액션의 결과* 라는 정신. *사유 박스 = 미래의 자신을 위한 메모*. 카피는 *역할 (admin/seller) 따라 변형* — 패턴은 동일."

---

### 발견 7: ***두 path 캐스케이드 revalidate*** — 한 액션이 두 사용자 group 의 화면 무효화

```ts
revalidatePath("/seller/bookings")  // 셀러 본인 목록
revalidatePath("/bookings")          // buyer 측 (그 구매자 다음 방문 시 새로 fetch)
```

*한 액션 (셀러 거절)* 이 *두 사용자 group* 의 화면 영향:
- 셀러 본인 → 카드 라벨 변경
- 구매자 → 본인 예약 목록 status 변경 + 거절 사유 표시

**Day 14 admin actions vs Day 21 booking actions revalidate 비교**:

| Day | 액션 | revalidate path |
|---|---|---|
| 14 | admin approve/reject service | `/admin/services` 만 (셀러 화면 자동 X) |
| 21 | seller confirm/reject booking | `/seller/bookings` + `/bookings` 둘 다 |

Day 14 는 *admin 만 보는 화면* 이라 1개. Day 21 은 *두 사용자 화면에 표시* 라 2개.

**원칙**: "*revalidate 의 path 결정 기준* = *그 액션의 영향 범위 모두*. *현재 화면만 새로고침* 이 *기본 사고* 라 *다른 화면 영향 누락* 흔한 실수. *셀러 액션 → 구매자 화면도* 같은 식으로 *생각의 확장* 필요. *RSC 캐시 무효화의 핵심 사고법*."

---

### 발견 8: ***환경 트러블슈팅*** — EPERM + TS Server 캐시

Day 21 의 *부수 학습 두 가지*:

**(1) EPERM on Windows** — `npx prisma generate` 가 *query_engine.dll.node* rename 실패:
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp23040' -> '...query_engine-windows.dll.node'
```

원인: *다른 프로세스가 dll 잡고 있음* — `npm run dev` 또는 VSCode 의 Prisma extension. 해결:
- dev server 끄기 → 재시도
- 또는 VSCode 닫고 새 PowerShell 에서 generate

핵심: *DB 는 이미 마이그레이션 적용 완료* (`Your database is now in sync`). *Prisma Client 만 재생성 안 됨* — 분리해서 *부분 성공* 인식.

**(2) TS Server 캐시** — generate 성공 후에도 *VSCode 의 진단* 에 *이전 .d.ts 잡고 있는 에러* 잔존:
```
Property 'rejectionReason' does not exist on type '...'
```

해결: `Ctrl+Shift+P → TypeScript: Restart TS Server`. 디스크의 .d.ts 는 *최신*, TS Server 의 *메모리 상* 캐시만 *낡음*. 재시작 = *캐시 비우기*.

**Day 20 (세션 종료 안전망) → Day 21 (환경 트러블슈팅) 의 연결**:
- Day 20: *git diff 로 코드 상태 복원*
- Day 21: *환경 도구의 캐시 / 잠금 이해* — 도구 동작의 *부분 실패* 진단

둘 다 *코드 외* 의 *개발 환경* 학습. *AI 도 모르는 환경별 함정* — Windows 특유, IDE 특유.

**원칙**: "*개발 환경의 부분 실패* 는 *전체 실패* 와 다르게 진단. *DB 적용 vs Client 생성* 분리, *디스크 vs IDE 캐시* 분리. *에러 메시지의 *어디까지 성공* 했는지* 가 *해결 방향* 결정."

---

### 발견 9: ***자기 충족 시드 원칙*** — 모든 화면이 본인 계정으로 검증 가능

시드의 booking 6개 — *다른 셀러 (강지원/윤채린/한태민) 받는* booking 만. GUUN 셀러는 *받은 예약 0*. → /seller/bookings 가서 "받은 예약 없음" 표시.

**문제 인식**:
- *시드의 정신* = *기능 작동 검증을 위한 데이터*
- *모든 검증 가능한 데이터* 가 *본인 계정에 자기 충족* 돼야 함
- *다른 계정 로그인 = 마찰* — 검증 속도 ↓

**해결** — GUUN 셀러용 booking 3 추가:
- pending 2개 — [확정] / [거절] 버튼 직접 테스트
- cancelled + rejectionReason 1개 — *이미 거절된* 상태 표시 검증 (시드 단계에 사유 박힘)

**Day 14 의 admin 검증 대기 service 2개 시드 와 같은 사고** — *Day 14 의 admin 검증 흐름 검증* 위해 시드에 *pending service 2개*. 같은 정신 — *기능 마다 시드 데이터 보장*.

**원칙**: "*시드는 기능의 거울*. *새 기능 도입* 시 *그 기능을 검증할 데이터* 가 시드에 *없으면 시드의 책무 불완전*. *Day 단위로 시드 점검* — 어제의 시드가 오늘의 기능을 *검증* 하는가? *자기 충족 시드 = 본인 계정 하나로 모든 화면 작동* 의 정신."

---

### 발견 10: ***두 번째 사용처 = 복붙 원칙*** 의 세 번째 적용

Day 21 의 *복붙* 영역들:
- `RejectBookingForm.tsx` ← admin/services/RejectForm.tsx 거의 동일
- `STATUS_LABEL` 라벨/색 ← seller + buyer 두 사용처 (이미 Day 13 부터 복붙)
- `cancelled + rejectionReason 분기` ← seller + buyer 두 사용처에 *같은 inline ternary*
- `extractRejectionReason` 함수 ← Day 18 audit-log 와 *완전 동일* + Day 21 activity-log

**왜 추출 X**:
- *두 번째 사용처 까진 복붙* — [[feedback-extraction-threshold]]
- *세 번째 도달 시점* 에 *비교 가능한 상태* → 그때 추출
- *진짜 같은 패턴인지* vs *겉만 비슷* 판별 = *비교 가능성*

**Day 21 후 추출 후보 (세 번째 도달 시점)**:
- `extractMetadataString<K>(metadata, key)` — extractRejectionReason + extractToggleTo 등 *metadata 키 추출* 일반화
- `RejectForm` 컴포넌트 — admin/seller 통합 (carry props: action, label, placeholder)
- `STATUS_LABEL` 의 *cancelled 분기 함수* — seller + buyer 통일

→ 다음 정리 Day 후보. *Day 22 가 정리 Day* 라면 이 추출 가능.

**원칙**: "*매 Day 의 복붙 = 다음 정리 Day 의 추출 후보*. *복붙의 의도적 보존* — *진화 여지* + *세 번째 비교*. *추출 너무 빠르면 잘못된 추상*, *너무 늦으면 진짜 패턴 묻힘*. *세 번째 도달* 이 *판별 가능 시점*."

---

## 🎓 새로 배운 개념 (Day 21)

### 계획 재검토 — 어제의 결정을 오늘 뒤집기
- *메모리는 맥락, 결정은 현재*
- *과거의 권장* 도 *근거 다시 따져* 가능

### Events 패턴의 *모델 재사용* (Day 19 추출과 다른 길)
- *세 번째 사용처가 같은 모델의 새 액션* → enum 확장
- *추출 vs 확장* — 코드 패턴 vs 모델 일반화

### `$transaction` 의 *분기 + 참조 동시*
- Day 18 (참조) + Day 20 (분기) → Day 21 (둘 다)
- updateMany 의 data 한계 → read-then-write 필요

### status 멱등 — where 조건으로 표현
- *현재값 read 거부* 와 *모순 X*
- *update 시점의 where 조건* 이 *race-safe 의 본질*

### Cancelled 의 의미 분기 — enum 분리 X
- *컬럼 유무* 로 *간접 구분*
- 학습 단계 단순화 + 미래 진화 여지 보존

### 본인 액션 reminder
- *내가 한 행동* 도 *본인 화면에 표시*
- *사유 박스 = 미래 자신을 위한 메모*

### 두 path 캐스케이드 revalidate
- *한 액션 → 두 사용자 group 화면*
- *영향 범위 모두 명시* 의 사고

### 환경 트러블슈팅
- *DB vs Client* 분리 인식 (부분 성공)
- *디스크 vs IDE 캐시* 분리 (TS Server 재시작)

### 자기 충족 시드
- *모든 화면이 본인 계정으로 검증 가능* 보장
- *기능 추가 시 시드 점검*

### 복붙 원칙의 의도적 보존
- *두 번째 까진 복붙 OK* 일관 적용
- *세 번째 도달 시점 = 추출 판별 시점*

---

## 📋 작성된 코드 핵심

```prisma
// schema.prisma — Booking 컬럼 + SellerActivity enum 확장
model Booking {
  ...
  rejectionReason   String?   // 셀러 거절 사유 (cancelled + reason 있음 = 셀러 거절)
}

enum SellerActivity {
  created
  updated
  toggled
  bookingConfirmed   // ← Day 21
  bookingRejected    // ← Day 21
}
```

```ts
// /seller/bookings/actions.ts — $transaction 의 분기+참조 의존성 완전체
export async function confirmBookingAction(formData: FormData) {
  const sellerProfile = await requireSellerProfile("/seller/bookings")
  const bookingId = extractBookingId(formData)
  if (bookingId === null) return

  await prisma.$transaction(async (tx) => {
    // 1) 본인 + pending read (보안 + 멱등 + serviceId/preferredDatetime 획득)
    const booking = await tx.booking.findFirst({
      where: { id: bookingId, sellerProfileId: sellerProfile.id, status: BookingStatus.pending },
      select: { id: true, serviceId: true, preferredDatetime: true },
    })
    if (!booking) return

    // 2) update — status: pending 한 번 더 (race-safe 보루)
    const { count } = await tx.booking.updateMany({
      where: { id: booking.id, status: BookingStatus.pending },
      data: {
        status: BookingStatus.confirmed,
        confirmedDatetime: booking.preferredDatetime,  // ← 참조
      },
    })
    if (count === 0) return

    // 3) 활동 로그
    await tx.sellerActivityLog.create({
      data: {
        sellerProfileId: sellerProfile.id,
        activity: SellerActivity.bookingConfirmed,
        serviceId: booking.serviceId,                  // ← 참조
        metadata: { bookingId: booking.id },           // ← 참조
      },
    })
  })

  revalidatePath("/seller/bookings")
  revalidatePath("/bookings")  // ← 캐스케이드
}
```

```tsx
// /seller/bookings/page.tsx — cancelled 의 의미 분기 + 본인 액션 reminder
const status =
  b.status === BookingStatus.cancelled && b.rejectionReason
    ? { text: "거절됨", className: "bg-rose-100 text-rose-700" }
    : STATUS_LABEL[b.status]

{b.status === BookingStatus.cancelled && b.rejectionReason && (
  <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
    <strong>거절 사유:</strong> {b.rejectionReason}
  </div>
)}

{b.status === BookingStatus.pending && (
  <>
    <form action={confirmBookingAction}>
      <input type="hidden" name="bookingId" value={b.id} />
      <button>확정</button>
    </form>
    <RejectBookingForm bookingId={b.id} />
  </>
)}
```

---

## 📁 변경된 파일

```
stylefit/
├── prisma/
│   ├── schema.prisma                                       — Booking.rejectionReason + SellerActivity 2 값
│   ├── migrations/20260521004827_add_booking_rejection_and_activity/
│   │   └── migration.sql                                   — 신규
│   └── seed.ts                                             — GUUN 셀러 booking 3개 (자기 충족 시드)
├── app/
│   ├── bookings/page.tsx                                   — buyer 측 라벨 분기 + 거절 사유 표시
│   └── seller/
│       ├── bookings/
│       │   ├── page.tsx                                    — [확정] / RejectBookingForm + 분기 + 사유
│       │   ├── actions.ts                                  — 신규 (confirm + reject)
│       │   └── RejectBookingForm.tsx                       — 신규 (admin RejectForm 복붙)
│       └── activity-log/page.tsx                           — enum 2 값 + 비고 컬럼 + extractRejectionReason
```

*총 8 파일 변경 (수정 5 + 신규 3).*

---

## 🚀 Day 22+ 미리보기

다음 방향 후보:
- *복붙 추출* (정리 Day) — `extractMetadataString<K>` + `RejectForm` 통합 + STATUS_LABEL 의 cancelled 분기. *세 사용처 도달 후 비교* 작업
- *페이지네이션* — Day 18/20 의 take 50 한계. 이제 *activity-log 데이터 양 증가* 로 *체감 가능* 해질 가능성
- *셀러 → 구매자 시간 협상* — confirmedDatetime 을 *다른 시간* 으로 제안. 메시지 스레드 활용

기능 → 정리 → 기능 리듬상 Day 22 = *정리* 차례. *복붙 추출* 자연 후보.

---

## 💡 Day 18·20·21 회고 — *events 패턴 세 번* + *의존성 유형 완전체*

| | Day 18 | Day 20 | Day 21 |
|---|---|---|---|
| 모델 | AuditLog (신규) | SellerActivityLog (신규) | SellerActivityLog (확장) |
| 대상 | polymorphic | 단일 (Service) | 단일 (Service + bookingId metadata) |
| 의존성 | 참조 | 분기 | 참조 + 분기 |
| 사용처 갯수 | 1 | 2 | 3 |
| 추출 트리거? | X (첫) | X (분리 결정) | X (모델 확장만) |
| metadata 키 | rejectionReason | to | bookingId + rejectionReason |

*세 Day 의 누적 학습* — events 패턴이 *모델 + 의존성 + 사용처 갯수* 의 세 축으로 진화. *진짜 같은 패턴* 이 *세 번째 사용처* 에서 *모델 재사용* 으로 흡수.

---

## ✅ 한 줄 요약

> **"*Day 20 plan 의 권장을 뒤집어* Booking 으로 갈아탐 — events 패턴의 *세 번째 사용처* 가 *enum 확장 (Day 21)* 으로 자연 흡수. *$transaction 의 분기+참조 의존성 동시* 등장. *cancelled 의 의미 분기를 rejectionReason 유무로* 간접 구분. *자기 충족 시드 + TS Server/EPERM 환경 트러블슈팅* 의 부수 학습."**

---

## 🧠 한 가지 회고 — *계획의 메타 학습*

Day 21 의 *진짜 핵심 학습* 은 *코드 외* — *어제의 결정을 오늘 검토하는 흐름*.

Day 20 plan 의 *Day 21 = 페이지네이션 권장* 이 *자동 명령* 처럼 작동할 수도 있었음. 하지만 사용자는 *어떻게 하지?* 라고 묻는 대신 *진행하자* 신호만 — AI 가 *기억의 권장을 그대로 따를지* 결정점이 됨.

**Pushback default ([[feedback-pushback-default]]) 가 여기서 작동**:
- *동의 메아리 금지* — *권장이 맞다* 라고 자동 동의 X
- *약점 먼저 찾기* — *두 사용처 추출 = Day 19 정신과 모순*
- *근거로 뒤집기* — *Booking 의 더 큰 가치* 제시

**디자이너의 *디자인 리뷰* 와 같은 결**:
- 어제 결정한 와이어프레임을 *오늘 다시 보면 어색한 부분* 발견
- *과거의 결정 = 그 시점의 정보 한계* 인 자료
- *지금 봤을 때 어색하면 뒤집기*

**AI 도 사람도 *기억의 함정***:
- *적힌 권장 = 안전한 길* 의 유혹
- *적힌 약속 = 의무* 의 오해
- *재검토 = 변덕* 의 부정적 인식

**Day 19 의 *세 번째 도달 후 추출*** + Day 21 의 *과거 결정 재검토* — *시간 차로 다시 보기* 의 두 사례. *비교 가능성 + 거리감* 이 *판단의 질* 결정.

코드의 *합리적 의사결정* 은 *코드 안에서만* 일어나지 않음. *어제의 plan + 오늘의 검토 + 시드 점검 + 환경 트러블슈팅* 모두 *코딩 학습* 의 부분. Day 21 의 8 단계 중 *0 단계 (계획 재검토)* 가 가장 중요한 단계였다고 회고.

---

*문서 끝. Day 22 으로 이어짐.*
