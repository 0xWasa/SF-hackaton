"use client";

import Card from "@/components/Card";
import LobsterSpinner from "@/components/LobsterSpinner";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import type { PaperPortfolio } from "@/types/paper-trading";

const lobsterEmojis: Record<string, string> = {
  "conservative-lobster": "🦞",
  "degen-lobster": "🦀",
  "arbitrage-lobster": "🐙",
};

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PaperPortfolio[]>([]);
  const [summary, setSummary] = useState({ totalAgents: 0, totalValue: 0, totalPnl: 0, totalTrades: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setPortfolios(data.portfolios || []);
      setSummary(data.summary || { totalAgents: 0, totalValue: 0, totalPnl: 0, totalTrades: 0 });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await fetchData();
    };
    run();
    const interval = setInterval(fetchData, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchData]);

  const totalPositions = portfolios.reduce((s, p) => s + p.positions.length, 0);
  const totalUnrealized = portfolios.reduce((s, p) =>
    s + p.positions.reduce((ps, pos) => ps + (pos.unrealizedPnl || 0), 0), 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted mt-1">
          All lobster wallets — balances, active trades, and trade history
        </p>
      </div>

      {/* Balance overview */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card title="Combined Value">
          <p className="text-2xl font-semibold font-mono">
            ${summary.totalValue > 0 ? summary.totalValue.toFixed(2) : "0.00"}
          </p>
          <p className="text-xs text-muted mt-1">{summary.totalAgents} agents</p>
        </Card>
        <Card title="Active Positions">
          <p className="text-2xl font-semibold font-mono">{totalPositions}</p>
          <p className="text-xs text-muted mt-1">Across all lobsters</p>
        </Card>
        <Card title="Unrealized P&L">
          <p className={`text-2xl font-semibold font-mono ${totalUnrealized >= 0 ? "text-profit" : "text-loss"}`}>
            {totalUnrealized >= 0 ? "+" : ""}${totalUnrealized.toFixed(2)}
          </p>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LobsterSpinner size="lg" message="Counting the lobsters' treasure..." />
        </div>
      ) : portfolios.length === 0 ? (
        <Card title="Portfolios">
          <div className="flex items-center justify-center py-16 text-sm text-muted/40">
            <div className="text-center">
              <span className="text-5xl block mb-3">🦞</span>
              <p>No lobsters in the arena yet</p>
              <p className="text-xs mt-1">Launch agents from the dashboard to see their portfolios</p>
              <Link href="/" className="text-accent text-xs hover:underline mt-2 inline-block">
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        portfolios.map((p) => (
          <Card
            key={p.agentId}
            title={
              <Link href={`/agent/${p.agentId}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                <span className="text-xl">{lobsterEmojis[p.agentId] || "🦞"}</span>
                {p.name}
              </Link>
            }
            subtitle={p.strategy || undefined}
          >
            {/* Wallet Address */}
            {p.walletAddress && (
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-card-border/30 max-w-full overflow-hidden">
                <span className="text-xs text-muted/50 shrink-0">Wallet</span>
                <code className="text-xs font-mono text-accent/80 truncate">{p.walletAddress}</code>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <span className="text-muted/50 text-xs">Balance</span>
                <p className="font-mono font-semibold">${p.balance.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted/50 text-xs">Total Value</span>
                <p className="font-mono font-semibold">${p.totalValue.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted/50 text-xs">P&L</span>
                <p className={`font-mono font-semibold ${p.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {p.totalPnl >= 0 ? "+" : ""}${p.totalPnl.toFixed(2)} ({p.totalPnlPercent >= 0 ? "+" : ""}{p.totalPnlPercent.toFixed(1)}%)
                </p>
              </div>
              <div>
                <span className="text-muted/50 text-xs">Win Rate</span>
                <p className="font-mono font-semibold">{p.winRate.toFixed(0)}% ({p.totalTrades} trades)</p>
              </div>
            </div>

            {/* Positions */}
            {p.positions.length > 0 ? (
              <div>
                <h4 className="text-xs text-muted/60 font-medium mb-2">Open Positions</h4>
                <div className="space-y-2">
                  {p.positions.map((pos) => (
                    <div key={pos.symbol} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-3 rounded-lg bg-white/[0.02] border border-card-border/50">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${pos.side === 'long' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                          {pos.side.toUpperCase()}
                        </span>
                        <span className="font-semibold">{pos.symbol}</span>
                        <span className="text-xs text-muted">{pos.leverage}x</span>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs sm:text-sm">{pos.size} @ ${pos.entryPrice.toFixed(2)}</p>
                        <p className={`font-mono text-xs ${(pos.unrealizedPnl || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                          {(pos.unrealizedPnl || 0) >= 0 ? "+" : ""}${(pos.unrealizedPnl || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted/40">No open positions — the lobster is still warming up 🦞</p>
            )}

            {/* Recent Trades */}
            {p.recentTrades.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs text-muted/60 font-medium mb-2">Recent Trades</h4>
                <div className="space-y-1">
                  {p.recentTrades.slice(-5).reverse().map((t) => (
                    <div key={t.id} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 py-1.5 border-b border-card-border/20 last:border-0 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 ${t.side === 'buy' ? "text-profit" : "text-loss"}`}>
                          {t.side.toUpperCase()}
                        </span>
                        <span className="shrink-0">{t.symbol}</span>
                        <span className="text-muted truncate">{t.size} @ ${t.price.toFixed(2)}</span>
                        <span className="text-muted shrink-0">{t.leverage}x</span>
                      </div>
                      {t.pnl !== undefined && (
                        <span className={`font-mono shrink-0 ${t.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                          {t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
