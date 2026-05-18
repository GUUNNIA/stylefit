# Phase 1A — Day 12 완료 보고서

> 작성일: 2026-05-18
> 작업 범위: 큐레이션 컬렉션 (Collection 다대다) + /services 표시 분기 + 시드 비번 실제 해시 + 본인 시드 user 추가 + repo 정리
> 학습자: 디자인 전공 / 코딩 12일째

---

## 🎯 큰 그림 — Day 12가 한 일

```
[Day 8~11] 구매자가 *볼 수 있는 마켓* — 둘러보기·로그인·예약·내 예약
   ↓
[Day 12] 운영자 큐레이션 도입 — "어떤 서비스를 묶어 보여줄지" 결정 가능  ← 지금
   ↓
[Day 13 예정] 셀러 영역 도입 — 셀러가 *서비스를 등록*
```

Day 11까지의 핫·추천 섹션은 *정렬만 다르게* 한 임시방편. Day 12: **운영자가 *어떤 서비스를 어떤 컬렉션에 넣을지* 정하는 *진짜 큐레이션*** — 마켓의 *운영자 작동 영역* 도입.

---

## 📅 Day 12 작업 요약

### 핵심 작업 (3 커밋)

| 커밋 | 내용 |
|---|---|
| `294f0d0` | Day 12 본체 — Collection 다대다 + /services slug 필터 + 시드 비번 실제 해시 |
| `2177cc4` | repo 루트 `dev.db` 무시용 `.gitignore` 추가 |
| `68e5f70` | 시드에 본인 계정(GUUN) 추가 — buyer + seller 둘 다 작동 |

### 변경 요약
| 영역 | 추가/변경 |
|---|---|
| **schema + migration** | `Collection`, `ServiceCollection` (explicit 다대다, `displayOrder` 메타) |
| **/services 쿼리** | 핫·추천 섹션을 *정렬 트릭* → `collections.some.slug` 다대다 필터로 교체 |
| **시드** | user 비번 더미값(`"hashed_password_dummy"`) → 실제 `bcrypt.hash` (`seed1234!`), Collection 2 + ServiceCollection 6 추가, 본인 계정(GUUN) 추가 |
| **repo 정리** | 잘못된 위치(루트)에 생긴 빈 `dev.db` 삭제, 루트 `.gitignore`에 `/dev.db` 추가 |

---

## 🐛 Day 12 핵심 발견·논의

### 발견 1: Explicit vs Implicit 다대다 — *언제 어느 쪽*

Prisma에서 다대다 표현 두 가지:

| 방식 | 적용 |
|---|---|
| **Implicit** (Prisma 자동 생성 매핑 테이블) | 매핑 자체에 *메타데이터 없을 때* — 그냥 "연결 여부"만 |
| **Explicit** (직접 모델 정의) | *displayOrder*, *createdAt* 같은 *매핑 자체의 데이터*가 필요할 때 |

우리는 `ServiceCollection.displayOrder` (이 컬렉션에서 *몇 번째로 표시할지*) 가 필요 → **explicit**. 한 서비스가 *"추천에선 1번, 핫에선 3번"* 처럼 *컬렉션별 다른 순서*가 가능해짐.

```prisma
model ServiceCollection {
  collectionId Int
  serviceId    Int
  displayOrder Int      @default(0)  // ← 매핑 메타데이터
  createdAt    DateTime @default(now())

  collection   Collection @relation(fields: [collectionId], references: [id])
  service      Service    @relation(fields: [serviceId], references: [id])

  @@id([collectionId, serviceId])    // 복합 PK
  @@map("service_collections")
}
```

**원칙**: "*매핑 자체에 데이터가 붙으면 explicit*. 단순 연결이면 implicit." 학습 단계에 좋은 패턴.

### 발견 2: 다대다 필터 — `collections.some.collection.slug`

```ts
where: {
  isActive: true,
  collections: { some: { collection: { slug: "hot" } } },
}
```

읽기: "이 서비스의 *매핑(ServiceCollection) 중 *하나라도** *그 매핑의 collection.slug*가 'hot'이면" — **다대다 표준 표현**.

`.some` = "적어도 하나가 조건 만족". `.every` = "모두 만족". `.none` = "하나도 만족 X". 다대다·1-to-many 쿼리의 표준 도구.

### 발견 3: `User.deleteMany`의 *조용한 부작용* — 본인 계정도 같이

시드 코드 시작에 `prisma.user.deleteMany()` (DB 리셋). 사용자가 *회원가입했던 본인 계정*까지 같이 *날아감*.

→ **시드 후 본인 계정으로 로그인 시도 → "이메일 또는 비밀번호 올바르지 않습니다"** (user 자체가 없으니까).

이게 *user enumeration 방어와 결합*되어 *왜 안 되는지 표면적으론 모름*. 디버깅 단서: *시드를 돌리면 본인이 추가한 데이터도 같이 지워진다는 점*.

해결: **시드에 본인 계정 추가** (`68e5f70`):
- email: guun@forcs.com
- 역할: buyer + seller 둘 다 (SellerProfile + Service 1개)
- 매번 시드 돌려도 본인 로그인 유지

**원칙**: "*시드는 DB 전체 리셋*. 본인이 *영구 유지하고 싶은 데이터*는 시드에 포함하거나, 별도 보존 전략."

### 발견 4: `AUTOINCREMENT`는 `deleteMany`로 리셋되지 않음 → ID 79 *stale URL* 사건

시드 여러 번 돌리는 사이 ID 카운터가 계속 증가:
- 1회차: Service ID 1~10
- 2회차: ID 11~20
- ...
- N회차: ID 70~80

본인이 *과거 어느 시점에 /services/79* 페이지를 봤음 → 로그인 페이지로 튕겨나며 `?from=/services/79` URL에 박힘 → 로그인 후 *그 ID로 redirect* → **ID 79는 더 이상 존재 X** → 404.

이건 *버그가 아니라 SQL 표준 동작*. AUTOINCREMENT 카운터는 *FK 참조 안전성* 위해 *재사용 안 함*. 

**원칙**: "*DELETE 가 ID 재발급을 보장하지 않는다*. 외부에서 들고 있는 URL이 *DB 리셋 후 의미가 달라질 수 있음*. 디버깅 시 *데이터 라이프사이클*을 의심."

### 발견 5: bcrypt.hash 9번 호출의 함정 — 한 번만 계산 후 재사용

bcrypt.hash는 *의도적으로 느림* (~100ms). 시드의 9명 user에 각각 호출하면 *1초 가량 낭비*.

해결: **시드 시작 시 한 번만 hash 계산 후 모든 user에 재사용**:
```ts
const seedPasswordHash = await bcrypt.hash(SEED_PASSWORD_PLAIN, 10)
// ↓ 9명에게 재사용
const buyer1 = await prisma.user.create({
  data: { ..., passwordHash: seedPasswordHash },
})
```

**원칙**: "*비싼 작업은 외부 루프에서*. 같은 결과를 N번 계산하지 않음." 시드 학습 단계에 *bcrypt의 *의도된 느림*을 직접 체감*.

### 발견 6: `.gitignore`의 *자기 위치 기준* 패턴 해석

본인이 `stylefit/.gitignore`에 `/dev.db` 추가 → *무효*:
- `stylefit/.gitignore` 의 `/dev.db` = `stylefit/dev.db` 무시 (그런 파일 없음)
- 진짜 무시할 것 = repo 루트의 `dev.db` (`stylefit` 폴더 *바깥*)

해결: **repo 루트에 새 `.gitignore` 생성** + `/dev.db` 적음.

**원칙**: "*.gitignore 는 자기가 있는 디렉토리 기준*. 패턴 영향 범위는 *그 폴더 + 하위*. 다른 폴더는 *그 폴더의 .gitignore* 가 결정." 작은 차이지만 *작동 안 함*의 원인.

### 발견 7: portfolioReview를 *featured + hot 둘 다*에 넣어 다대다 검증

시드 디자인:
- featured 컬렉션 = 디자인 컨설팅 중심 (3개: portfolioReview, designMentoring, companySite)
- hot 컬렉션 = 영상·큰 작업 중심 (3개: youtubeEdit, adVideo, **portfolioReview**)

**portfolioReview가 양쪽에 등장** → 한 서비스가 *여러 컬렉션에 속할 수 있는* 다대다 관계의 *실제 작동 증거*. 화면에서 양쪽 섹션에 같은 카드 보임 = 검증 성공.

**원칙**: "*시드 데이터는 *모델 동작*까지 검증할 수 있어야 함*. *우연히 가능한 케이스*를 *의도적으로 시드에 넣어* 패턴 검증."

### 발견 8: 4장 그리드의 *디자인 폴리시 결정*

초기 hot 매핑 4개 → 화면 4장 → *4번째가 다음 줄에 외로이 떨어짐*. 디자인 전공자 시각에서 *그리드 깨짐*.

선택:
- (a) `take: 3` 추가 — 데이터 4개인데 화면 3개 = *불일치*
- (b) 시드 자체를 3개로 정리 — *데이터 = 화면*. 단순.

**(b) 선택**. 단 *다대다 검증을 위해 portfolioReview 보존* → landingPage를 빼고 portfolioReview displayOrder 3으로 옮김.

**원칙**: "*임시방편(take 3)*과 *데이터 정합*이 충돌할 때, *데이터 자체를 조정*하는 게 *나중 디버깅 비용 ↓*."

### 발견 9: `displayOrder` 컬럼 — *지금 안 쓰지만 두는 이유*

`ServiceCollection.displayOrder`를 추가했지만 *Day 12 쿼리는 `Service.id` 순으로 정렬*. *컬럼이 작동 안 함*.

TODO 주석으로 명시:
```ts
// TODO(나중): orderBy 를 ServiceCollection.displayOrder 기준으로 교체.
// 지금은 Service.id 순이라 매핑의 displayOrder 가 *반영 안 됨*.
```

이유 — Prisma의 *다대다 displayOrder 정렬 쿼리*가 *학습 점프 큼*. 본인이 *다른 곳에서도 다대다를 쓴 뒤*에 학습하면 *패턴이 자리잡힘*.

**원칙**: "*컬럼은 있지만 안 쓰는 상태*는 *TODO 주석 필수*. 미래의 본인이 *왜 이게 있지?* 헷갈리지 않게."

---

## 🎓 새로 배운 개념 (Day 12)

### Prisma Explicit 다대다 모델
- `@@id([fk1, fk2])` 복합 기본 키
- 매핑 테이블에 *추가 컬럼* 정의 가능 (displayOrder 등)

### `collections: { some: { collection: { slug } } }` 패턴
- 다대다 필터 표준 표현
- `.some` = 적어도 하나 만족, `.every` = 모두 만족, `.none` = 하나도 X

### bcrypt 시드 적용 + 재사용 최적화
- `bcrypt.hash(plain, 10)` — saltRound 10
- 시드 9명에 *한 번 계산 후 재사용* → 100ms × 9 절약

### AUTOINCREMENT 동작
- `DELETE` 해도 카운터 리셋 X
- FK 안전성 위한 *의도적 동작*
- ID는 *재사용 안 됨* 가정으로 코드 작성

### `.gitignore` 위치별 적용 범위
- 자기 디렉토리 기준 패턴 해석
- `/dev.db` = *자기 폴더의 루트* dev.db
- 다른 폴더는 *그 폴더의 .gitignore* 또는 *상위* 적용

### Prisma `updateMany` (시드에서 일괄 업데이트)
- 위 방식의 *효율적인 일괄 처리*
- 시드의 *전체 service를 approved로 표시* (Day 13에 추가)

### Prisma migrate dev 워크플로
- schema 변경 → `npx prisma migrate dev --name <설명>`
- 마이그레이션 SQL 자동 생성 + 적용 + Prisma Client 재생성

### Day 8~11 패턴 *적용*
- DAL (`verifySession`) — 사용 안 함 (Day 12 작업이 *공개 화면 데이터*만 다룸)
- 다음 Day부터 *셀러 영역*에 DAL 확장 (`requireSellerProfile`)

---

## 📋 작성된 코드 핵심

```prisma
// prisma/schema.prisma — Day 12 추가
model Collection {
  id           Int                 @id @default(autoincrement())
  slug         String              @unique  // URL 식별자 ("featured", "hot")
  name         String              // 화면 표시 이름
  displayOrder Int                 @default(0)
  services     ServiceCollection[] // 다대다
  @@map("collections")
}

model ServiceCollection {
  collectionId Int
  serviceId    Int
  displayOrder Int      @default(0)  // ← 매핑 메타
  collection   Collection @relation(fields: [collectionId], references: [id])
  service      Service    @relation(fields: [serviceId], references: [id])
  @@id([collectionId, serviceId])    // 복합 PK
  @@map("service_collections")
}
```

```ts
// app/services/page.tsx — Day 12 변경 (핵심)
const [hot, featured, all] = await Promise.all([
  prisma.service.findMany({
    where: {
      isActive: true,
      collections: { some: { collection: { slug: "hot" } } },  // ← 다대다 필터
    },
    include: SECTION_INCLUDE,
    orderBy: { id: "asc" },
  }),
  // featured 동일 패턴, slug 만 다름
  // all 은 그대로
])
```

```ts
// prisma/seed.ts — Day 12 패턴
// 1) 비번 hash 한 번만 계산 후 재사용
const seedPasswordHash = await bcrypt.hash(SEED_PASSWORD_PLAIN, 10)

// 2) Collection 2 + ServiceCollection 6 매핑 생성
const featuredCollection = await prisma.collection.create({
  data: { slug: "featured", name: "에디터 추천", displayOrder: 1 },
})
const hotCollection = await prisma.collection.create({
  data: { slug: "hot", name: "지금 핫한 서비스", displayOrder: 2 },
})

// 3) 매핑 — portfolioReview를 featured + hot 둘 다에 넣어 다대다 검증
await prisma.serviceCollection.createMany({
  data: [
    { collectionId: featuredCollection.id, serviceId: portfolioReview.id, displayOrder: 1 },
    // ... featured 3개
    { collectionId: hotCollection.id, serviceId: portfolioReview.id, displayOrder: 3 },  // ← 양쪽 노출
    // ... hot 3개
  ],
})
```

---

## 📁 현재 폴더 상태 (Day 12 추가분 ★)

```
프로젝트 루트/
├── .gitignore                                ★ Day 12 (루트 dev.db 무시)
└── stylefit/
    ├── prisma/
    │   ├── schema.prisma                     — Collection, ServiceCollection 추가 (Day 12)
    │   ├── seed.ts                           — bcrypt 적용 + Collection 시드 + 본인 계정 (Day 12)
    │   └── migrations/
    │       └── 20260518071744_add_collections/  ★ Day 12
    └── app/
        └── services/
            └── page.tsx                      — slug 필터 + TODO 주석 (Day 12)
```

---

## 🚀 Day 13 미리보기 — 셀러 영역

Day 12 마무리 시점에서 정해진 다음 단계:
- **DAL 확장** — `requireSellerProfile(returnUrl)` 도입 (throw 스타일)
- **셀러 페이지 2개** — `/seller/services` (본인 등록 서비스), `/seller/bookings` (받은 예약)
- **셀러 등록 폼** — `/seller/services/new` (Server Action + Client Form)
- **Service 검증 상태** — `verificationStatus` 컬럼 추가 (default pending), 표시 분기
- **(미룸) Admin 검증 워크플로** — Day 14로

---

## 💡 Day 11 → 12 회고 — *마켓의 *운영자 시각*이 추가됨*

| Day | 한 줄 | 주체 |
|---|---|---|
| 8~11 | 구매자가 마켓에서 행위 (둘러보기·예약·추적) | 구매자 |
| 12 | 운영자가 큐레이션 결정 + 시드/repo 정리 | 운영자 (간접) |
| 13~ | 셀러가 서비스 등록 + 받은 예약 관리 | 셀러 |

Day 12는 *코드 분량은 적었지만* — 시드·repo·데이터 모델의 *정리* 같은 *눈에 잘 안 띄는 작업*이 컸음. 이런 *정리 단계*가 다음 Day의 *큰 작업*에 *기초*가 됨.

---

## ✅ 한 줄 요약

> **"마켓 운영자가 *어떤 서비스를 어디에 묶을지* 결정할 수 있게 된다 — 한 서비스가 *추천에도 핫에도* 들어가는 다대다의 진짜 작동."**

---

## 🧠 한 가지 회고 — *작은 정리가 모이는 가치*

Day 12는 *큰 새 기능* 보다는 *Day 8~11에서 쌓인 결정들의 정리*에 가까움:
- 시드 비번 더미값 → 실제 hash (Day 5에 적어둔 *TODO*가 *Day 12에 해소*됨)
- 본인 계정 시드 추가 (Day 11까지 *매번 회원가입 다시*하던 마찰)
- .gitignore 정리 (*우연히 생긴 dev.db* 같은 *잘못된 부산물* 정리)
- TODO 주석 (displayOrder 미적용을 *명시*)

이런 *작은 정리*가 모이지 않으면 *Day 13의 큰 작업*에서 *예상치 못한 디버깅*에 시간을 쓰게 됨. **건강한 코드베이스는 *주기적 청소*에서 나옴.**

---

*문서 끝. Day 13으로 이어짐 — 셀러 영역 도입.*
