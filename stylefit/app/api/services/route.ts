// GET /api/services
// 모든 서비스 목록 조회 (필터 없이 전체 반환)
// Phase 1A의 첫 공개 API — Next.js Route Handler 학습용

import { prisma } from "@/app/lib/prisma"

export async function GET() {
  // Prisma로 모든 Service 행 조회
  const services = await prisma.service.findMany()

  // JSON 응답으로 반환 (Web 표준 Response.json)
  return Response.json(services)
}
