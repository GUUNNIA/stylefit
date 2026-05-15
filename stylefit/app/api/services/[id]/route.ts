// GET /api/services/[id]
// 단일 서비스 상세 조회 (sellerProfile + user 정보 함께)
// 404: 존재하지 않는 id / 400: 숫자가 아닌 id

import { prisma } from "@/app/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Next.js 15+에서 params는 Promise — await로 풀어야 함
  const { id } = await context.params

  // URL의 id는 문자열 → 숫자로 변환
  const serviceId = parseInt(id, 10)

  // id가 유효한 숫자가 아니면 400 Bad Request
  if (isNaN(serviceId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }

  // 서비스 단일 조회 + 셀러 정보 함께 (이중 include + select)
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      sellerProfile: {
        include: {
          user: {
            select: { id: true, name: true, profileImageUrl: true },
          },
        },
      },
    },
  })

  // 존재하지 않으면 404
  if (!service) {
    return Response.json({ error: "Service not found" }, { status: 404 })
  }

  return Response.json(service)
}
