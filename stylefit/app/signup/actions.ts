// Server Action: 회원가입 + 즉시 로그인 (Day 10)
//
// Day 7의 /api/auth/signup과의 차이:
// - Day 7 route: 회원가입만, 클라이언트가 별도 로그인 요청 필요
// - Day 10 action: 회원가입 → createSession → redirect 한 번에
//
// 흐름:
//   1. Zod 검증 (이메일·비번·이름·약관 동의)
//   2. 이메일 중복 체크 (409 대신 state.error로)
//   3. bcrypt.hash → prisma.user.create
//   4. createSession(user.id) — 가입 즉시 로그인 상태
//   5. redirect("/services")

"use server"

import { prisma } from "@/app/lib/prisma"
import { createSession } from "@/app/lib/session"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

const SignupSchema = z.object({
  email: z.email({ error: "올바른 이메일 형식이 아닙니다." }),
  password: z.string().min(8, { error: "비밀번호는 8자 이상이어야 합니다." }),
  name: z
    .string()
    .min(1, { error: "이름을 입력해 주세요." })
    .max(20, { error: "이름은 20자 이내로 입력해 주세요." }),
  // FormData의 checkbox는 체크되면 "on", 안 되면 빠짐 → 직접 변환
  agreedTerms: z.literal("on", { error: "약관에 동의해 주세요." }),
})

// 필드별 에러를 별도 타입으로 분리.
// 이유: SignupState가 `{...} | undefined` union이라 SignupState["fieldErrors"]로 직접 인덱싱 불가.
// 또 별도 타입이면 *반복 사용*과 *읽기 쉬움*에 유리.
type FieldErrors = {
  email?: string
  password?: string
  name?: string
  agreedTerms?: string
}

export type SignupState = {
  error?: string
  fieldErrors?: FieldErrors
  // 폼 재렌더 시 입력값 복원용 (defaultValue로 다시 채우기)
  // 비밀번호는 *의도적으로 제외* — 보안 + UX 표준
  values?: {
    email?: string
    name?: string
  }
} | undefined

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  // 원본 입력값 — 에러 응답 시 그대로 돌려주기 위해 먼저 추출
  const email = (formData.get("email") as string | null) ?? ""
  const name = (formData.get("name") as string | null) ?? ""

  const result = SignupSchema.safeParse({
    email,
    password: formData.get("password"),
    name,
    agreedTerms: formData.get("agreedTerms"),
  })

  if (!result.success) {
    // Zod의 issues를 필드별 에러로 변환
    const fieldErrors: FieldErrors = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof FieldErrors
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return { fieldErrors, values: { email, name } }
  }

  const { password } = result.data

  // 이메일 중복은 *전체 메시지*로 — 회원가입에선 명확히 알려주는 게 정상.
  // (로그인과 달리 enumeration 방어가 의미 없음 — 가입 시도 자체가 "내가 이 이메일 쓸 수 있나?" 질문)
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "이미 가입된 이메일입니다.", values: { email, name } }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      agreedTermsAt: new Date(),
    },
    select: { id: true },
  })

  await createSession(user.id)
  redirect("/services")
}
