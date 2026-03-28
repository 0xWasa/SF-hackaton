"use client";

import Card from "@/components/Card";
import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface OrderbookLevel {
  price: number;
  size: number;
}

interface AgentActivity {
  agentId: string;
  name: string;
  positions: { side: string; size: number; entryPrice: number; leverage: number }[];
  recentTrades: { side: string; size: number; price: number; timestamp: string; pnl?: number }[];
}

interface MarketDetail {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  funding: number;
  openInterest: number;
  candles: CandleData[];
  orderbook: { bids: OrderbookLevel[]; asks: OrderbookLevel[] };
  agentActivity: AgentActivity[];
}

function MiniChart({ candles }: { candles: CandleData[] }) {
  if (candles.length < 2) {
    return <div className="h-48 flex items-center justify-center text-muted/40">No chart data</div>;
  }

  const closes = candles.map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const w = 600;
  const h = 180;
  const padding = 4;

  const points = closes.map((v, i) => {
    const x = padding + (i / (closes.length - 1)) * (w - 2 * padding);
    const y = h - padding - ((v - min) / range) * (h - 2 * padding);
    return `${x},${y}`;
  });

  const isUp = closes[closes.length - 1] >= closes[0];
  const color = isUp ? "#10b981" : "#ef4444";

  // Area fill
  const areaPath = `M${points[0]} ${points.join(" L")} L${w - padding},${h} L${padding},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      <defs>
        <linearGradient id={`grad-${isUp ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${isUp ? "up" : "down"})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points.join(" ")}
      />
    </svg>
  );
}

function formatPrice(price: number) {
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(6);
}

function formatVol(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

export default function MarketDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const sym = symbol.toUpperCase();
  const [data, setData] = useState<MarketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets/${sym}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sym]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/[0.02] rounded animate-pulse" />
        <div className="h-64 bg-white/[0.02] rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-white/[0.02] rounded animate-pulse" />
          <div className="h-48 bg-white/[0.02] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data || data.price === 0) {
    return (
      <div className="space-y-4">
        <Link href="/markets" className="text-sm text-accent hover:underline">← Back to Markets</Link>
        <div className="text-center py-20 text-muted/60">
          Market data not available for {sym}
        </div>
      </div>
    );
  }

  const candles = data.candles;
  const priceChangePct = data.change24h || 0;
  const high24h = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : 0;
  const low24h = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/markets" className="text-xs text-accent hover:underline">← Back to Markets</Link>
          <h1 className="text-3xl font-bold mt-1">
            {sym}
            <span className="text-muted/60 text-lg ml-2">/ USD</span>
          </h1>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-mono font-semibold">${formatPrice(data.price)}</span>
            <span className={`text-sm font-mono ${priceChangePct >= 0 ? "text-profit" : "text-loss"}`}>
              {priceChangePct >= 0 ? "▲" : "▼"} {Math.abs(priceChangePct).toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right text-sm text-muted/60 space-y-1">
          <div>24h High: <span className="text-foreground font-mono">${formatPrice(high24h)}</span></div>
          <div>24h Low: <span className="text-foreground font-mono">${formatPrice(low24h)}</span></div>
          {data.volume24h > 0 && (
            <div>24h Vol: <span className="text-foreground font-mono">${formatVol(data.volume24h)}</span></div>
          )}
          {data.funding !== 0 && (
            <div>Funding: <span className={`font-mono ${data.funding >= 0 ? "text-profit" : "text-loss"}`}>{(data.funding * 100).toFixed(4)}%</span></div>
          )}
        </div>
      </div>

      {/* Price Chart */}
      <Card title={`${sym} Price — Last 48 Hours`} subtitle="1-hour candles from Hyperliquid mainnet">
        <MiniChart candles={candles} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Orderbook */}
        <Card title="Orderbook" subtitle="Top 5 bids & asks">
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Bids */}
            <div>
              <div className="text-profit/60 font-medium mb-2 uppercase tracking-wider">Bids (Buy)</div>
              {data.orderbook.bids.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-muted/40">
                      <th className="text-left pb-1 font-normal">Price</th>
                      <th className="text-right pb-1 font-normal">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orderbook.bids.map((b, i) => (
                      <tr key={i} className="text-profit/80">
                        <td className="font-mono py-0.5">${formatPrice(b.price)}</td>
                        <td className="font-mono text-right py-0.5">{b.size.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-muted/30">No bids</div>
              )}
            </div>
            {/* Asks */}
            <div>
              <div className="text-loss/60 font-medium mb-2 uppercase tracking-wider">Asks (Sell)</div>
              {data.orderbook.asks.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-muted/40">
                      <th className="text-left pb-1 font-normal">Price</th>
                      <th className="text-right pb-1 font-normal">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orderbook.asks.map((a, i) => (
                      <tr key={i} className="text-loss/80">
                        <td className="font-mono py-0.5">${formatPrice(a.price)}</td>
                        <td className="font-mono text-right py-0.5">{a.size.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-muted/30">No asks</div>
              )}
            </div>
          </div>
        </Card>

        {/* Agent Activity */}
        <Card title="Lobster Activity" subtitle="Agents trading this market">
          {data.agentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted/40 text-sm">
              No lobsters trading {sym} yet 🦞
            </div>
          ) : (
            <div className="space-y-3">
              {data.agentActivity.map((agent) => (
                <div key={agent.agentId} className="border border-card-border rounded-lg p-3">
                  <div className="text-sm font-semibold text-accent mb-1">🦞 {agent.name}</div>
                  {agent.positions.length > 0 && (
                    <div className="text-xs space-y-0.5">
                      {agent.positions.map((p, i) => (
                        <div key={i} className={p.side === "long" ? "text-profit" : "text-loss"}>
                          {p.side.toUpperCase()} {p.size} @ ${formatPrice(p.entryPrice)} ({p.leverage}x)
                        </div>
                      ))}
                    </div>
                  )}
                  {agent.recentTrades.length > 0 && (
                    <div className="mt-1.5 text-xs text-muted/60 space-y-0.5">
                      {agent.recentTrades.slice(-3).map((t, i) => (
                        <div key={i}>
                          {t.side === "buy" ? "🟢" : "🔴"} {t.side.toUpperCase()} {t.size} @ ${formatPrice(t.price)}
                          {t.pnl !== undefined && (
                            <span className={t.pnl >= 0 ? "text-profit ml-1" : "text-loss ml-1"}>
                              {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
