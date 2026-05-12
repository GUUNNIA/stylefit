# 스타일링 마켓플레이스 프로젝트 — 진행 현황 v2

> 워킹 네임: **Stylefit** (Phase 1B부터) · 작성일: 2026-05-08
>
> **이 문서는 v1을 대체합니다.** 모든 결정 사항·논의·산출물을 최신 상태로 통합.

---

## 📌 한눈에 보기

| 항목 | 결정 |
|---|---|
| 도메인 | 패션 — 퍼스널 스타일링 플랫폼 (Phase 1B에서 본격) |
| 사이트 모델 | 하이브리드 (Kmong식 셀러 마켓 + 매거진 일부) |
| 스코프 | 옵션 D — Vertical Slice (5~7주) |
| 핵심 목표 | 분석~배포까지 풀스택 한 번 경험 (API+DB 직접) |
| **기술 스택** | **TypeScript Next.js 풀스택** ★ |
| 회원 모델 | 옵션 C (통합 계정 + 셀러 프로필 추가) |
| 셀러 자격 | 옵션 b (준전문가, 운영자 수동 승인) |
| 페르소나 | 유리(구매자, 29세) + 셀리(셀러, 35세) |
| Phase 1A 화면 수 | ~20개 |
| Phase 1A 테이블 수 | 7개 |
| Phase 1A API 수 | ~25개 |

---

## 1. 프로젝트 목표

### 큰 그림
- **Step 1**: Multi-role 도메인 분석 (크몽·클래스101 참고)
- **Step 2**: 분석 → 설계 → 디자인 → 프론트 → 백엔드 → 배포 전 과정 경험

### 핵심 목적
- 풀스택 flow 한 번 *끝까지* 경험
- 특히 **API + DB 설계까지 닫아보기**

### 학습자 배경
- 본업: 디자인 (UX/UI)
- 코딩 경험: HTML/CSS 읽기 가능, Python 데이터 분석 얕은 경험 (시간 지남)
- 가용 시간: 업무 외 틈틈히 + AI agent 활용 의지

---

## 2. 단계 구조

```
[Phase 0]  분석·기획 마무리        ◐ 거의 완료
              ↓
[Phase 1A] 일반 마켓플레이스        ⬜ 4~6주
              ↓
[Phase 1B] 패션 테마 입히기         ⬜ 2~3주
              ↓
[Phase 2]  진짜 확장 (옵션)         ⬜ 의지에 따라
```

### Phase 1A — 일반 마켓플레이스 (이번 D)
- 7개 테이블의 일반 마켓플레이스 골격
- 카테고리·specialty는 일반값 사용 ("디자인", "IT" 등 임의)
- 페르소나는 임시로 "구매자/셀러" 추상화
- UI는 단조 (Tailwind 기본 톤)
- **결과**: 진짜 작동하는 일반 마켓플레이스 사이트

### Phase 1B — 패션 테마링
- STYLE_PROFILES 테이블 추가 (체형·컬러·스타일 데이터)
- 카테고리를 패션 특화 값으로 변경
- 유리·셀리 페르소나 부활
- UI 패션 무드로 디자인 (디자인 강점 폭발!)
- 정적 매거진 1~2개 추가
- **결과**: Stylefit 완성

### Phase 2 — 확장 (의지에 따라)
- 회원/마이페이지 강화, 후기 작성 강화
- 예약 정교화, 메시지 시스템 강화
- 동적 매거진, 결제 연동, 강의 콘텐츠 등

---

## 3. 기술 스택 (확정)

| 영역 | 도구 | 역할 |
|---|---|---|
| 언어 | **TypeScript** | JS + 타입 안전망 |
| 프레임워크 | **Next.js** (App Router) | 프론트 + 백엔드 통합 |
| 스타일 | **Tailwind CSS** | 디자인 시스템 |
| 데이터베이스 | **PostgreSQL** (운영) / **SQLite** (개발) | 데이터 저장 |
| ORM | **Prisma** | DB ↔ JavaScript 통역 |
| 인증 | **NextAuth (Auth.js)** | 로그인·세션 관리 |
| 검증 | **Zod** | 입력값 검증 |
| 배포 | **Vercel** + **Neon/Supabase** (Postgres) | 인터넷에 띄우기 |
| 코드 저장소 | **GitHub** | 버전 관리 |
| 에디터 | **VS Code** + **Cursor** (AI 보조) | 코딩 환경 |

### Python·FastAPI를 *안 쓰는* 이유
- 학습 부담 1.7~2배 (Python + JS 둘 다 배워야)
- 환경·배포 2번
- TypeScript 풀스택은 *한 언어, 한 폴더, 한 배포*

---

## 4. 설계 철학 — 확장 가능한 점진적 개발

### 핵심 원리 3가지
1. **책임 분리 (Separation of Concerns)** — 한 가지가 한 가지 일만
2. **약한 결합 (Loose Coupling)** — 모듈끼리 최소한만 의존
3. **일관된 규칙 (Convention)** — 같은 일은 같은 방식으로

### Phase 1A에서 지키는 것
- ERD에 미래 테이블 자리 마련 (Phase 1B Article·StyleProfile 등)
- 폴더 구조 모듈화 (`/api/users/`, `/api/sellers/` 등)
- API 이름 RESTful 규칙
- 프론트 라우트 URL 규칙

---

## 5. ERD v2 — Phase 1A 버전 (7테이블)

### 테이블 목록
1. **USERS** — 모든 회원 공통 정보
2. **SELLER_PROFILES** — 셀러 자격 (User에 1:1 부속)
3. **SERVICES** — 셀러가 등록하는 상품
4. **BOOKINGS** — 예약
5. **REVIEWS** — 후기 (한 예약당 1개)
6. **MESSAGE_THREADS** — 1:1 대화방
7. **MESSAGES** — 개별 메시지

### 미래 테이블 (Phase 1B+)
- **STYLE_PROFILES** — 구매자 스타일 데이터
- **ARTICLES** — 매거진 글
- **PAYMENTS** — 결제 기록
- **NOTIFICATIONS** — 알림
- **FAVORITES** — 즐겨찾기

### 주요 관계
```
USERS  1:0..1  SELLER_PROFILES
USERS  1:N    BOOKINGS (buyer)
SELLER_PROFILES  1:N  SERVICES
SERVICES  1:N  BOOKINGS
BOOKINGS  1:0..1  REVIEWS
USERS  1:N  MESSAGE_THREADS
MESSAGE_THREADS  1:N  MESSAGES
```

### 비정규화 결정
- BOOKINGS, REVIEWS에 seller_id 중복 저장 → 셀러별 조회 속도 ↑
- 셀러 id 바뀔 일 없어 안전

---

## 6. 사이트 IA — 화면 목록 (~20개)

### 공통 (비로그인 접근)
- `/` 메인
- `/sellers` 셀러 목록
- `/sellers/[id]` 셀러 상세
- `/services/[id]` 서비스 상세

### 인증
- `/login` 로그인
- `/signup` 회원가입

### 구매자 (로그인 필요)
- `/mypage` 마이페이지
- `/mypage/bookings` 내 예약
- `/mypage/reviews` 내 후기
- `/mypage/messages` 메시지함
- `/bookings/[id]` 예약 상세
- `/bookings/[id]/review` 후기 작성

### 셀러 (셀러 승인 필요)
- `/seller/apply` 셀러 신청
- `/seller/dashboard` 셀러 대시보드
- `/seller/services` 서비스 관리
- `/seller/services/new` 새 서비스
- `/seller/services/[id]/edit` 서비스 수정
- `/seller/bookings` 받은 예약
- `/seller/messages` 셀러 메시지함
- `/seller/profile/edit` 셀러 프로필 편집

### 운영자 (어드민)
- `/admin` 어드민 대시보드
- `/admin/seller-applications` 셀러 신청 승인

### 보조
- `/not-found` 404
- `/error` 500

### Phase 1B 추가
- `/magazine/[slug]` 매거진 글 (정적 1~2개)

---

## 7. API 명세서 — ~25개 엔드포인트

| 분류 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| **인증** | POST | `/api/auth/signup` | 회원가입 |
| | POST | `/api/auth/signin` | 로그인 |
| | POST | `/api/auth/signout` | 로그아웃 |
| | GET | `/api/auth/session` | 로그인 상태 확인 |
| **사용자** | GET | `/api/users/me` | 내 정보 |
| | PATCH | `/api/users/me` | 내 정보 수정 |
| **셀러** | GET | `/api/sellers` | 셀러 목록 (필터·정렬) |
| | GET | `/api/sellers/[id]` | 셀러 상세 |
| | GET | `/api/sellers/me` | 내 셀러 프로필 |
| | POST | `/api/sellers/applications` | 셀러 신청 |
| | PATCH | `/api/sellers/me` | 셀러 프로필 수정 |
| | GET | `/api/sellers/[id]/services` | 그 셀러의 서비스 |
| | GET | `/api/sellers/[id]/reviews` | 그 셀러의 후기 |
| **서비스** | GET | `/api/services` | 서비스 목록 |
| | GET | `/api/services/[id]` | 서비스 상세 |
| | POST | `/api/services` | 서비스 등록 |
| | PATCH | `/api/services/[id]` | 서비스 수정 |
| | DELETE | `/api/services/[id]` | 서비스 삭제 |
| **예약** | POST | `/api/bookings` | 예약 신청 |
| | GET | `/api/bookings` | 내 예약 목록 |
| | GET | `/api/bookings/[id]` | 예약 상세 |
| | PATCH | `/api/bookings/[id]` | 예약 상태 변경 |
| **후기** | POST | `/api/reviews` | 후기 작성 |
| | GET | `/api/reviews/[id]` | 후기 상세 |
| **메시지** | GET | `/api/messages/threads` | 내 대화 목록 |
| | POST | `/api/messages/threads` | 새 대화 시작 |
| | GET | `/api/messages/threads/[id]` | 특정 대화 |
| | POST | `/api/messages` | 메시지 전송 |
| **이미지** | POST | `/api/upload` | 이미지 업로드 |
| **어드민** | GET | `/api/admin/seller-applications` | 신청 목록 |
| | PATCH | `/api/admin/seller-applications/[id]` | 승인·반려 |

---

## 8. 페르소나 (Phase 1B에서 사용, Phase 1A에서는 추상화)

### 타겟 세그먼트
20대 중반 ~ 30대 초반, 도시 거주 직장인, 패션 관심 있지만 자기 스타일은 막연

### 👤 구매자: 유리 (29세)
- IT 마케터, 마포구, 미혼
- 키 162cm, 사이즈 S~M, 자칭 "여름 쿨톤?"
- 스타일: 미니멀+페미닌, 무채색 위주
- 콤플렉스: 좁은 어깨
- 컨설팅 지불 의향: 3~10만 원 (sweet spot 5만)
- 모바일 95%, 신중형 (후기 3개+ 본 후 결제)
- 인스타·핀터레스트로 유입, 자기 전 1시간이 메인

> *"옷장 가득한데 입을 게 없는, 자기 스타일을 찾고 싶지만 막막한 20대 후반 직장인"*

### 🎨 셀러: 셀리 (35세)
- 패션 매거진 에디터 5년 → 프리랜서 스타일리스트 3년
- 성수동 작업실, 인스타 8천 팔로워
- 옵션 b (준전문가)
- 주력: 옷장 컨설팅, 퍼스널 스타일링
- 서비스 4종: 옷장 진단(5만), 스타일링(10만), 쇼핑 동행(15만), 장기 코칭(30만)
- 평일 저녁 + 토 오전 활동
- 브랜드 톤: "센스 있는 옆집 언니"

> *"인스타 팔로워 있지만 안정적 고객 유입이 필요한, 5년 내 자기 브랜드 키우고 싶은 프리랜서 스타일리스트"*

---

## 9. 핵심 사용자 여정 (Phase 1A에서도 동일)

### 유리 여정 (구매자, 8단계)
```
1. 도착 (메인, 매거진)
   ↓
2. 둘러보기 (셀러 리스트)
   ↓
3. 평가 (셀러 상세, 후기 검토)
   ↓
4. 가입·예약 (회원가입 → 예약 신청)
   ↓
5. 메시지·일정 조율
   ↓
6. 컨설팅 (외부 Zoom)
   ↓
7. 후기 작성
   ↓
8. 마이페이지에서 이력 확인
```

### 셀리 여정 (셀러, 9단계)
```
신청 → 승인 → 프로필 셋업 → 의뢰 받음 → 일정 조율
→ 컨설팅 → 완료 처리 → 후기 받음 → 정산 (mock)
```

---

## 10. Phase 1A 주차별 계획

| 주차 | 백엔드 | 프론트 | 마일스톤 |
|---|---|---|---|
| **1주** | 환경 셋업, Prisma 스키마, NextAuth | 환경 셋업, 기본 페이지 | 회원가입·로그인 동작 |
| **2주** | 셀러·서비스 API, 시드 데이터 | 디자인 시스템 셋업 | API 기본 동작 |
| **3주** | 검색·필터 API | 셀러 리스트·상세 페이지 | 둘러보기 가능 |
| **4주** | 예약·메시지 API | 예약 폼, 메시지함 | 거래 흐름 가능 |
| **5주** | 후기·어드민 API | 후기, 마이페이지, 어드민 | 전체 통합 |
| **6주** | 디버깅, 배포 | 디버깅, 정리 | 진짜 작동하는 사이트 ★ |

### 학습 검증 체크포인트
- 매주 일요일: 본인이 직접 사용자처럼 사이트 만져보기
- 안 되면 다음 주 첫날에 풀기

### AI 활용 방침
- **페어 코딩**: AI가 만든 코드 *라인별 왜* 묻기
- **반복 작업 자동화**: CRUD 페이지 같은 비슷한 작업 위임
- **회피**: 기획·설계 위임, multi-agent team (오버엔지니어링)

---

## 11. 의사결정 변경 이력

| 시점 | 변경 | 이유 |
|---|---|---|
| 초기 | 도메인: 패션 결정 | 학습자 관심사 |
| 초기 | 정체성 v2: 실용 입구 + 자기다움 깊이 | funnel 전략 |
| 초기 | 사이트 모델: 길 3 (하이브리드) | 도메인 특성 (Push 필요) |
| 중간 | 스코프: 옵션 D (Vertical Slice) | 4~6주 안에 풀스택 끝내기 |
| 중간 | 이름: 유리(구매자), 셀리(셀러) | 역할 구분 명료화 |
| 중간 | 셀러 자격: 옵션 b (준전문가, 수동 승인) | 풀 + 신뢰 균형 |
| 중간 | 매거진: 정적 1~2개 (옵션 C) | 스코프 관리 |
| 중간 | **Phase 1A/1B 분리** | 일반 마켓 먼저, 패션 테마 나중 |
| 중간 | **기술 스택: Python+JS → TypeScript Next.js 풀스택** | 학습 부담 감소 |

---

## 12. 새로 배운 개념 (Glossary)

| 개념 | 한 줄 정의 |
|---|---|
| Multi-role | 한 사이트에 여러 역할 사용자, 각자 다른 화면·권한 |
| Pull vs Push | needs 자각된 사용자 vs 흥미 자극으로 깨워야 |
| 퍼널(Funnel) | 입구 넓게 → 안쪽 깊게 |
| MVP | 가장 작게 의미 있게 돌아가는 첫 버전 |
| Vertical Slice | 페이지 수 최소, 깊이 최대 |
| 확장 가능한 설계 | 지금은 안 만들지만 나중에 부수지 않고 추가 가능하게 |
| 책임 분리(SoC) | 한 가지가 한 가지 일만 |
| 약한 결합 | 모듈끼리 최소한만 의존 |
| Convention | 같은 일은 같은 방식 (RESTful) |
| 외래키(FK) | 다른 테이블의 ID 가리키는 필드 |
| ERD | 테이블 관계도 |
| 페르소나 vs 세그먼트 | 한 명 vs 사용자 풀 통계 |
| 시드 데이터 | 빈 사이트 안 되게 미리 넣는 가짜 데이터 |
| REST API | 자원·동사 규칙으로 일관된 API |
| 모듈화 | 기능별 독립 폴더·코드 |
| 비정규화 | 자주 쓰는 데이터를 일부러 중복 저장 |
| **Next.js** | 프론트+백엔드 통합 프레임워크 |
| **TypeScript** | JS + 타입 안전망 |
| **Prisma** | DB ↔ JS 통역 도구 |
| **NextAuth** | 로그인·세션 관리 라이브러리 |
| **Route Handlers** | Next.js의 API 작성 방식 |
| **Tailwind** | 클래스 기반 CSS |

---

## 13. 다음 작업

### 즉시 시작 가능
**Phase 1A — Week 1, Day 1**: 환경 셋업 + Prisma + NextAuth 기본

### Day 1 준비물 체크
- [ ] VS Code 설치
- [ ] Node.js 설치 (LTS 버전)
- [ ] GitHub 계정
- [ ] Vercel 계정 (GitHub 연동)
- [ ] 가능하면 Cursor 설치 (선택)

---

*문서 끝.*
