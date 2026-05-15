// GET /api/sellers/[id]
// 단일 셀러 상세 조회 (user + services 함께, approved만 공개)
// 404: 존재하지 않거나 미승인 셀러 / 400: 숫자가 아닌 id

import { prisma } from "@/app/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const sellerId = parseInt(id, 10)

  if (isNaN(sellerId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 })
  }

  // 셀러 프로필 + user(화이트리스트) + 그 셀러의 모든 서비스 함께 조회
  const seller = await prisma.sellerProfile.findUnique({
    where: { id: sellerId },
    include: {
      user: {
        select: { id: true, name: true, profileImageUrl: true },
      },
      services: true,
    },
  })

  // 존재하지 않거나 미승인이면 404 (목록과 동일한 비즈니스 룰)
  if (!seller || seller.verificationStatus !== "approved") {
    return Response.json({ error: "Seller not found" }, { status: 404 })
  }

  return Response.json(seller)
}
