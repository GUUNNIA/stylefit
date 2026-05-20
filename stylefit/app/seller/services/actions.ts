// /seller/services Server Actions (Day 15 — 4단계)
//
// 본인 서비스의 *노출 여부* 토글. 셀러 측 "숨기기" / "다시 노출" 버튼이 호출.
//
// *명시 set* 패턴 (토글 X):
//   클라가 nextActive("true"/"false") 를 hidden 으로 보냄.
//   서버는 현재 isActive 를 *읽지 않고* 그대로 set.
//   → 두 탭 동시 작업 race condition 차단 (사용자가 본 상태가 그대로 적용).
//
// 본인 소유 검증:
//   updateMany 의 복합 where { id, sellerProfileId } — 수정 액션과 동일 패턴.
//   남의 서비스 ID 조작 시 0 rows updated (조용히 실패).
//
// 정책:
//   - isActive 토글은 *검증 상태(verificationStatus) 와 무관*. pending/rejected
//     서비스도 셀러가 *나중에 노출하려고* 미리 비활성화·활성화 가능.
//   - "삭제" 아님 — DB 레코드와 외래키(Booking·Review) 모두 보존.
//     UI 라벨도 "숨기기" / "다시 노출" 로 정직.

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { revalidatePath } from "next/cache"
import { SellerActivity } from "@prisma/client"

export async function setServiceVisibilityAction(formData: FormData) {
  // 1) 권한 — 본인 셀러 + 승인 상태
  const sellerProfile = await requireSellerProfile("/seller/services")

  // 2) serviceId 안전 변환 — 잘못된 값이면 조용히 무시 (admin extractServiceId 패턴)
  const rawId = formData.get("serviceId")
  const serviceId = Number(rawId)
  if (!Number.isInteger(serviceId) || serviceId <= 0) return

  // 3) 원하는 상태 — *명시 set*. "true" 이외의 모든 값은 false 로 해석.
  //    토글이 아니라 명시 값이라 *현재 상태 read* 가 필요 없음 (race-safe).
  const nextActive = formData.get("nextActive") === "true"

  // 4) 본인 소유 + 상태 변경 + 활동 로그 동시 처리 (Day 20)
  //    interactive callback — *분기 의존성* (count > 0 일 때만 log create).
  //    race-safe 정신 유지 — 현재 isActive read X. 같은 값 set 도 본인 액션이라 *기록* (셀러 의도 추적).
  //    metadata.to = nextActive — 방향 보존. 조회 화면에서 "활성화/비활성화" 표시에 사용.
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.service.updateMany({
      where: {
        id: serviceId,
        sellerProfileId: sellerProfile.id,
      },
      data: { isActive: nextActive },
    })

    // count > 0 — 본인 소유 서비스. 활동 로그 추가. (남의 ID 조작은 *유령 로그* 안 만듦)
    if (count > 0) {
      await tx.sellerActivityLog.create({
        data: {
          sellerProfileId: sellerProfile.id,
          activity: SellerActivity.toggled,
          serviceId,
          metadata: { to: nextActive },
        },
      })
    }
  })

  // 5) 캐시 무효화 — 셀러 본인 목록 + 구매자 공개 목록(숨겨진 서비스 사라져야 함)
  revalidatePath("/seller/services")
  revalidatePath("/services")
}
