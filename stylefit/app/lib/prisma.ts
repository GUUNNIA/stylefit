// Prisma Client 싱글톤
// 프로젝트 전체에서 단 하나의 PrismaClient 인스턴스를 공유
// dev 모드의 hot reload로 인한 연결 누적/풀 초과를 방지

import { PrismaClient } from "@prisma/client"

// 전역 객체에 prisma 인스턴스 캐싱 (dev 환경 hot reload 대비)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 이미 전역에 있으면 재사용, 없으면 새로 생성
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// dev 환경에서만 전역에 저장 (production은 매 모듈 로드 시 새로 만들지 않음)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
