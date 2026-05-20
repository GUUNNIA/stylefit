// /seller/services/new — 서비스 등록 Server Action (Day 13 — B 단계)
//
// Day 10 로그인 actions.ts와 동일 패턴:
//   1. 권한 재확인 (requireSellerProfile — 클라 폼 보호와 별개로 *서버에서 매번*)
//   2. Zod 검증 (실패 시 state.error 반환 + 입력값 복원용 values)
//   3. prisma.service.create — verificationStatus는 schema default "pending"으로 자동 저장
//   4. redirect("/seller/services") — 목록 페이지로
//
// 보안 포인트: sellerProfileId는 *서버에서 결정*. 클라가 hidden input으로 999 보내도
// 무시되고 본인 셀러 ID만 사용 → 폼 조작으로 남의 셀러 도용 불가.

"use server"

import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import { SERVICE_CATEGORIES } from "@/app/lib/service-categories"
import { z } from "zod"
import { redirect } from "next/navigation"
import { SellerActivity } from "@prisma/client"

// 소요 시간을 *세 단위*(일/시간/분)로 받음. DB는 단일 컬럼(durationMinutes)이라 합산 저장.
// 클라 input의 max(시간 23, 분 59)와 서버 검증을 *둘 다* 둠 — 클라 우회 시 서버에서 차단.
// .refine으로 *세 필드 합계 > 0* 검증 (0/0/0 입력 차단).
const CreateServiceSchema = z
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
    // 가격: 양수 정수만 검증. 100원 단위 제약은 *클라 step에서*만 — 서버는 셀러 자유도 ↑
    // max 1억 — SQLite Int 컬럼 한계(약 21억) 훨씬 안쪽. 비현실적 큰 값 방어 + 현실 거래는 다 커버.
    // *순서 중요*: .max 가 .int 보다 앞 — JS Number의 MAX_SAFE_INTEGER(~9000조)를 넘는 입력은
    // .int 가 "정수 아님"으로 거절하기 전에 .max 에서 먼저 친절한 한국어 메시지로 차단.
    price: z.coerce
      .number()
      .max(100_000_000, "가격은 1억원 이하로 입력해 주세요.")
      .int("가격은 정수로 입력해 주세요.")
      .positive("가격은 0보다 커야 합니다."),
    // 소요 시간 세 필드 — 입력 단위와 표시 단위(formatDuration) 일치
    days: z.coerce
      .number()
      .int()
      .min(0, "일은 0 이상으로 입력해 주세요."),
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
  // 세 단위 합산 > 0 — "0/0/0 입력" 차단
  .refine(
    (data) => data.days * 1440 + data.hours * 60 + data.minutes > 0,
    { message: "소요 시간은 최소 1분 이상이어야 합니다." }
  )

// 폼 재렌더 시 *입력값 복원용* — 모두 string으로 보관 (FormData 원본 그대로).
export type CreateServiceState =
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

export async function createServiceAction(
  _prevState: CreateServiceState,
  formData: FormData
): Promise<CreateServiceState> {
  // 권한 재확인 — 클라이언트 폼 보호와 무관하게 *서버에서 매번* 검증
  const sellerProfile = await requireSellerProfile("/seller/services/new")

  // 원본 값 추출 (검증 실패 시 폼 복원용).
  // 일/시간/분은 *비워두기 허용* → 빈 값을 "0"으로 대체. coerce.number()의 NaN 회피.
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

  const result = CreateServiceSchema.safeParse(raw)
  if (!result.success) {
    // 첫 에러 한 줄 표시 (Day 10 패턴) — 필드별 에러 표시는 학습 점프 큼
    const firstIssue = result.error.issues[0]
    return {
      error: firstIssue?.message ?? "입력값을 확인해 주세요.",
      values: raw,
    }
  }

  // 세 단위 합산 → 단일 컬럼(durationMinutes)으로 저장
  // 입력 단위 ≠ 저장 단위. formatDuration이 표시 단위로 *다시* 변환.
  const durationMinutes =
    result.data.days * 1440 + result.data.hours * 60 + result.data.minutes

  // Day 20: $transaction interactive callback — *참조 의존성* (방금 만든 service.id 를 log 에 써야)
  //   - sequential array 로는 두 query 간 참조 못 함
  //   - 두 작업이 *같은 트랜잭션* 안에서 함께 commit 되도록
  //   - redirect 는 *transaction 밖*  — throw 라 안에서 호출 시 전체 rollback
  await prisma.$transaction(async (tx) => {
    const service = await tx.service.create({
      data: {
        sellerProfileId: sellerProfile.id, // ← 서버 결정. 클라가 못 조작.
        title: result.data.title,
        description: result.data.description,
        serviceType: result.data.serviceType,
        category: result.data.category,
        price: result.data.price,
        durationMinutes,
        // verificationStatus는 schema default "pending"으로 자동 — 명시 안 함
      },
    })
    await tx.sellerActivityLog.create({
      data: {
        sellerProfileId: sellerProfile.id,
        activity: SellerActivity.created,
        serviceId: service.id, // ← 위 create 결과 참조 — sequential array 로는 불가능
      },
    })
  })

  // redirect는 throw → 함수가 끝나지 않고 자동 이동
  // (transaction callback 안에서 호출 X — throw 가 전체 rollback 신호로 오용됨)
  redirect("/seller/services")
}
