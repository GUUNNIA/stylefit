import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import ThemeProvider from "./components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stylefit",
  description: "디자이너와 만나는 마켓플레이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes 가 mount 시 html 의 class 를 갱신해서
    // 서버↔클라 마크업 차이 경고가 뜨는 걸 막음. *한 레벨만* 적용되므로 안전.
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* attribute="class": Tailwind v4 의 dark variant 가 html.dark 클래스를 보도록.
            defaultTheme/enableSystem: 시스템 설정 자동 감지 + 사용자 토글로 override. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
