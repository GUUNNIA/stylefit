# Phase 1A — Day 1 완료 보고서

> 작성일: 2026-05-11
> 목표: 환경 셋업 + Next.js 프로젝트 첫 화면 띄우기 + Git 백업

---

## 🎯 오늘 달성한 것

| Step | 작업 | 상태 |
|---|---|---|
| 1 | Desktop에 `Projects` 폴더 생성, VS Code로 열기 | ✅ |
| 2 | VS Code 터미널 첫 사용 | ✅ |
| 3 | Next.js 프로젝트 `stylefit` 생성 | ✅ |
| 4 | 패키지 설치 완료 (수백 개 자동 생성) | ✅ |
| 5 | 개발 서버 켜기 (`npm run dev`) | ✅ |
| 6 | `localhost:3000` 브라우저에서 첫 화면 확인 | ✅ |
| 7 | `page.tsx` 살짝 수정 → Hot Reload 경험 | ⬜ 진행 예정 |
| 8 | 폴더 구조 둘러보기 | ⬜ 진행 예정 |
| 9 | Git + GitHub 첫 백업 | ⬜ 진행 예정 |

---

## 📁 만들어진 폴더 구조

```
Desktop/
└── Projects/
    └── stylefit/
        ├── app/                ← 페이지 코드들이 들어가는 곳
        │   ├── page.tsx        ← 메인 페이지 (/) ★
        │   ├── layout.tsx      ← 모든 페이지 공통 틀
        │   ├── globals.css     ← 전체 사이트 공통 CSS
        │   └── favicon.ico     ← 브라우저 탭 아이콘
        │
        ├── public/             ← 이미지 같은 정적 파일
        │
        ├── node_modules/       ← 외부 라이브러리들 (절대 X)
        │
        ├── package.json        ← 이 프로젝트 신분증 (도구 목록)
        ├── tsconfig.json       ← TypeScript 설정
        ├── tailwind.config.ts  ← Tailwind 디자인 설정
        ├── next.config.ts      ← Next.js 설정
        ├── .gitignore          ← Git이 무시할 파일 목록
        └── README.md           ← 프로젝트 설명
```

### 핵심 3가지만 기억

1. **`app/page.tsx` = 메인 페이지** — URL `/` 에 보이는 화면
   - 파일 위치 = URL 주소 (Next.js 마법)
   - 나중에 `app/sellers/page.tsx` 만들면 `/sellers` 가 그 파일

2. **`node_modules/` 건들지 말기** — 외부 도구들 저장소, 자동 관리됨

3. **`package.json` = 신분증** — 어떤 도구 쓰는지 적힌 목록, 어디서든 똑같이 재현 가능

---

## 💡 새로 배운 도구 & 개념

### 도구

| 도구 | 무엇 | 어디서 |
|---|---|---|
| **VS Code** | 코드 편집기 | 메뉴바·사이드바·터미널 영역 |
| **터미널** | 컴퓨터에 글로 명령 내리는 창 | VS Code 안 (View → Terminal) |
| **Node.js v24** | TypeScript 실행 환경 | 자동 (이미 설치됨) |
| **npm** | 외부 도구 설치 관리자 | 터미널에서 명령어로 |
| **npx** | 임시로 도구 받아서 실행 | 터미널 명령어 |

### 명령어 — 오늘 처음 친 것들

```bash
# Node.js 설치 확인 (Day 0)
node -v

# npm 설치 확인 (Day 0)
npm -v

# Next.js 프로젝트 생성 — 마법의 한 줄
npx create-next-app@latest stylefit

# 폴더 안으로 이동
cd stylefit

# 개발 서버 켜기
npm run dev
```

### 개념

- **터미널** — 컴퓨터에 글로 명령 내리는 창. 클릭 대신 텍스트.
- **개발 서버** — 내 컴퓨터 안에서만 보이는 임시 웹 서버.
- **localhost:3000** — 내 컴퓨터 안 주소. *3000은 포트번호*.
- **Next.js 프로젝트 생성 질문 7개**:
  - TypeScript: Yes
  - ESLint: Yes
  - Tailwind CSS: Yes
  - src/ directory: No
  - App Router: Yes
  - Turbopack: Yes
  - Default import alias: No

---

## ⚙️ 개발 서버 켜고 끄는 법 (다음 세션부터 매번)

### 켜기
1. VS Code에서 `stylefit` 폴더 열기 (File → Open Folder)
2. 터미널 열기 (View → Terminal)
3. 명령어:
   ```
   npm run dev
   ```
4. 브라우저로 `http://localhost:3000` 접속

### 끄기
- 터미널에서 `Ctrl + C` 누르기
- 브라우저 탭 닫기

> 다음에 작업할 때마다 *이 두 명령어*만 기억하면 돼요.
> ```
> cd stylefit
> npm run dev
> ```

---

## 🚧 막힐 만한 곳들 (참고)

| 증상 | 원인 / 해결 |
|---|---|
| 터미널에 *권한 오류* (`permission denied`) | (Mac만) 명령 앞에 `sudo` 붙이고 비밀번호 입력 |
| Windows에서 *실행 정책 오류* | 터미널 다시 열고 시도 |
| `npx create-next-app` 한참 멈춤 | 인터넷 속도 문제. 1~5분 정상 |
| 질문 없이 빈 줄 | 그냥 Enter |
| `localhost:3000` 안 뜸 | 터미널 에러 메시지 확인 |
| `npm run dev` 했는데 사이트 안 뜸 | `cd stylefit` 했는지 확인 (폴더 안에 있어야 함) |

---

## 📋 남은 Day 1 작업 (선택)

### Step 7. 코드 살짝 수정해보기

`app/page.tsx` 열고 *"Get started by editing"* 같은 텍스트를 본인 마음대로 바꿔보기.

- 검색: `Cmd+F` (Mac) / `Ctrl+F` (Windows)
- 저장: `Cmd+S` / `Ctrl+S`
- 브라우저 자동 갱신 = **Hot Reload** 경험

### Step 8. 폴더 구조 감 잡기

위에서 정리한 구조 한 번 직접 펼쳐보기. 다 외울 필요 없음.

### Step 9. Git + GitHub 백업

```bash
# Git 사용자 설정 (한 번만)
git config --global user.name "본인이름"
git config --global user.email "본인이메일"

# 프로젝트에서
git init
git add .
git commit -m "first commit"

# GitHub에 repository 만든 후 (github.com)
git remote add origin https://github.com/Username/stylefit.git
git branch -M main
git push -u origin main
```

GitHub 가서 `github.com/Username/stylefit` 접속하면 본인 코드가 인터넷에 떠있음.

---

## 🎯 다음 세션 시작할 때

### 환경 다시 켜는 법
1. VS Code 열기
2. `File → Open Recent` → `stylefit` 선택 (또는 폴더로 직접 열기)
3. 터미널 열기
4. `npm run dev`
5. `localhost:3000` 접속

### Day 2부터 시작할 일 (예상)

> 우리 v2 문서의 Week 1 계획에 따르면:
> - Prisma 스키마 작성 (DB 테이블 정의)
> - SQLite 데이터베이스 만들기
> - 첫 마이그레이션 실행
> - User 테이블 진짜 생성

→ 즉 *"DB가 진짜 생기는 단계"*

---

## ✨ 오늘 한 일 한 줄 요약

> **"코드 한 줄 안 짜고 본인 사이트가 브라우저에 떴다."**
> 
> 환경 셋업 + Next.js 프로젝트 생성 + 첫 화면 띄움.
> 명령어 두세 줄로 *수백 개 파일이 자동 생성*되는 경험.
> 이게 *현대 개발의 마법*. Day 1 치고 충분한 성취.

---

*문서 끝.*
