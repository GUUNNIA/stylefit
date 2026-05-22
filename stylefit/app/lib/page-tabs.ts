// admin / seller 영역의 sub-nav 항목 정의 (Day 28).
//
// 한 곳에서 관리 → 메뉴 순서 변경·항목 추가가 한 줄 수정으로 끝남.
// PageTabs 컴포넌트가 items prop 으로 받아서 렌더.

import type { PageTab } from "@/app/components/PageTabs"

// admin 페이지 sub-nav — 3 페이지 (감사 로그 / 셀러 / 서비스).
// 운영자가 가장 자주 보는 *감사 로그* 가 첫 탭. 액션 페이지 (셀러/서비스) 가 그 다음.
export const ADMIN_TABS: PageTab[] = [
  { href: "/admin/audit-log", label: "감사 로그" },
  { href: "/admin/sellers", label: "셀러 관리" },
  { href: "/admin/services", label: "서비스 관리" },
]

// seller 페이지 sub-nav — 3 페이지 (내 서비스 / 받은 예약 / 활동 이력).
// 셀러의 주력 동선 *내 서비스* 가 첫 탭. 행동 필요 *받은 예약* 이 그 다음.
export const SELLER_TABS: PageTab[] = [
  { href: "/seller/services", label: "내 서비스" },
  { href: "/seller/bookings", label: "받은 예약" },
  { href: "/seller/activity-log", label: "활동 이력" },
]
