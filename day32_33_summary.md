# Phase 1A — Day 32~33 완료 보고서 (묶음)

> 작성일: 2026-05-22
> 작업 범위: 환경설정 영구 해결 (Day 32) → README 갱신 (Day 33)
> 학습자: 디자인 전공 / 코딩 32~33일째

---

## 🎯 큰 그림 — 묶음 3 이 한 일

```
[Day 26~31] 다크/디자인/페이지네이션/메시지/실시간 — 큰 도메인/시스템 작업
   ↓
[Day 32] 환경설정 정리 — .env.example + npm scripts 확장 + .gitignore 예외, 3 파일  ← Day 24~ 부터 미뤄둔 빚 청산
   ↓
[Day 33] README 갱신 — Next.js 기본 → 멀티롤 마켓플레이스 골격 정체성, 1 파일  ← chipClass 응급 자연 흡수 확인
   ↓
[Day 34+ 예정] 진짜 실시간 (SSE) / 페이지네이션 추출 / 디자인 2차
```

**두 Day = *공개 준비 짝*** — 환경 (Day 32) + 문서 (Day 33) 가 *clone → README 읽기 → .env.example 복사 → npm scripts 실행* 흐름의 양 날개. 한쪽만 있으면 *가치 절반*. *기능적으로 결합* 된 두 작업이 *시간상 인접* 한 게 자연.

**큰 도메인 사이의 *호흡 Day*** — Day 26~31 의 *6 Day 큰 작업* 후 *작은 정리 2 Day*. 학습의 *호흡 곡선* 일관 (Day 23 정리 / Day 29 페이지네이션 호흡 조절 과 같은 결).

**의식적 부채 청산** — Day 24 부터 매 plan 의 *작업 후보* 에 *환경설정 영구 해결* / *README 갱신* 명시되어 있었으나 *기능 우선* 으로 계속 미뤄짐. Day 32~33 이 *6+ Day 미뤄둔 부채* 의 청산. *부채 명시 → 적절한 시점 청산* 의 학습 패턴.

---

## 📅 Day 32 작업 요약 — 환경설정 정리 (Day 24~ 빚 청산)

### 작업 단계 (7)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 사용자 명시 결정 — Day 32 = B (환경설정 영구 해결) | Day 31 끝나며 합의 |
| 1 | 전체 진단 — scripts 3개만 / `.env.example` 없음 / `.gitignore` 의 `.env*` 패턴 검토 / chipClass 5 사용처 / prisma.config.ts 잘 있음 | *현재 상태 파악* |
| 2 | 정리 패키지 선택 — *가벼움* (A + B + F) 채택. C (README) / D (chipClass 응급) 별도 결 | *작은 단위 묶음* |
| 3 | **`.gitignore` 함정 발견** — `.env*` 가 `.env.example` 까지 ignore → `!.env.example` 예외 필수 | *gitignore 패턴 매칭 함정* |
| 4 | `.env.example` 작성 — DATABASE_URL 형식 유지, SESSION_SECRET 은 *빈 값 + 생성 명령 안내*. 실제 비밀 누출 0 | *공개 repo 표준 패턴* |
| 5 | `package.json` scripts +5 — `typecheck` / `db:seed` / `db:migrate` / `db:reset` / `db:studio` | *db:* prefix 그룹화* |
| 6 | 검증 — `npm run typecheck` 출력 0 (Day 30/31 모든 코드 타입 안전) + `npm run db:studio` 5555 정상 | *전체 컴파일 검증* |

---

## 📅 Day 33 작업 요약 — README 갱신 (작은 정리 패키지)

### 작업 단계 (9)

| Step | 작업 | 새 개념 / 재현 |
|---|---|---|
| 0 | 방향 선택 — Day 32 plan 의 후보 4개 중 사용자 *작은 정리 (chipClass / README)* 채택 | *작은 정리 묶음* |
| 1 | **chipClass 점검** — 5 사용처 모두 일관, dark variant 정식 패턴 자연 흡수 | *별도 정리 불필요 확인* |
| 2 | README 점검 — 완전 기본 `create-next-app` 템플릿 | *프로젝트 정보 0줄* |
| 3 | 방향 추천 — *셋업 가이드 + 프로젝트 소개* 둘 다 (균형) | 사용자 채택 |
| 4 | 초안 작성 (**오류**) — *"스타일링 매칭 플랫폼"* 으로 단정 | *프로젝트 정체성 오해* |
| 5 | **사용자 정정** — "중간에 멀티롤 구조 기본 템플릿 (패션 / 의료 / 법률 등) 으로 변경했잖아" | *근거 문서 재검증 필요* |
| 6 | 메모리 재검증 — `user_role.md` line 27 의 *"Phase 1A 는 도메인 중립 마켓플레이스 골격, Phase 1B 에서 패션 테마"* 확인 + `project_summary_v2.md` 단계 상세 보강 | *메모리 + 문서 우선 검증* |
| 7 | 세 결정 합의 — 제목 *"멀티롤 마켓플레이스 골격 (Phase 1A)"* / v2 문서 링크 빼기 / 톤 *사실/구조 중심, 자랑 X* | *공개 첫인상 결정* |
| 8 | Write 1 파일 — `stylefit/README.md` 전면 교체 (Next.js 기본 → ~75줄) | 정체성 일치 |

---

## 🐛 묶음 3 의 핵심 발견·논의

### 발견 1: ***`.gitignore` 함정*** — `.env*` 가 `.env.example` 까지 ignore

`.gitignore` 의 *글롭 패턴 함정*:

```gitignore
# 기존
.env*
```

**`.env*` 의 매칭 범위**:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- **`.env.example`** ← 의도치 않게 매칭!

**문제** — `.env.example` 는 *공개 repo 에 올려야 하는 가이드 파일*. 그런데 `.gitignore` 의 `.env*` 패턴이 *함께 무시* → `git add` 해도 *추적 안 됨*.

**해결 — `!` (negation) 예외**:

```gitignore
.env*
!.env.example   # ← 예외 처리: .env* 매칭이어도 .example 은 추적
```

**`!` 패턴의 *순서 의존***:
- `.gitignore` 는 *위에서 아래* 순서로 평가
- 더 아래 규칙이 위 규칙 *override*
- `.env*` (무시) → `!.env.example` (예외) = `.env.example` 만 추적

**검증법** — `git status` 의 *Untracked files* 에 `.env.example` 나타나는지 확인:
```bash
git status
# Untracked files:
#   .env.example     ← 여기 나오면 예외 처리 성공
```

**Day 32 의 발견 순서**:
1. `.env.example` 작성
2. `git add .env.example` 시도
3. *No matches found* (gitignore 차단)
4. `.gitignore` 의 `.env*` 발견
5. `!.env.example` 예외 추가
6. 다시 `git add` → 성공

**광범위 적용 패턴**:
- `.gitignore` 의 *글롭 패턴* = *의도보다 넓을 수 있음*
- *예외가 필요한 파일* = `!` 로 명시
- 다른 예: `*.log` + `!important.log`, `dist/` + `!dist/.keep`

**원칙**: "*`.gitignore` 의 글롭 패턴 = 의도보다 넓을 수 있는 함정*. *`!` (negation) 으로 명시 예외 처리*. *순서 의존* — 예외는 무시 패턴 *아래* 에 둠. *git status 의 Untracked files 표시* 가 검증 방법. *공개 가이드 파일 (.env.example 등) = 예외 처리 필수*."

---

### 발견 2: ***`.env.example` 의 비밀 누출 0 원칙*** — 키 + 형식 + 생성 명령만

`.env.example` 의 *진짜 책임* = *신규 환경 셋업 가이드*. *실제 비밀 절대 X*.

```bash
# stylefit 환경 변수 — 신규 환경 셋업 가이드 (Day 32).
#
# 이 파일을 .env 로 복사한 뒤 실제 값을 채워 넣으세요.
#   cp .env.example .env   (또는 Windows: copy .env.example .env)
#
# 실제 .env 는 .gitignore 에 무시되어 *절대 커밋되지 않음*.

# Database — Prisma 가 사용하는 DB URL.
# 학습 단계는 SQLite 로컬 파일. 운영 환경에선 PostgreSQL 등으로 교체.
DATABASE_URL="file:./dev.db"

# Session (Day 8) — JWT signing key. 32바이트 base64.
# 절대 git에 올리지 말 것. 신규 환경마다 새로 생성.
# 생성 명령:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_SECRET=""
```

**`.env.example` 의 *세 책임***:
- *키 목록* — 어떤 환경 변수가 필요한지 명시
- *형식* — 값의 형식 예시 (예: `file:./dev.db`)
- *생성 명령* — 직접 만들 수 있는 방법 (특히 비밀값)

**절대 *안 적는 것***:
- 실제 SESSION_SECRET 값
- 실제 DB password / API key
- 운영 환경 URL (보안)

**`SESSION_SECRET=""` 의 *빈 값 + 명령 안내***:
```bash
SESSION_SECRET=""
# 생성 명령:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
- 사용자가 *직접 명령 실행 → 값 생성*
- *환경마다 다른 비밀* — *재사용 위험 0*

**대조 — 함정 1: 실제 비밀 넣기** (anti-pattern):
```bash
SESSION_SECRET="my-actual-secret-key-here"   # ← 절대 X
```
- *공개 repo 노출* → 모든 사람이 *signing key 사용 가능*
- *세션 위조 위험*

**대조 — 함정 2: 가짜 비밀** (어색):
```bash
SESSION_SECRET="changeme"   # ← 사용자가 그대로 두는 위험
```
- *교체 강제력 X*
- *production 에서 그대로 동작* → 가짜 비밀이 진짜 비밀이 됨

**우리 패턴 — 빈 값 + 생성 명령**:
- *빈 값* → 사용자 *반드시 채워야 함* (앱 실행 시 에러)
- *명령 안내* → *어떻게 채울지* 명시
- *교체 강제력 + 안내* 두 가치

**원칙**: "*.env.example = 신규 환경 셋업 가이드, 비밀 누출 0*. *키 + 형식 + 생성 명령* 만 적음. *빈 값 + 명령 안내* 가 *교체 강제력 + 학습* 두 가치. 공개 repo 의 표준 패턴."

---

### 발견 3: ***npm scripts 그룹화*** — `db:*` prefix

Day 32 이전 `package.json` scripts (3 개):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

Day 32 추가 (5 개):
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit",
  "db:seed": "prisma db seed",
  "db:migrate": "prisma migrate dev",
  "db:reset": "prisma migrate reset",
  "db:studio": "prisma studio"
}
```

**`db:*` prefix 의 *그룹화* 효과**:
- 모든 Prisma 명령이 *같은 prefix* → *시각 그룹*
- *명령 기억 부담 ↓* (학습 단계 핵심)
- *자동 완성 활용* — `npm run db:` 입력 시 후보 4개 표시

**before/after 명령 비교**:

| Before (직접 호출) | After (npm scripts) |
|---|---|
| `npx prisma db seed` | `npm run db:seed` |
| `npx prisma migrate dev` | `npm run db:migrate` |
| `npx prisma migrate reset` | `npm run db:reset` |
| `npx prisma studio` | `npm run db:studio` |

**그룹화의 *학습 단계 가치***:
- *직접 호출* = 매번 정확한 prisma 하위 명령 기억 필요
- *npm scripts* = *역할 기반 명명* (`db:seed` 가 *시드 주입* 명확)
- *학습자가 prisma 의 모든 하위 명령 외울 부담 ↓*

**`:` 구분자의 *표준 패턴***:
- 많은 프로젝트가 `test:unit`, `test:e2e`, `lint:fix` 등 `:` 그룹화
- *공식 명령어 분류 표준 아님* — 관습
- *명령 갯수 ↑ 시 자연 도입*

**원칙**: "*npm scripts 그룹화 = `prefix:` 패턴*. *명령 기억 부담 ↓ + 자동 완성 활용*. *학습 단계 = 명령 갯수 ↑ 시 그룹화 가치 ↑*. 직접 호출 (`npx prisma`) vs npm scripts = *학습 단계 = scripts 우선*."

---

### 발견 4: ***`typecheck` 의 가치*** — tsc --noEmit 전체 컴파일 검증

```json
"typecheck": "tsc --noEmit"
```

**`tsc --noEmit` 의 *의미***:
- TypeScript 컴파일러 호출
- `--noEmit` = *코드 생성 없이* 타입 검사만
- 결과: *컴파일 에러 출력* (있으면) / 출력 0 (모두 통과)

**왜 *전체 컴파일 검증* 가치 ↑**:
- *dev 서버* = *수정 파일 위주* 컴파일 (HMR)
- *전체 컴파일* 안 함 → *수정 안 된 파일의 타입 오류* 놓침
- 큰 작업 (Day 30/31 같은) 후 *전체 검증* 한 번에 가능

**Day 32 의 *typecheck 실행 결과***:
```bash
$ npm run typecheck
$ (출력 0 — 모든 타입 통과)
```
- Day 30 Client Component / Server Action ref props
- Day 31 Prisma `_count with where` / Server Action ref 등
- *복잡한 server/client 타입 결합* 모두 검증 통과

**dev 서버 vs typecheck 비교**:

| | dev 서버 | typecheck |
|---|---|---|
| 검증 범위 | 수정 파일 + 의존성 | 프로젝트 전체 |
| 속도 | 빠름 (incremental) | 느림 (full) |
| 출력 | console.error / 페이지 에러 | 명령줄 에러 목록 |
| 시점 | 코드 작성 중 | 완료 후 검증 |

**`typecheck` 의 *학습 단계 가치***:
- *큰 작업 (10+ 파일) 후* 전체 안전성 확인
- *git commit 전 sanity check*
- *pre-commit hook* 후보 (도입 미정)

**원칙**: "*tsc --noEmit = 코드 생성 없이 타입 검사만*. *dev 서버 (수정 파일 위주) 가 놓치는 전체 컴파일 검증*. *큰 작업 후 sanity check 표준 도구*. *학습 단계 = typecheck = 안전 검증의 가시화*."

---

### 발견 5: ***db:studio = 학습 단계 DB 직접 보기*** — Prisma Studio

```json
"db:studio": "prisma studio"
```

**Prisma Studio 의 *기능***:
- 5555 포트에서 *DB GUI* 실행
- 모든 테이블 *시각화* (User, Service, Booking, Message 등)
- *데이터 추가/수정/삭제* 가능 (운영 X, 학습용)
- *관계 자연 표현* — Booking 클릭 → 연결된 buyer / service / messageThread 표시

**학습 단계의 *큰 가치***:
- 시드 데이터 *눈으로 확인*
- isRead 카운트 / lastMessageAt 같은 *복잡한 필드 직관*
- 마이그레이션 후 *DB 상태* 즉시 확인
- *Prisma 쿼리 결과 검증* — 코드 결과 vs Studio 결과 비교

**대조 — 코드만 의존**:
- `console.log(await prisma.message.findMany())` — *임시 출력*
- 매번 코드 수정 + dev 서버 재실행 부담
- *데이터 전체 시각 한 번에 X*

**Studio 의 *한계*** — 운영 단계 X:
- *모든 데이터 노출* → 운영 환경 보안 위험
- *수정/삭제 가능* → 운영 데이터 손실 위험
- *학습/dev 환경 전용*

**Day 30/31 검증 활용 예** (Studio 직접 보기):
- isRead 뱃지 동작 검증 — Message 테이블의 `isRead` 컬럼 직접 확인
- 메시지 생성 트랜잭션 검증 — Thread 의 `lastMessageAt` 갱신 확인
- 인덱스 적용 확인 — Schema 의 `@@index` 가 Studio 에서도 보임

**원칙**: "*Prisma Studio = 학습 단계 DB GUI 의 표준 도구*. *시드 검증 / 마이그레이션 확인 / 쿼리 결과 비교* 모두 자연. *운영 환경 X* — 보안/데이터 손실 위험. *학습 + dev 한정*. *데이터 시각화 = 학습 가속*."

---

### 발견 6: ***큰 후속 작업의 응급 흡수*** — Day 26 chipClass → Day 28 자연 해소

Day 33 의 *chipClass 점검* 결과 — *별도 정리 작업 사라짐*:

**Day 26 의 상황**:
- 다크모드 인프라 도입 시 *chipClass 응급 분기* (활성=흰 칩, 비활성=white/10)
- *전체 다크 분기 미적용* — chipClass 만 응급 처리
- 메모리에 *"응급, 정식 정리 필요"* 명시

**Day 33 점검**:
```ts
// app/lib/url-filter.ts:69
export const chipClass = (isActive: boolean) =>
  isActive
    ? "rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
    : "rounded-full bg-black/10 px-4 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-black/20 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/20"
```
- **이미 정식 패턴** (라이트의 inverse — 활성 `bg-zinc-900 dark:bg-white`, 비활성 `bg-black/10 dark:bg-white/10`)
- 5 사용처 모두 일관
- *응급 흔적 없음*

**왜 *자연 흡수* 됐나** — Day 28 의 *전체 다크 분기 + 디자인 시스템 통합* 작업 중:
- 모든 컴포넌트 다크 분기 적용
- chipClass 도 *그 일환으로 자연 다듬어짐*
- *Day 26 의 응급* 이 *Day 28 의 큰 작업에 흡수*

**작업 패턴의 *학습 가치***:
- *모든 부채를 별도 Day 잡지 않아도* 자연 해소 가능
- *큰 후속 작업의 부산물* 로 *작은 부채 청산*
- *부채 명시 → 큰 작업 시 자연 청산 → 점검에서 확인* 의 흐름

**Day 33 의 *작업 사라짐***:
- 원래 *작은 정리 = chipClass + README* 묶음
- chipClass 정리 = *불필요* 확인
- 실제 작업 = *README 1 파일* + 메모리 갱신 2 파일

**대조 — *기능 부채* 의 흐름**:
- Day 14 의 *완료 액션 없음* → Day 24 에 *별도 작업으로* 청산
- Day 13 의 *Review 시드만* → Day 24 에 *별도 작업으로* 활성화
- 이건 *큰 작업의 부산물 X, 별도 의식적 청산*

**두 부채 청산 패턴**:

| 패턴 | 예 | 청산 방식 |
|---|---|---|
| 큰 작업의 부산물 | chipClass (Day 26 → Day 28) | 자연 흡수 |
| 별도 의식적 청산 | 환경설정 (Day 24 → Day 32) | 별도 Day |

**원칙**: "*부채의 두 청산 패턴* — *큰 작업 부산물 (자연 흡수)* vs *별도 의식 청산 (전용 Day)*. *기능 부채* = 별도 Day 자연, *디자인/시각 부채* = 큰 디자인 작업에 흡수 가능. *부채 명시 → 적절한 시점 청산* 의 학습 흐름."

---

### 발견 7: ***프로젝트 정체성의 메모리 검증 의무*** — 내 README 초안 오류

Day 33 의 *큰 사건* — 내가 README 초안에서 *"스타일링 매칭 플랫폼"* 으로 단정 → 사용자 정정.

**사용자 정정**:
> "주제는 사실 스타일링 매칭으로 시작했는데, 우리 중간에 일단 멀티롤 구조 기본 템플릿 만드는 목적으로 변경했잖아. (패션 테마뿐만 아니라, 의료, 법률 등 다른 테마들도 끼워넣을 수 있도록)"

**메모리 재검증 — 이미 명시되어 있던 사실**:

```markdown
# user_role.md line 27:
## 프로젝트 컨텍스트
프로젝트명: Stylefit (워킹 네임). Phase 1A는 *도메인 중립 마켓플레이스 골격*,
Phase 1B에서 *패션 테마* 입힘.
```

**`project_summary_v2.md` 의 단계 상세**:
- Phase 1A = *일반 마켓플레이스*, 카테고리 임의값 ("디자인", "IT")
- Phase 1B = *패션 테마링*, STYLE_PROFILES 추가
- *Stylefit 이름은 Phase 1B 부터*

**내 오류의 *원인***:
- *코드베이스 폴더 이름 stylefit* 만 보고 단정
- *프로젝트 정체성 정의 문서* (`user_role.md`, `project_summary_v2.md`) 미검증
- *공개 첫인상 문서 작성* 인데 *정체성 정의 문서* 안 봄 = 본질 누락

**메모리 검증의 *3 단계* 패턴**:
1. *작업 시작 전* — 관련 메모리 검색
2. *결정 단계* — 메모리와 충돌 시 *사용자 확인*
3. *오류 후* — *메모리 재검증* + *정정*

**Day 33 의 정정 흐름**:
1. *오류 초안* 작성
2. *사용자 정정* 받음
3. *user_role.md* 재검증 → *Phase 1A 도메인 중립* 명시 발견
4. *project_summary_v2.md* 추가 검증 → Phase 단계 상세 보강
5. *세 결정 합의 후* 재작성

**공개 첫인상 문서의 *책임***:
- README = GitHub 방문자 *첫 화면*
- *제목부터 정체성 표현* 해야
- *오해 유발 = 프로젝트 가치 왜곡*

**원칙**: "*공개 첫인상 문서일수록 정체성 정의 문서 부터 검증*. *코드베이스 폴더 이름* ≠ *프로젝트 정체성*. *메모리 검증의 3 단계* — 시작 전 / 결정 단계 / 오류 후. *오류 = 학습 트리거* — 메모리 검증 의무 강화 계기."

---

### 발견 8: ***제목 = 정체성*** — Stylefit vs 멀티롤 마켓플레이스 골격

세 옵션 비교:

**옵션 A — Stylefit (Phase 1A: 멀티롤 마켓플레이스 골격)**:
- 정직하지만 *길고 복잡*
- GitHub 첫 화면에서 *이게 뭔지* 파악 시간 ↑
- 제목에 *Stylefit* 강조 → *패션 매칭* 으로 읽힘

**옵션 B (채택) — 멀티롤 마켓플레이스 골격 (Phase 1A)**:
- *제목 = Phase 1A 의 진짜 정체성* 일치
- *Stylefit* 은 *워킹 네임* 으로 첫 단락 한 줄 설명
- 코드 폴더 stylefit 과 *다리 놓음*

**옵션 C — Multi-role Marketplace Template (영문)**:
- *국제 OSS 흉내* 인상
- 본문 한국어와 *톤 비일관*

**B 채택 근거**:
- *GitHub 첫 화면의 큰 제목* = *프로젝트 정체성*
- *큰 제목에 Stylefit 두면* → *패션 매칭* 으로 읽힘 (이전 오류 반복)
- *멀티롤 마켓플레이스 골격* = *Phase 1A 의 진짜 의미* 일치
- *영문 제목* 은 *학습 프로젝트 정직성* 과 어긋남 → 한글

**제목 결정의 *3 차원***:
- *정확성* — 정체성 일치
- *간결성* — 첫 화면 파악 시간 ↓
- *언어 톤* — 본문과 일관

**Stylefit 워킹 네임의 *처리***:
```markdown
# 멀티롤 마켓플레이스 골격 (Phase 1A)

> 워킹 네임 *Stylefit* (코드베이스 폴더명). Phase 1B 의 *패션 테마링* 단계부터 의미를 가짐.
```
- *제목과 폴더 이름 불일치* 첫 단락에서 해명
- *워킹 네임 + 시점* 모두 명시
- *과거 의도 존중* + *현재 정체성 명확*

**원칙**: "*제목 = 정체성 표현*. *GitHub 첫 화면 큰 제목 = 프로젝트 가치 시각화*. *코드 폴더 이름 ≠ 제목* 자유. *워킹 네임은 본문에서* 다리 놓기. *3 차원 균형* — 정확성 + 간결성 + 언어 톤."

---

### 발견 9: ***README 자족성*** — 외부 문서 링크 최소화

Day 33 의 *세 결정* 중 하나 — *project_summary_v2.md 링크 빼기*.

**링크 둘 때의 *유혹***:
- *근거 문서가 있음* 신호
- *정신 표현 보강*
- 깊이 있는 의도 명시

**링크의 *3 가지 위험***:
- *부정합 위험* — v2 (2026-05-08) 이미 *2주 지남*. README 에서 *살아있는 단일 출처* 처럼 가리키면 *최신 정보 인양 오해*
- *문서 무거움 신호* — 학습 프로젝트 README 가 *내부 문서 인덱스* 같아짐
- *읽기 분기* — 방문자가 *README 만으로 자족 가능* 해야 깔끔

**우리 채택 — 링크 빼기**:
- README 본문 (단계 표 + 한 줄 요약) 에 *도메인 중립 정신* 충분 표현
- v2 문서는 *디렉토리 보면 자연 발견* — 필요 시 추가 자료
- *README 자족성 = 첫 화면 가치*

**대조 — 두 가지 가능 형태**:

```markdown
# Bad — 살아있는 단일 출처처럼
상세는 [project_summary_v2.md](./project_summary_v2.md) 에.

# Less bad — 역사 문서로 명시
초기 설계 문서: [project_summary_v2.md](./project_summary_v2.md) (2026-05-08 작성).

# Best — 안 적음 (Day 33 채택)
(링크 없음 — 본문에서 충분히 설명)
```

**`적은 게 강함` 의 정신**:
- *링크 = 추가 가치* 가 아니라 *추가 부담*
- *문서 무거움* 신호 회피
- *디렉토리 자연 발견* 신뢰

**광범위 적용** — *외부 의존성 일반*:
- 의존성 추가 (라이브러리) — *진짜 필요할 때만*
- 문서 링크 — *진짜 자족성 부족 시만*
- 추상화 도입 — *세 사용처 도달 후* (Day 19 정신)
- *모든 추가 = 부담* 의 일관 정신

**원칙**: "*README 자족성 = 첫 화면 가치*. *외부 문서 링크 = 부담 신호*. *역사 문서* (시간 지난 문서) 는 *살아있는 단일 출처처럼 가리키면 부정합 위험*. *링크 = 추가 가치 X, 부담*. 적은 게 강함."

---

### 발견 10: ***Day 32 + 33 = 공개 준비 짝*** — 환경 + 문서의 기능적 결합

두 Day 의 *시간상 인접* 이 *기능적 결합* 의 자연 표현:

```
신규 셋업자 흐름:
  1. clone repo
  2. README 읽기 (Day 33) — 프로젝트 정체성 + 셋업 안내
  3. .env.example 복사 (Day 32) — 환경 변수 가이드
  4. SESSION_SECRET 생성 명령 실행
  5. npm install
  6. npm run db:migrate (Day 32) — DB 셋업
  7. npm run db:seed (Day 32) — 시드 주입
  8. npm run dev — 실행

→ 모든 단계가 Day 32 + 33 결과물 활용
```

**한쪽만 있으면 *가치 절반***:

| | Day 32 만 | Day 33 만 | Day 32 + 33 |
|---|---|---|---|
| 신규 셋업 가능 | 가이드 없음, 어렵 | 환경 가이드 없음, 막힘 | 완전 셋업 가능 |
| 프로젝트 이해 | 정체성 모름 | 정체성 OK, 실행 막힘 | 이해 + 실행 |
| 공개 가치 | 미완성 | 미완성 | 완성 |

**두 Day 의 *결합의 자연***:
- *시간상 인접* (Day 32 → Day 33)
- *기능적 결합* (clone → 셋업 → 실행)
- *부담 균형* (3 파일 + 1 파일)
- *큰 도메인 사이 호흡 Day*

**대조 — 분리 시점 가정**:
- Day 32 만 하고 Day 33 미룸 → *환경 가이드는 있는데 README 가 Next.js 기본* — 어색
- Day 33 만 하고 Day 32 미룸 → *README 의 셋업 가이드 가 가짜* (`.env.example` 없으니 *복사 X*)

**두 작업의 *공유 학습***:
- *공개 첫인상* 의식
- *적은 게 강함* (README 자족성, .env.example 최소 정보)
- *부채 청산 가치* (Day 24~ 미뤄둔 두 항목 동시 해소)

**Day 33 plan 의 *학습 포인트***:
> *Day 32 + 33 = 공개 준비 짝* — 환경설정 (Day 32) + 문서 (Day 33). *신규 셋업자* 가 clone → README 읽기 → `.env.example` 복사 → npm scripts 실행으로 자족 동작. 두 작업이 *기능적으로 결합*.

**원칙**: "*공개 준비 = 환경 + 문서의 짝*. 한쪽만으로 *가치 절반*. *시간상 인접 + 기능적 결합* 이 자연. *큰 도메인 사이의 호흡 Day* 로 *부채 청산* 자연 흡수. 두 작업의 *공유 학습* (공개 첫인상, 적은 게 강함)."

---

## 🎓 새로 배운 개념 (Day 32~33)

### Day 32
- `.gitignore` 함정 (`.env*` 매칭 범위) + `!` 예외
- `.env.example` 의 비밀 누출 0 원칙 (키 + 형식 + 생성 명령만)
- npm scripts 그룹화 (`db:*` prefix)
- `typecheck` (tsc --noEmit) 의 전체 컴파일 검증
- Prisma Studio (db:studio) = 학습 단계 DB GUI

### Day 33
- 큰 후속 작업의 응급 흡수 (chipClass Day 26 → Day 28)
- 프로젝트 정체성의 메모리 검증 의무 (`user_role.md` line 27)
- 제목 = 정체성 표현 (Stylefit vs 멀티롤 골격)
- README 자족성 (외부 문서 링크 최소화)
- 역사 문서 vs 살아있는 단일 출처 (v2 문서)
- Day 32 + 33 = 공개 준비 짝 (환경 + 문서)

---

## 📋 작성된 코드 핵심

```bash
# .gitignore — 예외 패턴
.env*
!.env.example   # ← Day 32 추가
```

```bash
# .env.example (Day 32 신규)
# stylefit 환경 변수 — 신규 환경 셋업 가이드 (Day 32).
#
# 이 파일을 .env 로 복사한 뒤 실제 값을 채워 넣으세요.
#   cp .env.example .env   (또는 Windows: copy .env.example .env)
#
# 실제 .env 는 .gitignore 에 무시되어 *절대 커밋되지 않음*.

# Database — Prisma 가 사용하는 DB URL.
DATABASE_URL="file:./dev.db"

# Session (Day 8) — JWT signing key. 32바이트 base64.
# 생성 명령:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
SESSION_SECRET=""
```

```json
// package.json — scripts +5 (Day 32)
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "db:seed": "prisma db seed",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  }
}
```

```markdown
# stylefit/README.md (Day 33 신규)

# 멀티롤 마켓플레이스 골격 (Phase 1A)

> 워킹 네임 *Stylefit* (코드베이스 폴더명). Phase 1B 의 *패션 테마링* 단계부터 의미를 가짐.

**셀러 ↔ 바이어 ↔ 운영자** 의 세 역할이 *한 코드베이스* 에 공존하는 일반 마켓플레이스 골격.
어떤 전문 서비스 도메인 (패션 / 의료 / 법률 / 컨설팅 등) 도 *위에 입힐 수 있도록* 설계된
도메인 중립 템플릿.

## 단계

| Phase | 내용 | 상태 |
|---|---|---|
| **1A** | 도메인 중립 마켓플레이스 골격 (7 테이블, ~20 화면) | **진행 중** (Day 33) |
| 1B | 패션 테마 입힘 — `STYLE_PROFILES` 추가, 카테고리·UI 패션화 | 예정 |
| 2 | 결제 / 알림 / 매거진 등 확장 | 의지에 따라 |

(중략 — 세 역할 / 기술 스택 / 셋업 / 주요 명령 / 디렉토리 / 학습 프로젝트 컨텍스트)
```

---

## 📁 변경된 파일

### Day 32 (3 파일)
```
guun_project_2605/
├── .gitignore                    !.env.example 예외 추가 (1줄)
└── stylefit/
    ├── .env.example              [신규] DATABASE_URL + SESSION_SECRET 가이드
    └── package.json              scripts +5 (typecheck + db:*)
```

### Day 33 (1 파일)
```
stylefit/
└── README.md                     Next.js 기본 → 멀티롤 마켓플레이스 골격 정체성 (~75줄)
```

*묶음 3 총 4 파일 변경* (신규 1 + 수정 3).

가장 가벼운 묶음 — 큰 도메인 사이의 *호흡 짝* 정신 일관.

---

## 🚀 Day 34+ 미리보기

**작업 후보**:
- *진짜 실시간 (SSE / WebSocket)* — Day 31 폴링 베이스 위 진화, 메시지 도메인 완성
- *페이지네이션 3 사용처 + paginate 추출* — extraction threshold 도달
- *디자인 디테일 2차 수정* — 사용자 명시 *마지막*

**Day 32 plan 의 *작은 정리* 후보 모두 청산됨** — Day 32 환경 + Day 33 README. 다음은 *기능 vs 디자인* 결정.

**Day 34 권장 — 진짜 실시간 (SSE)**:
- *공개 준비 패키지* 완성 후 *기능 복귀* 가 자연 흐름
- *진짜 실시간* = *큰 도메인* (SSE/WebSocket 인프라). 학습 가치 ↑↑
- *Day 30/31 메시지 도메인 완성* 의 자연 다음 단계

단 Day 21~ 의 *계획 재검토 정신* 따라 Day 34 진입 시 다시 따짐.

---

## 💡 묶음 3 회고 — *작은 정리의 큰 가치*

세 묶음 중 *가장 가벼운* 묶음 (4 파일) 이지만 *학습 가치 ↓ 아님*:

**각 묶음의 *학습 가치 분포***:

| 묶음 | 파일 | 핵심 학습 |
|---|---|---|
| 1 (Day 26~28) | 37 | 다크 인프라 + 디자인 시스템 통합 |
| 2 (Day 29~31) | 22 | 새 도메인 + Client Component + Next.js 차단 |
| **3 (Day 32~33)** | **4** | **부채 청산 + 공개 준비 + 정체성 검증** |

**작은 정리의 *세 가지 가치***:

1. *부채 청산* — Day 24~ 미뤄둔 환경/문서 동시 해소. *학습 누적의 가시화*.
2. *공개 준비* — 첫 외부 방문자 가능 상태. *프로젝트의 진짜 완성도*.
3. *정체성 검증* — Day 33 의 오류 → 정정이 *프로젝트 정체성 강화* 트리거.

**작은 작업의 *역설적 가치***:
- *큰 작업* = 직접적 기능 가치 명확
- *작은 작업* = *간접적 가치* (부채 청산, 공개 준비, 안전망)
- *간접 가치는 명시 안 하면 누락* 위험

**부채 청산의 *Day 별 흐름***:

| Day | 부채 항목 | 청산 패턴 |
|---|---|---|
| 24 | 시드 보강 | 별도 의식 (기능 Day 안에 끼움) |
| 26 → 28 | chipClass 응급 | 큰 작업 부산물 자연 흡수 |
| 28 → 33 | 의미색 status 배지 토큰화 | *아직 미청산* (보류) |
| 24~ → **32** | **환경설정** | **별도 의식 Day** |
| 24~ → **33** | **README 갱신** | **별도 의식 Day** |

**디자이너의 *디자인 시스템 정비* 와 같은 결**:
- 큰 디자인 = *새 기능 화면*
- 작은 정비 = *토큰화, 일관성 검증, 문서화*
- *둘 다 가치, 다른 결*
- *간접 가치 명시 = 작은 정비 우선순위 보존*

**AI 협업의 *큰 작업 + 작은 정리* 균형**:
- 사용자 = *큰 기능 결정* (도메인, 시스템, 진화)
- AI = *작은 정리 후보 명시* (메모리 plan 의 *미해결* / *작업 후보* 섹션)
- *작은 정리 = 의식적 청산* 으로 *학습 누적의 가시화*

**Phase 1A 도메인 중립 정신과 묶음 3 의 *연결***:
- Phase 1A = *도메인 중립 골격* 의식
- Day 32 환경 = *어떤 도메인이든 셋업 가능* 가이드
- Day 33 README = *Phase 1A 정체성* 의 첫 공개 표현
- *Phase 1A 의 진짜 첫 외부 공개 준비* 완성

코딩 학습의 *진짜 완성* = *큰 도메인 + 작은 정리 + 공개 준비* 의 세 차원. 묶음 3 이 *공개 준비* 의 결실. Day 34+ 의 *진짜 실시간 / 페이지네이션 추출 / 디자인 2차* 로 *Phase 1A 의 마지막 정련* 으로 이어짐.

---

*문서 끝. Day 34 (진짜 실시간 SSE) 로 이어짐.*
