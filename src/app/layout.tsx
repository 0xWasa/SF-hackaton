import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TickerTape from "@/components/TickerTape";
import TradeFlash from "@/components/TradeFlash";
import EasterEggs from "@/components/EasterEggs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Lobster Pit — AI Agent Trading Sandbox",
  description: "Train your AI agent to trade — risk free. Paper trading sandbox with real market data, powered by MCP.",
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
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TickerTape />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">{children}</div>
          </main>
        </div>
        <TradeFlash />
        <EasterEggs />
      </body>
    </html>
  );
}
