// Server Action: 로그인 처리 (Day 10)
//
// "use server" 지시어:
// - 이 파일 안의 함수들이 *서버에서만 실행*됨을 명시.
// - <form action={loginAction}> 또는 useActionState로 호출 시
//   Next.js가 *자동으로 안전한 서버 호출*로 변환 (CSRF 토큰 포함).
//
// 흐름:
//   1. formData에서 입력 추출
//   2. Zod 검증 (실패 시 state.error 반환)
//   3. user 찾기 + bcrypt.compare (실패 시 *같은 메시지* — user enumeration 방어)
//   4. createSession (쿠키 발급)
//   5. redirect("/services")

"use server"

import { prisma } from "@/app/lib/prisma"
import { createSession } from "@/app/lib/session"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

// useActionState의 state 타입. undefined = 초기 상태.
// email은 폼 재렌더 시 이메일 input 복원용 (defaultValue로 다시 채우기).
export type LoginState = { error?: string; email?: string } | undefined

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  // 검증 전에 *원본 입력값*을 미리 추출 — 에러 응답에 그대로 돌려주기 위해
  const email = (formData.get("email") as string | null) ?? ""

  const result = LoginSchema.safeParse({
    email,
    password: formData.get("password"),
  })

  if (!result.success) {
    return { error: "이메일과 비밀번호를 모두 입력해 주세요.", email }
  }

  const user = await prisma.user.findUnique({ where: { email: result.data.email } })

  // user 없음 OR 비번 불일치 → *같은 응답* (Day 8 user enumeration 방어와 동일)
  if (!user || !(await bcrypt.compare(result.data.password, user.passwordHash))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다.", email }
  }

  await createSession(user.id)

  // redirect는 내부적으로 throw → 함수가 끝나지 않고 자동 이동.
  // (try/catch 안에서 redirect는 위험 — catch가 throw를 먹어서 redirect 무효화)
  redirect("/services")
}
