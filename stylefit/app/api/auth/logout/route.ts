// POST /api/auth/logout — 로그아웃 (Day 8)
//
// 단순히 세션 쿠키를 삭제. 클라이언트의 쿠키가 사라지면
// 이후 요청은 *비로그인 상태*로 들어옴.
//
// 주의: stateless JWT 특성상, 누군가 *쿠키 값을 미리 복사*해뒀다면
// 만료 전까지는 유효. 진짜 즉시 무효화하려면 DB session으로 가야 함.

import { deleteSession } from "@/app/lib/session"

export async function POST() {
  await deleteSession()
  return Response.json({ ok: true }, { status: 200 })
}
