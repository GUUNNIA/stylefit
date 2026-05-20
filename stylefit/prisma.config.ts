// Prisma config (Day 17)
//
// Prisma 7 부터 `package.json#prisma` 가 제거됨 — config-as-code 로 이전.
// 6.x 에서 *deprecated 경고만* 뜨던 것을 미리 정리한 형태.
//
// 최소 형태로 둔 이유:
//   - schema 경로 default 가 `prisma/schema.prisma` 라 명시 불필요
//   - migrations.path default 가 `prisma/migrations` 라 명시 불필요
//
// .env 로딩 주의:
//   prisma.config.ts 가 존재하면 Prisma CLI 가 *자동 .env 로딩을 건너뜀*
//   (출력에 "Prisma config detected, skipping environment variable loading").
//   schema 의 env("DATABASE_URL") 를 채우려면 *수동* 로딩 필요.
//
//   dotenv 패키지 대신 Node 20.12+ 의 built-in `process.loadEnvFile()` 사용 —
//   새 의존성 안 늘리고 한 줄로 끝남. .env 가 없으면 throw 하지만 dev 환경에선
//   항상 존재가 전제라 try/catch 안 둠.

import { defineConfig } from "prisma/config"

process.loadEnvFile()

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
})
