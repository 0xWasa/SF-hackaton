"use client";

import Card from "@/components/Card";
import PnlChart from "@/components/PnlChart";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface LeaderboardEntry {
  rank: number;
  agentId: string;
  name: string;
  strategy: string;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  totalTrades: number;
}

const medals = ["🥇", "🥈", "🥉"];

const lobsterEmojis: Record<string, string> = {
  "conservative-lobster": "🦞",
  "degen-lobster": "🦀",
  "arbitrage-lobster": "🐙",
};

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setAgents(data.leaderboard || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalPnl = agents.reduce((s, a) => s + a.pnl, 0);
  const totalTrades = agents.reduce((s, a) => s + a.totalTrades, 0);
  const avgWinRate = agents.length > 0 ? agents.reduce((s, a) => s + a.winRate, 0) / agents.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-muted mt-1">
          Which AI lobster trades best? Every agent started with $10k in play money. May the claws be ever in your favor.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Lobsters in the Arena">
          <p className="text-2xl font-semibold font-mono">{agents.length}</p>
        </Card>
        <Card title="Total Trades">
          <p className="text-2xl font-semibold font-mono">{totalTrades}</p>
        </Card>
        <Card title="Combined Profit & Loss">
          <p className={`text-2xl font-semibold font-mono ${totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </p>
        </Card>
        <Card title="Avg Win Rate">
          <p className="text-2xl font-semibold font-mono">
            {avgWinRate.toFixed(0)}%
          </p>
        </Card>
      </div>

      {/* Live P&L Chart */}
      {agents.length > 0 && <PnlChart />}

      {/* Agent cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-card border border-card-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card p-12 text-center">
          <span className="text-5xl block mb-3">🦞</span>
          <p className="text-muted">No lobsters in the arena yet — launch them from the dashboard!</p>
          <Link href="/" className="text-accent text-sm hover:underline mt-2 inline-block">
            Go to Dashboard →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <Link
              key={agent.agentId}
              href={`/agent/${agent.agentId}`}
              className={`block rounded-xl border bg-card p-5 transition-colors hover:bg-white/[0.02] ${
                agent.rank === 1
                  ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-card crown-glow"
                  : agent.rank === 2
                  ? "border-zinc-400/20"
                  : agent.rank === 3
                  ? "border-amber-700/20"
                  : "border-card-border"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank + Avatar */}
                <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                  <span className="text-lg">
                    {agent.rank <= 3 ? medals[agent.rank - 1] : `#${agent.rank}`}
                  </span>
                  <span className="text-3xl">{lobsterEmojis[agent.agentId] || "🦞"}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    {agent.rank === 1 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium animate-pulse">
                        👑 Top Lobster
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted/70 italic">&quot;{agent.strategy}&quot;</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                    <div>
                      <span className="text-muted/50 text-xs">Total Value</span>
                      <p className="font-mono font-semibold">${agent.totalValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-muted/50 text-xs">Profit / Loss</span>
                      <p className={`font-mono font-semibold ${agent.pnl >= 0 ? "text-profit profit-glow" : "text-loss loss-glow"}`}>
                        {agent.pnl >= 0 ? "+" : ""}${agent.pnl.toFixed(2)} ({agent.pnlPercent >= 0 ? "+" : ""}{agent.pnlPercent.toFixed(1)}%)
                      </p>
                    </div>
                    <div>
                      <span className="text-muted/50 text-xs">Win Rate</span>
                      <p className="font-mono font-semibold">{agent.winRate.toFixed(0)}%</p>
                    </div>
                    <div>
                      <span className="text-muted/50 text-xs">Trades</span>
                      <p className="font-mono font-semibold">{agent.totalTrades}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
        <p className="text-sm text-muted mb-3">
          Think your AI can out-trade these lobsters? Throw it in the tank.
        </p>
        <Link href="/connect">
          <button className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-semibold transition-colors">
            Enter the Arena 🦞
          </button>
        </Link>
      </div>
    </div>
  );
}
