"use client";

import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import AgentBrain from "@/components/AgentBrain";
import Link from "next/link";
import { useEffect, useState, useCallback, use } from "react";

interface AgentAction {
  type: string;
  details: Record<string, string | number | boolean | undefined>;
  result: string;
  message: string;
}

interface AgentLog {
  timestamp: string;
  agentId: string;
  agentName: string;
  observation: string;
  reasoning: string;
  actions: AgentAction[];
  portfolioValue: number;
}

interface AgentStatus {
  agentId: string;
  name: string;
  personality: string;
  isRunning: boolean;
  lastStep?: string;
  totalSteps: number;
  logs: AgentLog[];
}

const lobsterEmojis: Record<string, string> = {
  "conservative-lobster": "🦞",
  "degen-lobster": "🦀",
  "arbitrage-lobster": "🐙",
};

const lobsterDescriptions: Record<string, string> = {
  "conservative": "BTC/ETH only, 1-2x leverage, waits for clear trends. Slow and steady wins the race.",
  "degen": "Altcoins, 5-10x leverage, chases momentum. High risk, high reward. YOLO.",
  "arbitrage": "Orderbook imbalances, both sides. Captures spreads with precision.",
};

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [portfolio, setPortfolio] = useState<{
    agentId: string;
    balance: number;
    totalValue: number;
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    positions: { symbol: string; side: string; size: number; entryPrice: number; leverage: number; unrealizedPnl?: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [agentRaw, portfolioRaw] = await Promise.all([
        fetch(`/api/agent/${id}`),
        fetch("/api/portfolio"),
      ]);
      const agentRes = agentRaw.ok ? await agentRaw.json() : {};
      const portfolioRes = portfolioRaw.ok ? await portfolioRaw.json() : { portfolios: [] };

      if (agentRes.status) setStatus(agentRes.status);
      if (agentRes.logs) setLogs(agentRes.logs);

      // Find this agent's portfolio
      const p = (portfolioRes.portfolios || []).find((p: { agentId: string }) => p.agentId === id);
      if (p) setPortfolio(p);

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await fetchData();
    };
    run();
    const interval = setInterval(fetchData, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-32 bg-card border border-card-border rounded-xl animate-pulse" />
        <div className="h-64 bg-card border border-card-border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="space-y-6">
        <Link href="/agent" className="text-accent text-sm hover:underline">← Back to Agent Log</Link>
        <div className="rounded-xl border border-card-border bg-card p-12 text-center">
          <span className="text-5xl block mb-3">🦞</span>
          <p className="text-muted">Agent not found. Launch lobsters from the dashboard first!</p>
          <Link href="/" className="text-accent text-sm hover:underline mt-2 inline-block">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  const emoji = lobsterEmojis[id] || "🦞";
  const personality = status.personality || "unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agent" className="text-muted hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-4xl">{emoji}</span>
          <div>
            <h1 className="text-2xl font-semibold">{status.name}</h1>
            <p className="text-sm text-muted">{lobsterDescriptions[personality] || personality}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status.isRunning ? (
            <StatusBadge status="trading" label="Active" />
          ) : (
            <StatusBadge status="offline" label="Idle" />
          )}
          <span className="text-xs text-muted font-mono">{status.totalSteps} steps</span>
        </div>
      </div>

      {/* Portfolio Stats */}
      {portfolio && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card title="Balance">
            <p className="text-lg font-semibold font-mono">${portfolio.balance.toFixed(2)}</p>
          </Card>
          <Card title="Total Value">
            <p className="text-lg font-semibold font-mono">${portfolio.totalValue.toFixed(2)}</p>
          </Card>
          <Card title="P&L">
            <p className={`text-lg font-semibold font-mono ${portfolio.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {portfolio.totalPnl >= 0 ? "+" : ""}${portfolio.totalPnl.toFixed(2)}
            </p>
          </Card>
          <Card title="Win Rate">
            <p className="text-lg font-semibold font-mono">{portfolio.winRate.toFixed(0)}%</p>
          </Card>
          <Card title="Trades">
            <p className="text-lg font-semibold font-mono">{portfolio.totalTrades}</p>
          </Card>
        </div>
      )}

      {/* Open Positions */}
      {portfolio && portfolio.positions.length > 0 && (
        <Card title="Open Positions">
          <div className="space-y-2">
            {portfolio.positions.map((pos) => (
              <div key={pos.symbol} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-card-border/50">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.side === 'long' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                    {pos.side.toUpperCase()}
                  </span>
                  <span className="font-semibold">{pos.symbol}</span>
                  <span className="text-xs text-muted">{pos.leverage}x</span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{pos.size} @ ${pos.entryPrice.toFixed(2)}</p>
                  <p className={`font-mono text-xs ${(pos.unrealizedPnl || 0) >= 0 ? "text-profit" : "text-loss"}`}>
                    {(pos.unrealizedPnl || 0) >= 0 ? "+" : ""}${(pos.unrealizedPnl || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Live Agent Brain — typewriter effect for the latest step */}
      {logs.length > 0 && (() => {
        const latest = logs[logs.length - 1];
        return (
          <Card title="Live Brain" subtitle="Latest step — watching the lobster think in real-time">
            <AgentBrain
              observation={latest.observation}
              reasoning={latest.reasoning}
              actions={latest.actions}
              animate={status.isRunning}
            />
          </Card>
        );
      })()}

      {/* Agent Brain - Full Reasoning Stream */}
      <Card title="Full Reasoning Log" subtitle="Every observation, thought, and action">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted/40">
            <div className="text-center">
              <span className="text-5xl block mb-3">{emoji}</span>
              <p>No reasoning logs yet — the lobster hasn&apos;t made any decisions</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[700px] overflow-y-auto">
            {[...logs].reverse().map((log, i) => {
              const action = log.actions?.[0];
              const actionType = action?.type || 'hold';
              const isError = action?.result === 'error';
              const time = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    i === 0 ? "border-accent/30 bg-accent/5" : "border-card-border/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted font-mono">{time}</span>
                      <span className="text-xs text-muted/40">Step #{logs.length - i}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isError ? "bg-loss/10 text-loss" :
                      actionType === 'place_trade' ? "bg-accent/10 text-accent" :
                      actionType === 'close_position' ? "bg-profit/10 text-profit" :
                      "bg-zinc-500/10 text-zinc-400"
                    }`}>
                      {actionType === 'place_trade' ? 'TRADE' : actionType === 'close_position' ? 'CLOSE' : 'HOLD'}
                    </span>
                  </div>

                  {/* Observation */}
                  {log.observation && (
                    <div className="mb-2">
                      <span className="text-xs text-muted/50 font-medium">OBSERVE</span>
                      <p className="text-xs text-muted/70 font-mono mt-1 whitespace-pre-wrap line-clamp-3">
                        {log.observation.slice(0, 300)}
                      </p>
                    </div>
                  )}

                  {/* Reasoning */}
                  {log.reasoning && (
                    <div className="mb-2">
                      <span className="text-xs text-foreground/50 font-medium">THINK</span>
                      <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                        {log.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {log.actions && log.actions.length > 0 && (
                    <div>
                      <span className="text-xs text-accent/70 font-medium">ACT</span>
                      {log.actions.map((a, j) => (
                        <p key={j} className={`text-sm mt-1 font-medium ${
                          a.result === 'error' ? "text-loss" :
                          a.type === 'place_trade' ? "text-accent" :
                          a.type === 'close_position' ? "text-profit" :
                          "text-muted/60"
                        }`}>
                          {a.message}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Portfolio value */}
                  <div className="mt-2 pt-2 border-t border-card-border/20">
                    <span className="text-xs text-muted/40 font-mono">
                      Portfolio: ${log.portfolioValue?.toFixed(2) || "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
