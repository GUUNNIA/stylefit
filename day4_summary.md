# Phase 1A — Day 4 완료 보고서

> 작성일: 2026-05-13
> 작업 범위: 시드 데이터 — 7개 테이블, 총 39개 행 자동 생성
> 학습자: 디자인 전공 / 코딩 4일째

---

## 🎯 큰 그림 — Day 4가 한 일

```
[Day 1] Next.js 환경 + 첫 화면
   ↓
[Day 2] Prisma + User 테이블
   ↓
[Day 3] 6개 테이블 추가 + 14개 FK + 3개 UNIQUE
   ↓
[Day 4] 빈 DB에 시드 데이터 39개 행 자동 생성  ← 지금
   ↓
[지금] 7개 테이블이 *진짜 마켓플레이스*처럼 보이는 상태
```

---

## 📅 Day 4 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | tsx 설치 (TypeScript 실행 도구) | dev dependency 추가 |
| 2 | `prisma/seed.ts` 파일 생성 + `package.json`에 `prisma.seed` 설정 | 빈 시드 실행 검증 통과 |
| 3 | User + SellerProfile 시드 | 9명 + 4개 |
| 4 | Service 시드 | 9개 (offline 1개 포함) |
| 5 | Booking 시드 + 비정규화 자동화 리팩토링 | 6개 (4가지 status 모두) |
| 6 | Review + MessageThread + Message 시드 + 시간 분산 | 3 + 2 + 6 |
| 7 | 시드 실행 + Prisma Studio 전체 데이터 검증 | 모든 모델 정상 |

---

## 🐛 Day 4 핵심 발견 — *사용자가 직접 짚은 이슈들*

이번 Day의 진짜 학습 가치는 *코드 한 줄씩 따라 친 게 아니라*, **이슈를 사용자가 직접 발견하고 깊이 들어간 패턴**이었음.

### 발견 1: "이걸 수기로 매번 확인해야 해?" — 비정규화 정합성

**문제**: Booking에 `sellerProfileId`가 비정규화로 중복 저장. Service의 셀러와 *수동으로 일치*시켜야 함. 데이터 100개면 검증 불가능.

**해결**: `sellerProfileId: profile1.id` → `sellerProfileId: portfolioReview.sellerProfileId`로 변경. Service 객체에서 *자동 추출*.

**핵심 통찰**: **Single Source of Truth** — *컴퓨터가 알 수 있는 정보를 사람이 또 적지 마라*. Service가 이미 알고 있는 셀러 정보를 Booking이 그대로 따라감.

### 발견 2: "lastMessageAt이 어떻게 채워져?" — 시간 모순

**문제**: Thread.lastMessageAt을 *Thread 생성 시점*에 채우면 → *Message.createdAt이 더 늦음* → 모순 데이터.

**해결**: Thread는 `lastMessageAt: null`로 만들고, 마지막 메시지 생성 후 `prisma.messageThread.update()`로 갱신.

**핵심 통찰**: **시드 = 미래 API의 예고편**. Day 5+에 "메시지 보내기 API" 만들 때 *똑같은 패턴*을 쓸 거. 시드에서 미리 체험.

### 발견 3: "createdAt이 다 동일?" — 시간 분산

**문제**: 메시지 6개의 createdAt이 *밀리초 단위*로만 다름. 진짜 대화처럼 안 보임.

**해결**: `minutesFromNow` 헬퍼 추가 + 각 메시지에 `createdAt` 명시 (2시간 동안의 분산).

**핵심 통찰**: **시드 데이터는 *미래 UI의 검증 자산***. "10분 전" 같은 상대 시간 UI를 검증하려면 *진짜 분산된 데이터*가 필요.

### 발견 4: "deleteMany 순서 헷갈려" — 영역별 그룹화

**문제**: `Message → Review → MessageThread → Booking → ...` 순서가 *FK 역순*은 맞지만 *Review가 Message·Thread 사이에 끼어* 가독성 ↓.

**해결**: *영역별로 묶기*. `메시지 영역 → 후기 영역 → 거래 영역 → 회원 영역`. 영역 순서가 *우연히* FK 역순과 일치.

**핵심 통찰**: *기계적 정답* vs *읽는 사람을 위한 가독성*. 디자이너 감각이 코드에 적용됨.

### 발견 5: "시간대는 어떻게?" — UTC vs 표시 시간대

**문제**: 메시지 시간이 다 다른데, 사용자 시간대 다르면 어떻게 처리?

**해결**: 학습 — JavaScript Date는 *UTC 단일 시점*. DB도 UTC로 저장. *표시할 때만* 사용자 시간대로 변환.

**핵심 통찰**: **저장은 일관(UTC), 표시는 사용자별 변환**. 시간 처리의 표준 패턴.

---

## 🎓 새로 배운 개념 (Day 4)

### Prisma 시드 인프라
- **tsx**: TypeScript 파일을 컴파일 없이 실행하는 도구
- **`package.json#prisma.seed`**: Prisma CLI가 자동 탐색하는 *전용 칸* (`scripts`와 다름)
- **`npx prisma db seed`**: 시드 실행. `migrate reset` 후 자동 호출됨

### Prisma 코드 패턴
- **`prisma.model.create({ data })`**: 행 생성, 반환값에 *모든 필드 포함*
- **`prisma.model.deleteMany()`**: 모든 행 삭제. FK 역순 필수
- **`prisma.model.update({ where, data })`**: 행 수정. `where`와 `data` 분리 구조
- **변수 저장**: `const x = await prisma.model.create(...)` — id 체인 연결의 기본
- **선택적 변수 저장**: *미래 사용처가 있는 만큼만* 변수에 잡기 (oversave 회피)

### 코드 구조 원칙
- **DRY (Don't Repeat Yourself)**: 같은 계산이 반복되면 *헬퍼 함수로 추출*
  - 예: `daysFromNow`, `minutesFromNow`
- **Single Source of Truth**: 같은 정보는 *한 곳에서만* 결정. 다른 곳은 자동 추출
  - 예: `sellerProfileId: portfolioReview.sellerProfileId`
- **의미 있는 변수명**: `service7` vs `youtubeEdit` — 후자가 *코드 자체로 의도 표현*
- **명시적 vs 묵시적**: nullable 필드는 *명시적으로 `null`* 적기 ("실수가 아닌 의도된 결정")
- **영역별 그룹화**: 코드를 *읽기 단위*로 묶음. 가독성·미래 확장성 ↑
- **리팩토링 원칙**: *외부 행동은 그대로, 내부 구조만 깔끔하게*

### 데이터 설계
- **비정규화의 비용**: 속도 ↑ 하지만 *정합성 책임*이 코드로 떠넘겨짐
- **의도된 다양성**: 시드 데이터는 *UI 검증 자산*. 일부러 다양하게 채움
  - online 8 + offline 1 (필터 검증)
  - approved 3 + pending 1 (어드민 화면 검증)
  - rating 4·5·3 (별점 분산)
  - status 4종 모두 커버
- **시간 정합성**: `createdAt < message.createdAt < lastMessageAt`
- **시간대 분리**: 저장은 UTC, 표시는 사용자 시간대

### TypeScript
- **일시적 hint**: "선언만 됐고 안 쓰임" 경고. 큰 변경을 *여러 Edit으로 나누면* 중간 상태에 발생. 마지막 Edit 후 사라지면 OK.

---

## 📋 시드 데이터 최종 구조

### User 9명
| # | 이름 | 역할 |
|---|---|---|
| 1~5 | 김민지, 박서연, 이도윤, 최하준, 정수아 | 구매자 |
| 6~9 | 강지원, 윤채린, 한태민, 오현우 | 셀러 (User만) |

### SellerProfile 4개
| 셀러 | specialty | verificationStatus |
|---|---|---|
| 강지원 | 디자인 컨설팅 | approved |
| 윤채린 | 웹사이트 제작 | approved |
| 한태민 | 영상 편집·제작 | approved |
| 오현우 | 블로그·콘텐츠 운영 | **pending** |

### Service 9개
- 강지원: 포트폴리오 리뷰 / 디자인 피드백 / 1:1 멘토링
- 윤채린: 랜딩 페이지 / 회사 사이트 / 디자인+개발 패키지
- 한태민: 유튜브 편집 / 1분 광고 / 행사 촬영(offline)
- 오현우: 0개 (pending이라 등록 X)

### Booking 6개
| # | 구매자 | 서비스 | status |
|---|---|---|---|
| 1 | 김민지 | 포트폴리오 리뷰 | pending |
| 2 | 박서연 | 랜딩 페이지 | confirmed |
| 3 | 이도윤 | 유튜브 편집 | completed |
| 4 | 최하준 | 1:1 멘토링 | completed |
| 5 | 정수아 | 회사 사이트 | completed |
| 6 | 김민지(재구매) | 1분 광고 | cancelled |

### Review 3개
| Booking | rating | 평가 |
|---|---|---|
| 3 (유튜브 편집) | 4 | 만족 |
| 4 (멘토링) | 5 | 매우 만족 |
| 5 (회사 사이트) | 3 | 보통 |

### MessageThread 2개 + Message 6개
- Thread #1: 박서연 ↔ 윤채린 (Booking 2 연결), 메시지 4개 (2시간 동안)
- Thread #2: 이도윤 ↔ 강지원 (사전 문의, Booking 없음), 메시지 2개 (어제)

---

## 🛠️ 자주 쓴 명령어 (Day 4)

```
# 패키지 설치
npm install --save-dev tsx --prefix stylefit

# 시드 실행
cd stylefit
npx prisma db seed

# 시각 확인
npx prisma studio
```

### 코드 패턴 자주 쓴 것
```ts
// 행 생성 + 반환값 잡기
const x = await prisma.model.create({ data: { ... } })

// 행 수정
await prisma.model.update({ where: { id }, data: { ... } })

// 모두 삭제 (FK 역순)
await prisma.child.deleteMany()
await prisma.parent.deleteMany()

// 날짜 헬퍼
daysFromNow(-10)      // 10일 전
minutesFromNow(-30)   // 30분 전
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/                       (Next.js 페이지들)
├── prisma/
│   ├── schema.prisma          (7개 모델 — Day 3에서 완성)
│   ├── seed.ts                ★ 새 파일 (~370줄)
│   ├── dev.db                 (실제 SQLite DB — 39개 행 채워짐)
│   └── migrations/
├── node_modules/
├── package.json               (수정 — prisma.seed + tsx 추가)
├── package-lock.json          (수정 — tsx 의존성)
└── .env
```

---

## 🚀 Day 5 미리보기 — API 엔드포인트

다음 작업: **Next.js Route Handlers로 API 작성**.

### 예상 작업
| 단계 | 내용 |
|---|---|
| 1 | API 폴더 구조 (`/api/users/`, `/api/sellers/` 등) |
| 2 | `GET /api/sellers` — 셀러 목록 조회 (필터·정렬) |
| 3 | `GET /api/sellers/[id]` — 셀러 상세 |
| 4 | `POST /api/auth/signup` — 회원가입 (NextAuth 검토) |
| 5 | Zod로 입력값 검증 시작 |

### Day 4가 Day 5에 미치는 영향
- *시드 데이터*가 *API 응답 검증*에 그대로 활용
- *시드의 변수 저장 패턴* → API 작성 시 익숙
- *prisma.update 패턴* → "메시지 보내기 API"에 그대로 적용
- *시간 분산 데이터* → "최근 메시지 정렬" API 검증 가능

---

## 💡 Day 4 협업 회고 — *코딩 4일째에 보여준 시니어급 사고*

| 발견 | 의미 |
|---|---|
| "9번이 왜 offline?" | *데이터 디자인 의도*를 묻기 |
| "이슈 없는지 확인해보자" | 코드 짜기 전 *결정사항 검증* |
| "수기 매번 확인해야 해?" | *자동화 추구* |
| "deleteMany 영역별 그룹화" | *코드 가독성* 디자이너 감각 |
| "createdAt이 다 동일?" | *데이터 정밀도* 관찰 |
| "시간대는 어떻게?" | *시스템 전체 관점* |

→ **한 단계마다 *왜*를 물었고, 그게 *학습 깊이*가 됐음.** Day 5에서도 같은 자세로.

---

## ✅ 한 줄 요약

> **"빈 DB에 39개 행이 코드 한 번으로 채워졌고, 그 과정에서 *시니어가 매일 쓰는 패턴 8가지*를 손으로 익혔다."**

- 단순 채우기가 아니라 *의도된 다양성*, *비정규화 자동화*, *시간 정합성*, *영역 그룹화*
- 진짜 비즈니스 흐름의 *미니어처*가 39개 행에 압축됨
- Day 5의 API는 이 데이터 *위에서* 진짜로 작동할 거

---

*문서 끝.*

*Day 4 완료. Day 5 (API 엔드포인트)로 갈 준비 됨.*
