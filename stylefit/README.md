# 멀티롤 마켓플레이스 골격 (Phase 1A)

> 워킹 네임 *Stylefit* (코드베이스 폴더명). Phase 1B 의 *패션 테마링* 단계부터 의미를 가짐.

**셀러 ↔ 바이어 ↔ 운영자** 의 세 역할이 *한 코드베이스* 에 공존하는 일반 마켓플레이스 골격.
어떤 전문 서비스 도메인 (패션 / 의료 / 법률 / 컨설팅 등) 도 *위에 입힐 수 있도록* 설계된
도메인 중립 템플릿.

## 단계

| Phase | 내용 | 상태 |
|---|---|---|
| **1A** | 도메인 중립 마켓플레이스 골격 (7 테이블, ~20 화면) | **진행 중** (Day 32, 2026-05-22) |
| 1B | 패션 테마 입힘 — `STYLE_PROFILES` 추가, 카테고리·UI 패션화 | 예정 |
| 2 | 결제 / 알림 / 매거진 등 확장 | 의지에 따라 |

현재 시드 데이터의 카테고리는 *"디자인" "IT 컨설팅"* 같은 임의값 — Phase 1A 의 *도메인 중립* 정신.

## 세 역할

- **Buyer** — 서비스 둘러보기, 예약·메시지·후기 작성
- **Seller** — 서비스 등록·관리, 받은 예약 처리, 활동 이력
- **Admin** — 셀러·서비스 검증, 감사 로그 추적

## 기술 스택

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5
- **ORM/DB**: Prisma 6 + SQLite (학습용 로컬)
- **Styling**: Tailwind CSS v4 + next-themes (다크 모드 의미 토큰)
- **Auth**: JWT (jose) + bcrypt
- **Validation**: Zod

## 셋업

```bash
npm install

cp .env.example .env
# .env 의 SESSION_SECRET 채우기 — 생성 명령은 .env.example 안내 참조

npm run db:migrate
npm run db:seed

npm run dev
```

http://localhost:3000 에서 확인.

## 주요 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `start` | 프로덕션 빌드 / 실행 |
| `npm run typecheck` | tsc --noEmit (타입 검사만) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma 마이그레이션 (dev) |
| `npm run db:seed` | 시드 데이터 주입 |
| `npm run db:reset` | DB 초기화 + 마이그레이션 + 시드 |
| `npm run db:studio` | Prisma Studio (DB GUI, 5555 포트) |

## 디렉토리

```
app/
├── login, signup, services, bookings   # buyer 화면 (루트 직속)
├── seller/                              # 셀러 화면
├── admin/                               # 운영자 화면
└── lib/                                 # auth, db, url-filter, metadata 등 공통
prisma/
├── schema.prisma                        # User, Service, Booking, Review, Message, AuditLog 외
└── seed.ts                              # 학습용 시드 데이터
```

## 학습 프로젝트 컨텍스트

디자인 전공자의 *Day 단위 누적 학습* (Day 1~32). 의식적 원칙:

- **세 사용처 추출** — 두 번째까진 복붙, 세 번째에서 추출 (url-filter, AlertBox, PageTabs, PagePoller).
- **얕은 추출** — 같은 함수에 묶지 말고 헬퍼로 분리 (`metadata.ts`, `chipClass`).
- **enum 도메인 분리** — 값이 같아도 의미가 다르면 분리 (Seller/ServiceVerificationStatus).
- **다크 의미 토큰** — `bg-primary` 같은 의미 클래스 + Tailwind v4 `@custom-variant` 다크 분기.
- **확장 가능한 점진적 개발** — Phase 1A 에서 *Phase 1B 자리 미리 마련* (ERD, 폴더 구조).

매 Day 변경은 커밋 메시지 `Day NN: ...` 와 PR 단위로 추적.
