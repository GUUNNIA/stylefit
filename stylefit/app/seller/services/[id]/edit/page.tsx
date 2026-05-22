// /seller/services/[id]/edit — 본인 서비스 수정 페이지 (Day 15)
//
// Server Component 패턴 (/services/[id] 와 동일):
//   - async page, params는 Promise → await
//   - parseInt + isNaN 가드
//   - prisma 직접 호출
//
// 보안 핵심 — *본인 소유 검증* (이중):
//   1) 페이지 진입 시: findFirst({ where: { id, sellerProfileId } }) 로 복합 조건 조회
//   2) Server Action 호출 시: updateMany 의 복합 where 로 다시 검증 (actions.ts 참고)
//   notFound 선택 이유: redirect 면 "존재함" 이 흘러나가는 반면
//   notFound 는 *존재 여부 자체를 숨김* — enumeration 방어.
//
// durationMinutes 역변환:
//   DB(단일 분 컬럼) → 폼(일/시간/분 세 단위) — 입력 단위 ≠ 저장 단위.
//   formatDuration 이 *표시* 역변환이라면 여기는 *입력* 역변환.

import { notFound } from "next/navigation"
import { prisma } from "@/app/lib/prisma"
import { requireSellerProfile } from "@/app/lib/dal"
import EditServiceForm from "./EditServiceForm"

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const serviceId = parseInt(id, 10)
  if (isNaN(serviceId)) notFound()

  const sellerProfile = await requireSellerProfile(
    `/seller/services/${serviceId}/edit`
  )

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      sellerProfileId: sellerProfile.id,
    },
  })
  if (!service) notFound()

  // 분 단위 단일 컬럼 → 일/시간/분 세 단위로 분해.
  // 모든 값을 string 으로 — defaultValue 가 FormData 와 같은 형태 유지.
  const days = Math.floor(service.durationMinutes / 1440)
  const hoursRemainder = service.durationMinutes % 1440
  const hours = Math.floor(hoursRemainder / 60)
  const minutes = service.durationMinutes % 60

  const initial = {
    title: service.title,
    description: service.description,
    serviceType: service.serviceType,
    category: service.category,
    price: String(service.price),
    days: String(days),
    hours: String(hours),
    minutes: String(minutes),
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">서비스 수정</h1>
      <p className="mb-8 text-sm text-ink-subtle">
        수정한 내용은 운영자 재검증을 거쳐야 다시 노출됩니다.
      </p>

      <EditServiceForm serviceId={service.id} initial={initial} />
    </main>
  )
}
