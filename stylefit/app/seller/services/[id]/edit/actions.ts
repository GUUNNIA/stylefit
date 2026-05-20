// /seller/services/[id]/edit — 본인 서비스 수정 Server Action (Day 15 — 2단계)
//
// 등록(actions.ts/new) 패턴 거의 그대로. 차이 두 군데:
//
//   1. 본인 *소유* 검증 — id 단독 update 가 아니라 updateMany 의 복합 where 로
//      `id + sellerProfileId` 둘 다 매칭. 클라가 hidden serviceId 를 조작해
//      남의 서비스를 수정하려 해도 0 rows updated 로 조용히 실패.
//      (admin actions.ts 는 권한이 admin 이라 id 단독 update OK — 패턴 차이의 이유)
//
//   2. 수정 후 *재검증 강제* — verificationStatus: "pending", rejectionReason: null.
//      Day 14 정신: 검증 통과한 내용을 셀러가 조용히 바꿔치는 걸 차단.
//      반려된 서비스를 셀러가 수정해 재제출하는 흐름도 같이 커버.

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { SERVICE_CATEGORIES } from "@/app/lib/service-categories"
import { z } from "zod"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { ServiceVerificationStatus, SellerActivity } from "@prisma/client"

// 등록 폼 Zod 와 동일 — 같은 비즈니스 규칙 (검증 통과 == 합법한 서비스 데이터).
// 동일 스키마를 두 액션에서 *복붙* 하는 형태. 15-5 에서 추출 여부 판단.
const UpdateServiceSchema = z
  .object({
    title: z
      .string()
      .min(1, "제목을 입력해 주세요.")
      .max(80, "제목은 80자 이내로 입력해 주세요."),
    description: z
      .string()
      .min(1, "설명을 입력해 주세요.")
      .max(500, "설명은 500자 이내로 입력해 주세요."),
    serviceType: z.enum(["online", "offline"], {
      message: "서비스 유형을 선택해 주세요.",
    }),
    category: z.enum(SERVICE_CATEGORIES, {
      message: "카테고리를 선택해 주세요.",
    }),
    price: z.coerce
      .number()
      .max(100_000_000, "가격은 1억원 이하로 입력해 주세요.")
      .int("가격은 정수로 입력해 주세요.")
      .positive("가격은 0보다 커야 합니다."),
    days: z.coerce.number().int().min(0, "일은 0 이상으로 입력해 주세요."),
    hours: z.coerce
      .number()
      .int()
      .min(0)
      .max(23, "시간은 0부터 23 사이로 입력해 주세요."),
    minutes: z.coerce
      .number()
      .int()
      .min(0)
      .max(59, "분은 0부터 59 사이로 입력해 주세요."),
  })
  .refine(
    (data) => data.days * 1440 + data.hours * 60 + data.minutes > 0,
    { message: "소요 시간은 최소 1분 이상이어야 합니다." }
  )

export type UpdateServiceState =
  | {
      error?: string
      values?: {
        title?: string
        description?: string
        serviceType?: string
        category?: string
        price?: string
        days?: string
        hours?: string
        minutes?: string
      }
    }
  | undefined

export async function updateServiceAction(
  _prevState: UpdateServiceState,
  formData: FormData
): Promise<UpdateServiceState> {
  // 1) 권한 — 셀러 본인 + 승인 상태 (returnUrl 은 사용자가 다시 시도할 위치)
  const sellerProfile = await requireSellerProfile("/seller/services")

  // 2) serviceId 안전 변환 — hidden input 으로 받음.
  //    잘못된 값이면 *조용히 무시* 후 목록으로 보냄 (admin extractServiceId 패턴).
  const rawId = formData.get("serviceId")
  const serviceId = Number(rawId)
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    redirect("/seller/services")
  }

  // 3) 입력값 추출 (검증 실패 시 폼 복원용)
  const raw = {
    title: (formData.get("title") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    serviceType: (formData.get("serviceType") as string | null) ?? "",
    category: (formData.get("category") as string | null) ?? "",
    price: (formData.get("price") as string | null) ?? "",
    days: ((formData.get("days") as string | null) || "0").trim(),
    hours: ((formData.get("hours") as string | null) || "0").trim(),
    minutes: ((formData.get("minutes") as string | null) || "0").trim(),
  }

  const result = UpdateServiceSchema.safeParse(raw)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return {
      error: firstIssue?.message ?? "입력값을 확인해 주세요.",
      values: raw,
    }
  }

  const durationMinutes =
    result.data.days * 1440 + result.data.hours * 60 + result.data.minutes

  // 4) 본인 소유 + 수정 + 활동 로그 동시 처리 (Day 20)
  //    interactive callback transaction — *분기 의존성* (count > 0 일 때만 log create)
  //    sequential array 로는 *count 결과로 두 번째 query 결정* 불가능.
  //    count 는 return 값으로 *transaction 밖* 으로 — redirect 분기에 사용.
  //
  //    updateMany 의 복합 where — *남의 서비스 ID 조작* 시 count=0 으로 조용히 실패.
  //    수정 시 항상 *pending 되돌림* + 반려 사유 클리어 — 재검증 강제 (Day 14 정신).
  const count = await prisma.$transaction(async (tx) => {
    const { count } = await tx.service.updateMany({
      where: {
        id: serviceId,
        sellerProfileId: sellerProfile.id,
      },
      data: {
        title: result.data.title,
        description: result.data.description,
        serviceType: result.data.serviceType,
        category: result.data.category,
        price: result.data.price,
        durationMinutes,
        verificationStatus: ServiceVerificationStatus.pending,
        rejectionReason: null,
      },
    })

    // count > 0 — 본인 소유 서비스 진짜 수정됨. 활동 로그 추가.
    // count === 0 — 남의 ID 조작 시도. log 안 만듦 (*유령 로그* 방지).
    if (count > 0) {
      await tx.sellerActivityLog.create({
        data: {
          sellerProfileId: sellerProfile.id,
          activity: SellerActivity.updated,
          serviceId,
        },
      })
    }

    return count
  })

  // count === 0 이면 본인 소유 아닌 ID 였거나 이미 삭제된 서비스.
  // 조용히 목록으로 — *어떤 ID 가 존재하는지* 정보 누설 안 함.
  // (transaction 밖에서 redirect — 안에서 호출 시 throw 가 전체 rollback 신호로 오용됨)
  if (count === 0) {
    redirect("/seller/services")
  }

  // 캐시 무효화 — admin 검증 화면, /services 공개 목록, 내 서비스 목록 모두.
  // (전체 무효화는 admin actions.ts 보다 좀 더 — 수정은 여러 화면에 영향)
  revalidatePath("/seller/services")
  revalidatePath("/services")
  revalidatePath("/admin/services")

  redirect("/seller/services")
}
