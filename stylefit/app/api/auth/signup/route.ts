// POST /api/auth/signup
// 회원가입 — Zod로 입력 검증, bcrypt로 비밀번호 해싱, 이메일 중복 체크
// 응답: 201 (성공) / 400 (입력 오류) / 409 (이메일 중복)

import { prisma } from "@/app/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

// 입력 검증 스키마 (Zod) — 요청 본문이 이 모양을 만족해야 함
const SignupSchema = z.object({
  email: z.email(),                       // 이메일 형식
  password: z.string().min(8),            // 최소 8자
  name: z.string().min(1).max(20),        // 1~20자
  agreedTerms: z.literal(true),           // 반드시 true (false면 거절)
})

export async function POST(request: Request) {
  // 1) 요청 본문 파싱 (JSON → 객체)
  const body = await request.json()

  // 2) Zod로 입력 검증 — 실패 시 400 Bad Request
  const result = SignupSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: "Invalid input", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { email, password, name } = result.data

  // 3) 이메일 중복 체크 — 이미 존재하면 409 Conflict
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json(
      { error: "Email already exists" },
      { status: 409 }
    )
  }

  // 4) 비밀번호 해싱 (salt rounds: 10 — 표준)
  const passwordHash = await bcrypt.hash(password, 10)

  // 5) User 생성 — passwordHash는 응답에서 제외 (select 화이트리스트)
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      agreedTermsAt: new Date(), // 서버가 자동 기록 — 클라이언트 시간 신뢰 X
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  // 6) 201 Created로 응답
  return Response.json(user, { status: 201 })
}
