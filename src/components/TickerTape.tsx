"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol?: string;
  price?: number;
  change24h?: number;
  agentName?: string;
  pnl?: number;
}

export default function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    async function fetchTicker() {
      try {
        const leaderboardRes = await fetch("/api/leaderboard").then((r) => r.json());

        const tickers: TickerItem[] = [];

        // Only show AI agents / lobsters
        for (const a of leaderboardRes.leaderboard || []) {
          tickers.push({ agentName: a.name, pnl: a.pnl });
        }

        setItems(tickers);
      } catch {
        // silent
      }
    }

    fetchTicker();
    const interval = setInterval(fetchTicker, 8000);
    return () => clearInterval(interval);
  }, []);

  if (items.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-black/40 border-b border-card-border/30 py-1.5 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-950/[0.06] to-transparent" />
      <div className="ticker-scroll flex gap-8 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 text-xs font-mono shrink-0">
            <span className="text-accent">🦞</span>
            <span className="text-foreground/70">{item.agentName}</span>
            <span className={item.pnl! >= 0 ? "text-profit" : "text-loss"}>
              {item.pnl! >= 0 ? "+" : ""}${item.pnl!.toFixed(2)}
            </span>
          </span>
        ))}
      </div>
      <style jsx>{`
        .ticker-scroll {
          animation: ticker-scroll 30s linear infinite;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
