// Data Access Layer — 보호된 라우트·데이터 접근의 단일 진입점 (Day 8)
//
// 모든 보호된 API/페이지가 여기를 거쳐서 세션을 확인하고 사용자 데이터를 가져온다.
// 이 파일이 *유일한 인증 체크 지점*이 되면 보안 로직 변경이 한 곳에서 끝남.
//
// 참고: 공식 docs는 React cache()로 같은 render pass 내 중복 호출 방지를 권장하지만,
// 현재는 Route Handler에서만 호출되므로(요청당 1회) cache 없이 단순하게 둠.

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
