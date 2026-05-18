// Data Access Layer — 보호된 라우트·데이터 접근의 단일 진입점 (Day 8)
//
// 모든 보호된 API/페이지가 여기를 거쳐서 세션을 확인하고 사용자 데이터를 가져온다.
// 이 파일이 *유일한 인증 체크 지점*이 되면 보안 로직 변경이 한 곳에서 끝남.
//
// 참고: 공식 docs는 React cache()로 같은 render pass 내 중복 호출 방지를 권장하지만,
// 현재는 Route Handler에서만 호출되므로(요청당 1회) cache 없이 단순하게 둠.

import { redirect } from "next/navigation"
import { getSession } from "@/app/lib/session"
import { prisma } from "@/app/lib/prisma"

// 세션 검증. 유효한 세션 없으면 null.
// 보호 API는 이 결과가 null이면 401 반환.
export async function verifySession() {
  const session = await getSession()
  if (!session?.userId) return null
  return { userId: session.userId }
}

// 현재 로그인 사용자의 정보. 세션 없으면 null.
// select 화이트리스트로 passwordHash 등 민감 필드 *절대 응답에 안 흘림*.
export async function getCurrentUser() {
  const session = await verifySession()
  if (!session) return null

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageUrl: true,
      createdAt: true,
    },
  })
}

// 셀러 페이지 보호용 — 비로그인/구매자만/미승인 셀러를 모두 차단 (Day 13)
//
// 정책:
// - 비로그인           → /login?from=<returnUrl>
// - 로그인 + 셀러 아님 → /services
// - 로그인 + pending/rejected → /services (Day 14+에 별도 안내 페이지로 분기 예정)
//
// 반환된 profile 은 *반드시 NonNull* — redirect()가 never 반환이라
// 호출 측에서 narrowing 자동 적용. 호출 측은 if 분기 없이 바로 사용 가능.
//
// 주의: redirect() 는 throw로 작동 → try/catch 안에서 호출하면 무효화됨.
// returnUrl: /login 후 복귀할 경로. 페이지마다 명시. 자동 추출은 Day 14+에 도입 예정.
export async function requireSellerProfile(returnUrl: string) {
  const session = await verifySession()
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.userId },
  })
  if (profile?.verificationStatus !== "approved") {
    redirect("/services")
  }

  return profile
}
