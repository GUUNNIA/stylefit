// Server Action: 서비스 예약 (Day 11)
//
// 보호된 mutation의 표준 흐름:
//   1. verifySession() — *DAL의 두 번째 사용처*. 세션 없으면 거부.
//   2. 입력 검증 (Zod + custom 비즈니스 규칙)
//   3. 권한 검증 (자기 서비스 예약 차단)
//   4. DB write (prisma.booking.create)
//   5. redirect("/bookings") — PRG 패턴, 성공 페이지로
//
// 보안 원칙: *클라이언트에서 온 모든 데이터는 의심*. user.id 같은 인증 정보는
// 절대 props/formData로 받지 말고 *서버에서 다시 verifySession()으로 조회*.

"use server"

import { prisma } from "@/app/lib/prisma"
import { verifySession } from "@/app/lib/dal"
import { z } from "zod"
import { redirect } from "next/navigation"

const BookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  // datetime-local input은 "YYYY-MM-DDTHH:MM" 문자열 — z.coerce.date()로 Date 변환
  preferredDatetime: z.coerce.date(),
  buyerMemo: z.string().max(500).optional(),
})

export type BookingState = { error?: string } | undefined

export async function bookServiceAction(
  _prevState: BookingState,
  formData: FormData
): Promise<BookingState> {
  // 1. 세션 검증 (DAL)
  const session = await verifySession()
  if (!session) {
    return { error: "로그인이 필요합니다." }
  }

  // 2. 입력 검증
  const result = BookingSchema.safeParse({
    serviceId: formData.get("serviceId"),
    preferredDatetime: formData.get("preferredDatetime"),
    buyerMemo: formData.get("buyerMemo") || undefined,
  })
  if (!result.success) {
    return { error: "입력값을 다시 확인해 주세요." }
  }
  const { serviceId, preferredDatetime, buyerMemo } = result.data

  // 5. 미래 시간 검증 (먼저 — DB 조회 전에 빠르게 거부)
  if (preferredDatetime.getTime() <= Date.now()) {
    return { error: "지난 일시는 예약할 수 없습니다." }
  }

  // 3 + 4. 서비스 존재·활성 확인 + 자기 서비스 차단
  // (sellerProfile.userId 비교를 위해 include)
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { sellerProfile: { select: { id: true, userId: true } } },
  })
  if (!service || !service.isActive) {
    return { error: "서비스를 찾을 수 없습니다." }
  }
  if (service.sellerProfile.userId === session.userId) {
    return { error: "자신의 서비스는 예약할 수 없습니다." }
  }

  // 예약 생성
  await prisma.booking.create({
    data: {
      buyerId: session.userId,
      serviceId: service.id,
      sellerProfileId: service.sellerProfile.id,
      preferredDatetime,
      buyerMemo: buyerMemo ?? null,
      // status는 schema default "pending"이 자동 적용
    },
  })

  // 성공 → /bookings로 이동 (PRG 패턴). success=1로 성공 배너 표시
  redirect("/bookings?success=1")
}
