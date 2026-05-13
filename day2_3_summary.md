# Phase 1A — Day 2 & Day 3 완료 보고서

> 작성일: 2026-05-12
> 작업 범위: Prisma 셋업 (Day 2) + 7개 테이블 스키마 완성 (Day 3)
> 학습자: 디자인 전공 / 코딩 3일째

---

## 🎯 큰 그림 — 두 날 동안 한 일

```
[Day 1까지] Next.js 환경 + 첫 화면
   ↓
[Day 2] Prisma + User 테이블 + 진짜 DB 파일 생성
   ↓
[Day 3] 6개 테이블 추가 + 14개 외래키 + 3개 UNIQUE 제약
   ↓
[지금] 우리 ERD가 진짜 작동하는 DB로 살아있음
```

---

## 📅 Day 2 — Prisma 셋업 + 첫 테이블

### 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | Prisma 설치 | npm install prisma + @prisma/client |
| 2 | Prisma 초기화 (--datasource-provider sqlite) | schema.prisma, .env 생성 |
| 3 | User 모델 작성 (9개 필드) | 컨벤션 적용 (camelCase, @@map) |
| 4 | 마이그레이션 실행 | dev.db 생성, users 테이블 추가 |
| 5 | Prisma Studio로 시각 확인 | 빈 User 테이블 확인 |

### Day 2 핵심 디버깅 — 5단계 마라톤

#### 단계 1: Prisma 7 너무 새 버전
- **증상**: validation error, `accelerateUrl` 언급
- **원인**: Prisma 7 (2025년 11월 출시)에서 config 위치 변경
- **해결**: Prisma 6으로 다운그레이드

```
npm uninstall prisma @prisma/client
npm install prisma@6 --save-dev
npm install @prisma/client@6
```

#### 단계 2: prisma.config.ts 잔존
- **증상**: "skipping environment variable loading"
- **원인**: Prisma 7이 만든 config 파일이 남아 .env 로딩을 막음
- **해결**: prisma.config.ts 삭제

#### 단계 3: .env 안의 Postgres URL 숨겨져 있음
- **증상**: "URL must start with file:"
- **원인**: Prisma 7 초기화 시 자동 입력된 PostgreSQL URL이 위쪽에 남아있음
- **해결**: .env 완전히 새로 작성

```
# Database
DATABASE_URL="file:./dev.db"
```

#### 단계 4: provider 이름 충돌
- **증상**: "output path required for prisma-client generator"
- **원인**: Prisma 7 표기법 (prisma-client)을 Prisma 6이 못 알아봄
- **해결**: provider를 prisma-client-js로 변경

#### 단계 5: node_modules 통째 정리
- **상황**: 여러 시도 후 의존성 꼬임
- **해결**: node_modules + package-lock.json 삭제 후 재설치

```
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
npx prisma generate
npx prisma migrate dev --name init
```

### Day 2의 진짜 교훈

| 교훈 | 내용 |
|---|---|
| 최신이 항상 좋은 건 아니다 | 학습 프로젝트는 안정된 인기 버전 |
| 에러 메시지 한 줄씩 읽기 | "skipping env"가 결정적 단서 |
| 원인이 멀리 있을 수 있다 | 증상(URL 형식)과 원인(config 파일)이 떨어짐 |
| 터미널 명령으로 직접 확인 | VS Code 화면만 믿지 말고 Get-Content로 확인 |
| 통째 다시도 답 | 작은 디버깅 5번 실패 시 재시작 검토 |

---

## 📅 Day 3 — 6개 테이블 추가

### 작업 요약

| Step | 작업 | 결과 |
|---|---|---|
| 1 | SellerProfile 모델 추가 (User 1:1) | verificationStatus 등 9개 필드 |
| 2 | Service 모델 추가 (1:N) | serviceType, category 포함 |
| 3 | Booking 모델 추가 (3개 FK) | 비정규화로 sellerProfileId 중복 저장 |
| 4 | Review 모델 추가 (Booking 1:1) | bookingId @unique 적용 |
| 5 | MessageThread + Message 모델 추가 | 1:N + 1:N 복합 관계 |
| 6 | 마이그레이션 실행 | dev.db에 6개 테이블 추가 |
| 7 | Prisma Studio로 7개 모델 시각 확인 | 모든 테이블 정상 |

### Day 3 핵심 디버깅 — 1:1 관계의 @unique

#### 발생한 문제
마이그레이션 검증 시 다음 에러:

```
MessageThread와 Booking의 1:1 관계에서
relatedBookingId에 @unique 속성이 필요합니다.
```

#### 원인
Prisma는 1:1 관계를 만들 때 FK 컬럼에 @unique 가 필수.

- @unique 없으면 → 같은 값 여러 번 가능 → 1:N
- @unique 있으면 → 같은 값 한 번만 → 1:1

#### 해결
한 줄 수정:

```
relatedBookingId Int? @unique
```

#### 학습 가치
1:1 관계의 핵심 원리를 실전에서 체득.

---

## 🗄️ 최종 schema — 7개 모델 구조

### 1. User (사용자)
모든 회원 공통 정보 + 셀러 자격은 별도 부속

**관계:**
- 1:1 SellerProfile (선택)
- 1:N Booking (구매자로)
- 1:N Review (작성자로)
- 1:N MessageThread (구매자로)
- 1:N Message (발신자로)

### 2. SellerProfile (셀러 프로필)
셀러 자격이 있는 User에게 1:1 부속

**관계:**
- 1:1 User
- 1:N Service
- 1:N Booking
- 1:N Review
- 1:N MessageThread

### 3. Service (서비스)
셀러가 등록하는 상품 (스타일링, 컨설팅 등)

**관계:**
- N:1 SellerProfile
- 1:N Booking

### 4. Booking (예약)
구매자가 셀러의 서비스를 예약

**관계:**
- N:1 User (buyer)
- N:1 Service
- N:1 SellerProfile (비정규화)
- 1:0..1 Review (후기는 선택)
- 1:0..1 MessageThread (대화는 선택)

### 5. Review (후기)
한 예약당 후기 1개

**관계:**
- 1:1 Booking (UNIQUE 제약)
- N:1 User (작성자, 비정규화)
- N:1 SellerProfile (비정규화)

### 6. MessageThread (대화방)
구매자와 셀러 사이의 1:1 대화

**관계:**
- N:1 User (구매자)
- N:1 SellerProfile (셀러)
- 0..1:1 Booking (선택, UNIQUE)
- 1:N Message

### 7. Message (개별 메시지)
대화방 안의 각 메시지

**관계:**
- N:1 MessageThread
- N:1 User (발신자)

---

## 🔗 외래키(FK) 자동 생성 — 14개

| FK | 참조 | 관계 |
|---|---|---|
| seller_profiles.userId | users.id | 1:1 |
| services.sellerProfileId | seller_profiles.id | 1:N |
| bookings.buyerId | users.id | N:1 |
| bookings.serviceId | services.id | N:1 |
| bookings.sellerProfileId | seller_profiles.id | N:1 |
| reviews.bookingId | bookings.id | 1:1 UNIQUE |
| reviews.buyerId | users.id | N:1 |
| reviews.sellerProfileId | seller_profiles.id | N:1 |
| message_threads.buyerId | users.id | N:1 |
| message_threads.sellerProfileId | seller_profiles.id | N:1 |
| message_threads.relatedBookingId | bookings.id | 0..1:1 |
| messages.threadId | message_threads.id | N:1 |
| messages.senderId | users.id | N:1 |

## 🔒 자동 생성된 UNIQUE 인덱스 — 3개

| 인덱스 | 의미 |
|---|---|
| seller_profiles.userId_key | User당 SellerProfile 1개 보장 |
| reviews.bookingId_key | 예약당 후기 1개 보장 |
| message_threads.relatedBookingId_key | 예약당 대화방 1개 보장 |

---

## 💡 새로 배운 개념

### Prisma 관계
- 1:1 관계: FK 컬럼에 @unique 필수
- 1:N 관계: 양쪽 모델에 양방향 표기
- 다중 관계: @relation("이름") 으로 구분 (BookingBuyer, ReviewBuyer 등)

### 비정규화 (Denormalization)
원래 한 곳에 있어야 하지만 자주 쓰면 중복 저장.

**예시**: Booking에 sellerProfileId 중복 저장
- 정상 경로: Booking → Service → SellerProfile (테이블 2번 거침)
- 비정규화: Booking → sellerProfileId 바로 접근 (속도 빠름)

### @@map 컨벤션
- 모델 이름 (코드용): 대문자 단수 (User)
- 테이블 이름 (DB용): 소문자 복수 (users)

```
model User {
  ...
  @@map("users")
}
```

### Soft Delete vs Hard Delete
우리 DB는 isActive 필드로 soft delete 가능.
- isActive = true: 활성 계정
- isActive = false: 삭제된 것처럼 처리 (실제 삭제 안 함)

### 마이그레이션은 데이터 보존
테이블 추가/수정 시 기존 데이터는 유지됨. 이번 Day 3 마이그레이션 후에도 Day 2의 유리 데이터가 그대로 살아있음.

---

## 🛠️ 자주 쓴 명령어 모음

### 환경 셋업
```
npm install prisma --save-dev
npm install @prisma/client
npx prisma init --datasource-provider sqlite
```

### 마이그레이션
```
npx prisma migrate dev --name 이름
```

### DB 시각 확인
```
npx prisma studio
```

### 클라이언트 재생성
```
npx prisma generate
```

### Git 백업 (매번 작업 후)
```
git add .
git commit -m "메시지"
git push
```

### PowerShell 디버깅
```
Get-Content .env
echo $env:DATABASE_URL
```

### 환경 초기화 (극단 상황)
```
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

---

## 📁 현재 폴더 상태

```
stylefit/
├── app/                 (Next.js 페이지들)
├── prisma/
│   ├── schema.prisma   (7개 모델 정의)
│   ├── dev.db          (실제 SQLite DB 파일)
│   └── migrations/
│       ├── 20260512091411_init/
│       └── 20260512101632_add_remaining_models/
├── node_modules/        (외부 라이브러리)
├── public/
├── .env                 (DATABASE_URL)
├── package.json
└── ... (Next.js 기본 파일들)
```

---

## 🚀 Day 4 미리보기 — 시드 데이터

다음 작업: 빈 테이블에 가짜 데이터를 코드로 채우기.

### 예상 작업

| 단계 | 내용 |
|---|---|
| 1 | prisma/seed.ts 파일 생성 |
| 2 | package.json에 seed 명령 추가 |
| 3 | 가짜 사용자 5~10명 생성 코드 |
| 4 | SellerProfile 4~5개 |
| 5 | Service 10~15개 |
| 6 | 가짜 Booking, Review, Message 약간 |
| 7 | npx prisma db seed 실행 |
| 8 | Prisma Studio로 데이터 시각 확인 |

### 시드 데이터의 가치
- 진짜 사이트처럼 보이는 빈 화면 해결
- 프론트엔드 개발 시 즉시 데이터 활용 가능
- 팀 공유 시 재현 가능
- 수동 입력보다 빠르고 안전

---

## ✅ 학습 마일스톤 — 코딩 3일째 도달 지점

```
[기획] 완료
├─ 도메인, 정체성
├─ 사이트 모델, 페르소나
├─ ERD v2 (7개 테이블)
├─ API 명세 (~25개)
├─ 사이트 IA (~20개 페이지)
└─ 기술 스택 (TypeScript Next.js 풀스택)

[개발] 진행 중
├─ Day 1: 환경 셋업, Next.js 첫 화면 ✅
├─ Day 2: Prisma + User 테이블 ✅
├─ Day 3: 6개 테이블 + 14개 FK + 3개 UNIQUE ✅ ← 지금
├─ Day 4: 시드 데이터 (예정)
├─ Day 5~: API 엔드포인트 (예정)
└─ Day N~: 프론트엔드 화면 구현 (예정)
```

**3일째에 백엔드 인프라 핵심 완성**. 일반적인 학습 속도로는 1~2주 분량.

---

## 📋 다음 세션 시작 전 체크리스트

다음 세션 시작하실 때:

1. VS Code 열기
2. File → Open Recent → stylefit
3. 터미널 열기, 위치가 stylefit인지 확인
4. (옵션) npm run dev로 개발 서버 확인
5. Claude.ai 또는 Claude Code에 "Day 4 시드 데이터부터 시작하자" 라고 시작

또는 Claude Code에 다음 메시지 복사:

```
Day 3 끝났고 7개 테이블 다 잘 만들어져 있어.
project_summary_v2.md 와 day2_3_summary.md 읽고 진행 상황 파악해줘.

오늘 Day 4 목표:
- prisma/seed.ts 작성
- 가짜 데이터 채우기 (구매자 5명, 셀러 4명, 서비스 10개, 예약 몇 개, 후기 몇 개)
- npx prisma db seed 실행
- Prisma Studio로 시각 확인

우리 결정사항 (Prisma 6, SQLite, camelCase, 한국어 주석) 지켜줘.
각 단계마다 한국어로 설명하면서 진행하고, 큰 결정 전에는 내 승인 받아줘.
```

---

## 🎓 코딩 3일째 본인 평가

### 진짜 큰 성취
- 디버깅 마라톤 5단계 완주 (Day 2)
- 1:1 관계의 핵심 원리 실전 체득 (Day 3)
- AI와 협업하는 진짜 페어 코딩 방식 익힘
- DB 설계 ↔ 코드 ↔ 진짜 DB 한 흐름으로 완주

### 새로 익힌 습관
- 터미널 명령으로 직접 확인하기
- 에러 메시지 한 줄씩 차분히 읽기
- AI에 명령할 때 결정사항 명시하기
- Keep 누르기 전에 코드 한 번 보기
- 작업 후 GitHub에 백업하기

### 다음 세션 만나기 전까지
- 푹 쉬기 (가장 중요)
- 코드는 GitHub에 안전하게 백업됨
- 컴퓨터 꺼도 dev.db 그대로 살아있음
- 부담 갖지 말기. 다음 만남이 더 부드러울 거예요

---

*문서 끝.*

*Day 2 & 3 완료. Day 4로 갈 준비 됨.*
