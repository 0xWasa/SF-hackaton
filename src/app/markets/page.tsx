"use client";

import Card from "@/components/Card";
import { useEffect, useState, useCallback } from "react";

interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
}

// Top markets to display prominently
const TOP_SYMBOLS = ["BTC", "ETH", "SOL", "DOGE", "ARB", "AVAX", "LINK", "SUI", "OP", "APE", "WLD", "SEI", "TIA", "JUP", "W", "PEPE", "WIF", "BONK", "ONDO", "ENA"];

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevPrices, setPrevPrices] = useState<Map<string, number>>(new Map());

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const newMarkets = data.markets || [];

      // Save previous prices for flash effect
      setPrevPrices(prev => {
        const map = new Map(prev);
        markets.forEach(m => map.set(m.symbol, m.price));
        return map;
      });

      setMarkets(newMarkets);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [markets]);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split into featured and all
  const featured = markets.filter(m => TOP_SYMBOLS.includes(m.symbol));
  const others = markets.filter(m => !TOP_SYMBOLS.includes(m.symbol));
  const displayMarkets = [...featured, ...others].slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-muted mt-1">
          Real-time prices from Hyperliquid mainnet — this is what the lobsters see
        </p>
      </div>

      <Card title={`All Markets (${displayMarkets.length})`} subtitle="Live prices — auto-refreshes every 5s">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-xs text-muted/60">
                  <th className="pb-3 text-left font-medium">#</th>
                  <th className="pb-3 text-left font-medium">Symbol</th>
                  <th className="pb-3 text-right font-medium">Price (USD)</th>
                  <th className="pb-3 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {displayMarkets.map((m, i) => {
                  const prev = prevPrices.get(m.symbol);
                  const changed = prev !== undefined && prev !== m.price;
                  const up = prev !== undefined && m.price > prev;

                  return (
                    <tr
                      key={m.symbol}
                      className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 text-muted/40 font-mono text-xs">{i + 1}</td>
                      <td className="py-3">
                        <span className="font-semibold">{m.symbol}</span>
                        <span className="text-muted ml-1">/ USD</span>
                      </td>
                      <td className={`py-3 text-right font-mono transition-colors ${
                        changed ? (up ? "text-profit" : "text-loss") : ""
                      }`}>
                        ${m.price >= 1
                          ? m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : m.price.toFixed(6)}
                      </td>
                      <td className="py-3 text-right">
                        {changed ? (
                          <span className={`font-mono text-xs ${up ? "text-profit" : "text-loss"}`}>
                            {up ? "▲" : "▼"}
                          </span>
                        ) : (
                          <span className="text-muted/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
