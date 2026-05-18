// POST /api/auth/login — 로그인 (Day 8)
//
// 흐름:
//   1. Zod로 입력 형식 검증 → 실패 시 400
//   2. DB에서 user 찾기 — 없거나 비번 불일치면 *동일한 401* (user enumeration 방어)
//   3. bcrypt.compare로 비번 검증 (constant-time)
//   4. createSession(user.id) → 쿠키 set
//   5. 200 + user 정보 (passwordHash 제외)

import { prisma } from "@/app/lib/prisma"
import { createSession } from "@/app/lib/session"
import { z } from "zod"
import bcrypt from "bcryptjs"

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1), // 형식만 체크 — 최소 길이는 signup에서 보장
})

export async function POST(request: Request) {
  const body = await request.json()

  const result = LoginSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: "Invalid input", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })

  // user 없음 OR 비번 불일치 → *같은 응답*. 공격자가 이메일 존재 여부 추측 못 함.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }

  await createSession(user.id)

  return Response.json(
    { id: user.id, email: user.email, name: user.name },
    { status: 200 }
  )
}
