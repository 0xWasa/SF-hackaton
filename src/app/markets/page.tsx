"use client";

import Card from "@/components/Card";
import LobsterSpinner from "@/components/LobsterSpinner";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h?: number;
}

type Category = "all" | "crypto" | "stocks" | "commodities" | "forex";

const STOCKS = [
  "AAPL", "TSLA", "NVDA", "GOOG", "AMZN", "META", "MSFT", "NFLX", "AMD", "INTC",
  "COIN", "MSTR", "GME", "AMC", "PLTR", "SNAP", "UBER", "ABNB", "SNOW", "SQ",
  "BABA", "NIO", "PYPL", "DIS", "BA", "JPM", "GS", "V", "MA", "WMT",
  "COST", "HD", "LOW", "TGT", "SBUX", "MCD", "KO", "PEP", "JNJ", "PFE",
  "MRNA", "LLY", "UNH", "CVS", "ABBV", "TMO", "DHR", "ABT", "BMY", "AMGN",
  "CRM", "ORCL", "ADBE", "NOW", "SHOP", "ZM", "DOCU", "ROKU", "NET", "CRWD",
  "DKNG", "PENN", "RBLX", "U", "SPOT", "SQ", "HOOD", "RIVN", "LCID", "F",
  "GM", "TM", "HMC", "RACE", "NKE", "LULU", "GPS", "ANF", "RL",
  "SPY", "QQQ", "IWM", "DIA", "XLF", "XLE", "XLK", "XLV",
  "TSM", "ASML", "AVGO", "QCOM", "TXN", "MU", "AMAT", "KLAC", "LRCX",
];
const COMMODITIES = ["GOLD", "SILVER", "OIL", "PLATINUM", "COPPER", "NATGAS", "WHEAT", "CORN", "SOYBEAN"];
const FOREX = ["EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNH", "SGD", "HKD", "KRW", "INR", "BRL", "MXN", "SEK", "NOK", "DKK", "PLN", "ZAR", "TRY"];

function categorize(symbol: string): "crypto" | "stocks" | "commodities" | "forex" {
  if (STOCKS.includes(symbol)) return "stocks";
  if (COMMODITIES.includes(symbol)) return "commodities";
  if (FOREX.includes(symbol)) return "forex";
  return "crypto";
}

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  crypto: "Crypto",
  stocks: "Stocks",
  commodities: "Commodities",
  forex: "Forex",
};

const CATEGORY_ICONS: Record<Category, string> = {
  all: "🌐",
  crypto: "₿",
  stocks: "📈",
  commodities: "🥇",
  forex: "💱",
};

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

// Mini sparkline from price history
function Sparkline({ history, current }: { history: number[]; current: number }) {
  const values = [...history, current].slice(-8);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 20;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const isUp = values[values.length - 1] >= values[0];

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        fill="none"
        stroke={isUp ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        points={points.join(" ")}
      />
    </svg>
  );
}

export default function MarketsPage() {
  const router = useRouter();
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevPrices, setPrevPrices] = useState<Map<string, number>>(new Map());
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map());
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const fetchMarkets = useCallback(async () => {
    try {
      const res = await fetch("/api/markets");
      const data = await res.json();
      const newMarkets: MarketData[] = data.markets || [];

      // Save previous prices for flash effect
      setPrevPrices((prev) => {
        const map = new Map(prev);
        markets.forEach((m) => map.set(m.symbol, m.price));
        return map;
      });

      // Accumulate price history for sparklines
      setPriceHistory((prev) => {
        const map = new Map(prev);
        newMarkets.forEach((m) => {
          const h = map.get(m.symbol) || [];
          h.push(m.price);
          if (h.length > 12) h.shift();
          map.set(m.symbol, h);
        });
        return map;
      });

      setMarkets(newMarkets);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await fetchMarkets();
    };
    run();
    const interval = setInterval(fetchMarkets, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchMarkets]);

  const filtered = useMemo(() => {
    let list = markets;
    if (category !== "all") {
      list = list.filter((m) => categorize(m.symbol) === category);
    }
    if (search) {
      const q = search.toUpperCase();
      list = list.filter((m) => m.symbol.includes(q));
    }
    return list;
  }, [markets, category, search]);

  const counts = useMemo(() => {
    const c = { all: markets.length, crypto: 0, stocks: 0, commodities: 0, forex: 0 };
    markets.forEach((m) => { c[categorize(m.symbol)]++; });
    return c;
  }, [markets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-muted mt-1">
          150+ markets — crypto, stocks, commodities, forex — all from Hyperliquid. Click any for details.
        </p>
      </div>

      {/* Asset pitch */}
      <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm text-muted">
        <span className="text-accent font-semibold">Not just crypto</span> — Your AI agent can trade stocks, crypto, gold, forex — all in one sandbox.
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              category === cat
                ? "bg-accent text-white"
                : "bg-white/[0.04] text-muted hover:text-foreground hover:bg-white/[0.08]"
            }`}
          >
            <span className="mr-1">{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
            <span className="ml-1.5 text-xs opacity-60">{counts[cat]}</span>
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search symbol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/[0.04] border border-card-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50 w-40"
          />
        </div>
      </div>

      <Card title={`${CATEGORY_LABELS[category]} Markets (${filtered.length})`} subtitle="Live prices — auto-refreshes every 5s">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LobsterSpinner size="lg" message="Fetching live prices from Hyperliquid..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm">
            <span className="text-3xl block mb-2">🦞</span>
            <p className="text-muted/40">
              {search ? `No markets matching "${search}" — even the lobster can't find it` : "No markets in this category yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-xs text-muted/60">
                  <th className="pb-3 text-left font-medium">#</th>
                  <th className="pb-3 text-left font-medium">Symbol</th>
                  <th className="pb-3 text-right font-medium">Price (USD)</th>
                  <th className="pb-3 text-right font-medium">24h Change</th>
                  <th className="pb-3 text-right font-medium">Trend</th>
                  <th className="pb-3 text-right font-medium">24h Volume</th>
                  <th className="pb-3 text-center font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const prev = prevPrices.get(m.symbol);
                  const changed = prev !== undefined && prev !== m.price;
                  const up = prev !== undefined && m.price > prev;
                  const cat = categorize(m.symbol);
                  const history = priceHistory.get(m.symbol) || [];

                  return (
                    <tr
                      key={m.symbol}
                      onClick={() => router.push(`/markets/${m.symbol}`)}
                      className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 text-muted/40 font-mono text-xs">{i + 1}</td>
                      <td className="py-3">
                        <Link href={`/markets/${m.symbol}`} className="block">
                          <span className="font-semibold group-hover:text-accent transition-colors">{m.symbol}</span>
                          <span className="text-muted ml-1">/ USD</span>
                        </Link>
                      </td>
                      <td className={`py-3 text-right font-mono transition-colors ${
                        changed ? (up ? "text-profit" : "text-loss") : ""
                      }`}>
                        <Link href={`/markets/${m.symbol}`} className="block">
                          ${m.price >= 1
                            ? m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : m.price.toFixed(6)}
                        </Link>
                      </td>
                      <td className="py-3 text-right font-mono text-xs">
                        {m.change24h !== undefined && m.change24h !== 0 ? (
                          <span className={m.change24h >= 0 ? "text-profit" : "text-loss"}>
                            {m.change24h >= 0 ? "+" : ""}{m.change24h.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-muted/30">—</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Sparkline history={history} current={m.price} />
                      </td>
                      <td className="py-3 text-right font-mono text-xs text-muted/60">
                        {m.volume24h > 0 ? formatVolume(m.volume24h) : "—"}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          cat === "stocks" ? "bg-blue-500/10 text-blue-400" :
                          cat === "commodities" ? "bg-yellow-500/10 text-yellow-400" :
                          cat === "forex" ? "bg-purple-500/10 text-purple-400" :
                          "bg-accent/10 text-accent"
                        }`}>
                          {cat === "crypto" ? "Crypto" : cat === "stocks" ? "Stock" : cat === "commodities" ? "Commodity" : "Forex"}
                        </span>
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
