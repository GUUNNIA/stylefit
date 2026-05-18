// GET /api/me — 내 정보 조회 (Day 8, 첫 보호된 API)
//
// 패턴: DAL을 거쳐 세션 확인 → 사용자 정보 또는 401.
// 이후 모든 보호된 API/mutation이 이 패턴을 그대로 따른다.

import { getCurrentUser } from "@/app/lib/dal"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json(user, { status: 200 })
}
