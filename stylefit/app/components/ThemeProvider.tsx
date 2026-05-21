// next-themes 의 ThemeProvider 는 client component 라
// 서버 컴포넌트인 layout.tsx 에서 직접 import 하면 경계가 모호함.
// 얇은 래퍼로 'use client' 경계를 명시해, layout 은 서버 컴포넌트로 유지.
"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof NextThemesProvider>

export default function ThemeProvider(props: Props) {
  return <NextThemesProvider {...props} />
}
