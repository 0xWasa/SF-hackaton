"use client";

import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface AgentAction {
  type: string;
  details: Record<string, any>;
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
  "conservative": "BTC/ETH only, 1-2x leverage, limit orders, waits for clear trends",
  "degen": "Altcoins, 5-10x leverage, market orders, chases momentum",
  "arbitrage": "Orderbook imbalances, both sides, captures spreads",
};

export default function AgentPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [allLogs, setAllLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [combinedPnl, setCombinedPnl] = useState<number | null>(null);
  const [totalTrades, setTotalTrades] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [agentRaw, leaderboardRes] = await Promise.all([
        fetch("/api/agent"),
        fetch("/api/leaderboard"),
      ]);
      const data = agentRaw.ok ? await agentRaw.json() : { agents: [] };
      const agentList: AgentStatus[] = data.agents || [];
      setAgents(agentList);

      // Merge all logs from all agents, sorted by time
      const merged = agentList
        .flatMap((a) => (a.logs || []).map((l) => ({ ...l, agentId: a.agentId, agentName: a.name })))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAllLogs(merged);

      // Combined P&L from leaderboard
      if (leaderboardRes.ok) {
        try {
          const lb = await leaderboardRes.json();
          const entries: { pnl: number; totalTrades: number }[] = lb.leaderboard || [];
          setCombinedPnl(entries.reduce((sum, e) => sum + e.pnl, 0));
          setTotalTrades(entries.reduce((sum, e) => sum + e.totalTrades, 0));
        } catch { /* ignore */ }
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const launchAll = async () => {
    setLaunching(true);
    setActionError(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "launch-all" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Launch failed (${res.status})`);
      } else {
        await fetchData();
      }
    } catch {
      setActionError("Network error — could not reach server");
    }
    setLaunching(false);
  };

  const stopAll = async () => {
    setStopping(true);
    setActionError(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || `Stop failed (${res.status})`);
      } else {
        await fetchData();
      }
    } catch {
      setActionError("Network error — could not reach server");
    }
    setStopping(false);
  };

  const runningCount = agents.filter((a) => a.isRunning).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agent Log</h1>
          <p className="text-sm text-muted mt-1">
            Peek inside the lobster&apos;s brain — watch them analyze markets and make trades in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {runningCount > 0 ? (
            <StatusBadge status="trading" label={`${runningCount} lobsters active`} />
          ) : (
            <StatusBadge status="offline" label="No agents running" />
          )}
          {runningCount === 0 ? (
            <button
              onClick={launchAll}
              disabled={launching}
              className="px-5 py-2.5 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {launching ? "Launching..." : "Launch All Lobsters"}
            </button>
          ) : (
            <button
              onClick={stopAll}
              disabled={stopping}
              className="px-5 py-2.5 bg-loss/80 hover:bg-loss disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {stopping ? "Stopping..." : "Stop All"}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg border border-loss/30 bg-loss/5 px-4 py-2 text-sm text-loss">
          {actionError}
        </div>
      )}

      {/* Combined stats */}
      {(runningCount > 0 || totalTrades > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-card-border/50 bg-card p-4 text-center">
            <p className="text-xs text-muted mb-1">Lobsters Active</p>
            <p className="text-2xl font-semibold font-tabular">{runningCount} / 3</p>
          </div>
          <div className="rounded-lg border border-card-border/50 bg-card p-4 text-center">
            <p className="text-xs text-muted mb-1">Combined P&L</p>
            <p className={`text-2xl font-semibold font-tabular ${combinedPnl !== null && combinedPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {combinedPnl !== null ? `${combinedPnl >= 0 ? "+" : ""}$${combinedPnl.toFixed(2)}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-card-border/50 bg-card p-4 text-center">
            <p className="text-xs text-muted mb-1">Total Trades</p>
            <p className="text-2xl font-semibold font-tabular">{totalTrades}</p>
          </div>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.length > 0 ? agents.map((agent) => (
          <Link key={agent.agentId} href={`/agent/${agent.agentId}`}>
            <Card title={
              <span className="flex items-center gap-2">
                <span className="text-xl">{lobsterEmojis[agent.agentId] || "🦞"}</span>
                {agent.name}
              </span>
            }>
              <div className="space-y-2">
                <p className="text-xs text-muted">{lobsterDescriptions[agent.personality] || agent.personality}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Steps: <span className="font-mono">{agent.totalSteps}</span></span>
                  {agent.isRunning ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted/50">Idle</span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        )) : (
          <>
            {["The Conservative Lobster", "The Degen Lobster", "The Arbitrage Lobster"].map((name, i) => (
              <Card key={i} title={
                <span className="flex items-center gap-2">
                  <span className="text-xl">{["🦞", "🦀", "🐙"][i]}</span>
                  {name}
                </span>
              }>
                <p className="text-xs text-muted">{lobsterDescriptions[["conservative", "degen", "arbitrage"][i]]}</p>
                <p className="text-xs text-muted/40 mt-2">Not launched yet</p>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Activity log */}
      <Card title="Activity Feed" subtitle="Live stream of all agents' thinking and actions">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/[0.02] rounded animate-pulse" />
            ))}
          </div>
        ) : allLogs.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-muted/40">
            <div className="text-center max-w-sm">
              {runningCount > 0 ? (
                <>
                  <span className="text-6xl block mb-4 animate-bounce">🦞</span>
                  <p className="text-base font-medium text-muted/60 mb-2">
                    The lobsters are warming up...
                  </p>
                  <p className="text-xs leading-relaxed animate-pulse">
                    Scanning live markets, analyzing trends, building conviction.
                    First trade decisions appearing shortly.
                  </p>
                </>
              ) : (
                <>
                  <span className="text-6xl block mb-4">🦞</span>
                  <p className="text-base font-medium text-muted/60 mb-2">
                    The lobsters are napping
                  </p>
                  <p className="text-xs leading-relaxed">
                    Hit &quot;Launch All Lobsters&quot; to wake them up. They will scan the markets,
                    decide what to trade, and show you their reasoning step by step.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {allLogs.slice(0, 20).map((log, i) => {
              const action = log.actions?.[0];
              const actionType = action?.type || 'hold';
              const isError = action?.result === 'error';
              const time = new Date(log.timestamp).toLocaleTimeString();

              return (
                <Link
                  key={i}
                  href={`/agent/${log.agentId}`}
                  className="block rounded-lg border border-card-border/50 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span>{lobsterEmojis[log.agentId] || "🦞"}</span>
                      <span className="text-xs font-medium">{log.agentName}</span>
                      <span className="text-xs text-muted font-mono">{time}</span>
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
                  {log.reasoning && (
                    <p className="text-sm text-foreground/70 mb-1 line-clamp-2">
                      {log.reasoning.slice(0, 200)}
                    </p>
                  )}
                  <p className={`text-sm ${
                    actionType === 'place_trade' ? "text-accent" :
                    actionType === 'close_position' ? "text-profit" :
                    "text-muted/60"
                  }`}>
                    {action?.message || "No action"}
                  </p>
                  <p className="text-xs text-muted/40 mt-1 font-mono">
                    Portfolio: ${log.portfolioValue?.toFixed(2) || "—"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
