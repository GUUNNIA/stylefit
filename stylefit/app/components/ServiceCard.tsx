// 서비스 정보를 카드 형태로 표시하는 재사용 컴포넌트 (Day 9)
//
// 분리 이유: 세 섹션(핫·추천·전체)이 같은 카드를 씀.
// 한 곳에서 정의하고 props로 데이터만 바꿔서 재사용.

import Link from "next/link"
import { formatDuration } from "@/app/lib/format"

// 카드가 *실제로 쓰는 필드*만 타입에 명시.
// (Prisma가 자동 생성한 타입을 그대로 받을 수도 있지만,
//  학습 단계에선 *어떤 데이터를 요구하는지* 명시적으로 보이는 게 좋음)
// export하는 이유: page.tsx의 Section 컴포넌트가 같은 타입을 재사용.
export type ServiceCardData = {
  id: number
  title: string
  category: string
  serviceType: string // "online" | "offline"
  price: number
  durationMinutes: number
  sellerProfile: {
    user: { name: string }
  }
}

export default function ServiceCard({ service: s }: { service: ServiceCardData }) {
  return (
    // 카드 전체를 Link로 감쌈 → 카드 어디를 눌러도 상세 페이지 이동.
    // article(시맘틱)은 그대로 안에 유지.
    <Link href={`/services/${s.id}`} className="block">
      <article className="rounded-xl border border-zinc-200 bg-white p-5 text-zinc-900 transition hover:border-zinc-300 hover:shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {s.category} · {s.serviceType === "online" ? "온라인" : "오프라인"}
        </p>

        <h2 className="mt-3 text-lg font-semibold leading-snug">
          {s.title}
        </h2>

        <p className="mt-1 text-sm text-zinc-600">
          by {s.sellerProfile.user.name}
        </p>

        <div className="mt-4 flex items-baseline justify-between border-t border-zinc-100 pt-4">
          <span className="text-base font-semibold">
            ₩{s.price.toLocaleString()}
          </span>
          <span className="text-sm text-zinc-500">
            {formatDuration(s.durationMinutes)}
          </span>
        </div>
      </article>
    </Link>
  )
}
