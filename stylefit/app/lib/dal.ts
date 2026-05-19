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

  // user 존재 확인 (시드 재실행 후 stale 세션 방어) — DB에 없으면 비로그인과 동일 처리
  const userExists = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  })
  if (!userExists) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: session.userId },
  })

  // 분기 두 종류 (Day 14):
  //   - SellerProfile *없음* (구매자만인 user) → /services (구매자 페이지로)
  //   - SellerProfile *있지만 미승인* (pending/rejected) → /seller/pending (안내 페이지)
  // pending/rejected 셀러가 *왜 못 들어가는지* 명확히 알 수 있게 분리.
  if (!profile) {
    redirect("/services")
  }
  if (profile.verificationStatus !== "approved") {
    redirect("/seller/pending")
  }

  return profile
}

// 어드민 페이지 보호용 — 비로그인 + 비admin 모두 차단 (Day 14)
//
// 정책:
// - 비로그인              → /login?from=<returnUrl>
// - 로그인 + role !== "admin" → /services (구매자 페이지로 보냄)
//
// 반환된 user는 NonNull + role: "admin" 보장 (redirect()의 반환 타입이 never라
// 호출 측에서 narrowing 자동 적용).
//
// 학습 단계엔 User.role 컬럼 기반 — ADMIN_EMAILS 환경변수나 AdminProfile 테이블 대안.
// 본인 SellerProfile 패턴(1:1 별도 테이블)과 *대조적*. 두 패턴을 다 학습.
//
// 주의: redirect()는 throw → try/catch에 감싸면 무효화.
export async function requireAdmin(returnUrl: string) {
  const session = await verifySession()
  if (!session) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })
  // user 존재 확인 (시드 재실행 후 stale 세션 방어) — DB에 없으면 비로그인과 동일 처리.
  // *user 없음*과 *admin 아님*을 구분 — 전자는 /login, 후자는 /services.
  if (!user) {
    redirect(`/login?from=${encodeURIComponent(returnUrl)}`)
  }
  if (user.role !== "admin") {
    redirect("/services")
  }

  return user
}
