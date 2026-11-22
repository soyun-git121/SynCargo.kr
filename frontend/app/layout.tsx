import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans_KR } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoStateProvider } from "@/lib/demo-state";
import { getOpenReviews } from "@syncargo/backend/data";
import "./globals.css";

const plexSans = IBM_Plex_Sans_KR({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SynCargo",
  description: "포워딩 실무자를 위한 메일 기반 업무 정리",
};

/** 시연용 상태는 실무자·대표 화면이 함께 쓰므로 맨 위에 둔다 (대표 승인 → 실무자 인계 목록에 반영 등) */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const openReviews = await getOpenReviews();
  return (
    <html lang="ko" className={`${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <TooltipProvider>
          <DemoStateProvider initialOpenReviews={openReviews}>{children}</DemoStateProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
