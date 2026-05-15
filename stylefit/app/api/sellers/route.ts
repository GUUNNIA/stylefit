// GET /api/sellers
// 승인된 셀러 목록 조회 (pending 셀러 숨김)
// User 정보 일부 포함 — passwordHash 등 민감 필드는 select 화이트리스트로 차단

import { prisma } from "@/app/lib/prisma"

export async function GET() {
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      verificationStatus: "approved", // 미승인 셀러 제외
    },
    include: {
      user: {
        // select로 명시한 필드만 노출 — 추가 필드가 schema에 들어가도 자동 안전
        select: {
          id: true,
          name: true,
          profileImageUrl: true,
        },
      },
    },
  })

  return Response.json(sellers)
}
