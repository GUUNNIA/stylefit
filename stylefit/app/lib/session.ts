// JWT 기반 stateless 세션 관리 (Day 8)
//
// 세션 데이터(userId)를 *JWT로 서명*해서 쿠키에 저장한다.
// DB 없이 검증 가능 → 빠름. 대신 *발급 후 즉시 무효화*는 어려움.
//
// 보안 원칙:
// - secret은 .env에서만. 코드에 직접 X.
// - httpOnly 쿠키 → 자바스크립트로 못 읽음 (XSS 방어).
// - secure 쿠키 → production에서만 HTTPS로 전송.
//
// 주의: 이 파일은 *서버 전용*. 클라이언트 컴포넌트에서 import하면
// next/headers의 cookies()가 런타임 에러를 던진다.
// (추후 'server-only' 패키지 추가하면 빌드 타임에 조기 발견 가능)

import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SESSION_COOKIE = "session"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7일

// 환경변수 → 바이트 인코딩 (jose가 요구하는 형태)
const secret = process.env.SESSION_SECRET
if (!secret) {
  throw new Error("SESSION_SECRET 환경변수가 없습니다. .env 확인.")
}
const encodedKey = new TextEncoder().encode(secret)

export type SessionPayload = {
  userId: number
}

// 페이로드 → 서명된 JWT 문자열
export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)
}

// JWT 문자열 → 페이로드. 검증 실패(만료·서명불일치 등)면 null.
export async function decrypt(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    })
    return { userId: payload.userId as number }
  } catch {
    return null
  }
}

// 새 세션 JWT를 만들고 *쿠키에 set*. 로그인 성공 시 호출.
export async function createSession(userId: number) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt({ userId })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

// 세션 쿠키 삭제. 로그아웃 시 호출.
export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// 현재 요청의 세션 쿠키를 읽어 페이로드 반환. 없거나 무효면 null.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return decrypt(token)
}
