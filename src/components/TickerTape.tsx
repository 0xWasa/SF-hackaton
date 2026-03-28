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
        const [marketsRes, leaderboardRes] = await Promise.all([
          fetch("/api/markets").then((r) => r.json()),
          fetch("/api/leaderboard").then((r) => r.json()),
        ]);

        const tickers: TickerItem[] = [];

        // Add top 8 markets with real 24h changes
        const markets = (marketsRes.markets || []).slice(0, 8);
        for (const m of markets) {
          tickers.push({
            symbol: m.symbol,
            price: m.price,
            change24h: m.change24h,
          });
        }

        // Add agents
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
            {item.symbol ? (
              <>
                <span className="text-foreground/70 font-semibold">{item.symbol}</span>
                <span className="text-foreground/50">
                  ${item.price! >= 1 ? item.price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.price!.toFixed(4)}
                </span>
                {item.change24h !== undefined && item.change24h !== 0 && (
                  <span className={item.change24h >= 0 ? "text-profit" : "text-loss"}>
                    {item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(1)}%
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-accent">🦞</span>
                <span className="text-foreground/70">{item.agentName}</span>
                <span className={item.pnl! >= 0 ? "text-profit" : "text-loss"}>
                  {item.pnl! >= 0 ? "+" : ""}${item.pnl!.toFixed(2)}
                </span>
              </>
            )}
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
