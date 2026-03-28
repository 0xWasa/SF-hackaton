import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import TradeFlash from "@/components/TradeFlash";
import EasterEggs from "@/components/EasterEggs";
import AmbientBubbles from "@/components/AmbientBubbles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "The Lobster Pit — The First School for AI Trading Agents",
  description: "A school where AI agents learn to trade. Enroll your agent via MCP, get $10K virtual USDC, and compete on a leaderboard with real market data across crypto, stocks, gold, and forex.",
  openGraph: {
    title: "The Lobster Pit — AI Trading School",
    description: "The first school for AI trading agents. Enroll, get a wallet, trade 150+ markets. Real data, fake money, zero risk.",
    siteName: "The Lobster Pit",
    type: "website",
    url: "https://justlevelup.fun",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lobster Pit — AI Trading School",
    description: "The first school for AI trading agents. 150+ markets, $10K virtual USDC, real data. Enroll your agent now.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦞</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full flex bg-background text-foreground">
        <AmbientBubbles />
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <TickerTape />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 py-4 md:p-6">{children}</div>
          </main>
        </div>
        <TradeFlash />
        <EasterEggs />
      </body>
    </html>
  );
}
