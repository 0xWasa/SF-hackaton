"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface AgentSnapshot {
  agentId: string;
  name: string;
  pnl: number;
  totalValue: number;
}

interface TimePoint {
  time: number;
  agents: AgentSnapshot[];
}

const AGENT_COLORS: Record<string, string> = {
  "conservative-lobster": "#3b82f6", // blue
  "degen-lobster": "#ef4444",        // red
  "arbitrage-lobster": "#a855f7",    // purple
};

const AGENT_EMOJIS: Record<string, string> = {
  "conservative-lobster": "🦞",
  "degen-lobster": "🦀",
  "arbitrage-lobster": "🐙",
};

const DEFAULT_COLOR = "#f97316";

const MAX_POINTS = 60; // ~3 minutes of data at 3s intervals

export default function PnlChart() {
  const [history, setHistory] = useState<TimePoint[]>([]);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (!res.ok) return;
      const data = await res.json();
      const entries: AgentSnapshot[] = (data.leaderboard || []).map(
        (a: { agentId: string; name: string; pnl: number; totalValue: number }) => ({
          agentId: a.agentId,
          name: a.name,
          pnl: a.pnl,
          totalValue: a.totalValue,
        })
      );

      if (entries.length === 0) return;

      setAgentIds((prev) => {
        const ids = entries.map((e) => e.agentId);
        if (ids.length !== prev.length || ids.some((id, i) => id !== prev[i])) return ids;
        return prev;
      });

      setHistory((prev) => {
        const next = [...prev, { time: Date.now(), agents: entries }];
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next;
      });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!cancelled) await fetchSnapshot();
    };
    run();
    const interval = setInterval(fetchSnapshot, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchSnapshot]);

  if (history.length < 2 || agentIds.length === 0) {
    return null;
  }

  // Chart dimensions
  const W = 600;
  const H = 180;
  const PAD_L = 50;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Compute Y range from all PnL values
  const allPnls = history.flatMap((pt) => pt.agents.map((a) => a.pnl));
  const minPnl = Math.min(0, ...allPnls);
  const maxPnl = Math.max(0, ...allPnls);
  const range = maxPnl - minPnl || 1;
  const padding = range * 0.15;
  const yMin = minPnl - padding;
  const yMax = maxPnl + padding;

  const toX = (i: number) => PAD_L + (i / (history.length - 1)) * chartW;
  const toY = (pnl: number) => PAD_T + chartH - ((pnl - yMin) / (yMax - yMin)) * chartH;

  // Zero line
  const zeroY = toY(0);

  // Build paths per agent
  const paths: { agentId: string; name: string; color: string; d: string; lastPnl: number; lastX: number; lastY: number }[] = [];

  for (const agentId of agentIds) {
    const points: { x: number; y: number }[] = [];
    let lastPnl = 0;

    for (let i = 0; i < history.length; i++) {
      const agent = history[i].agents.find((a) => a.agentId === agentId);
      if (agent) {
        lastPnl = agent.pnl;
        points.push({ x: toX(i), y: toY(agent.pnl) });
      }
    }

    if (points.length < 2) continue;

    const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const last = points[points.length - 1];
    const name = history[history.length - 1].agents.find((a) => a.agentId === agentId)?.name || agentId;
    const color = AGENT_COLORS[agentId] || DEFAULT_COLOR;

    paths.push({ agentId, name, color, d, lastPnl, lastX: last.x, lastY: last.y });
  }

  // Y-axis labels
  const yTicks = 5;
  const yLabels: { value: number; y: number }[] = [];
  for (let i = 0; i <= yTicks; i++) {
    const value = yMin + (i / yTicks) * (yMax - yMin);
    yLabels.push({ value, y: toY(value) });
  }

  // Time labels
  const firstTime = history[0].time;
  const lastTime = history[history.length - 1].time;
  const elapsed = Math.floor((lastTime - firstTime) / 1000);

  return (
    <div className="rounded-xl border border-card-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <h3 className="text-sm font-semibold">Live P&L</h3>
          <p className="text-xs text-muted">Real-time profit & loss per agent</p>
        </div>
        <div className="flex items-center gap-4">
          {paths.map((p) => (
            <div key={p.agentId} className="flex items-center gap-1.5">
              <span className="text-sm">{AGENT_EMOJIS[p.agentId] || "🦞"}</span>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: p.color }}
              >
                {p.lastPnl >= 0 ? "+" : ""}${p.lastPnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: "180px" }}
      >
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              y1={label.y}
              x2={W - PAD_R}
              y2={label.y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={label.y + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.25)"
              fontSize="9"
              fontFamily="monospace"
            >
              {label.value >= 0 ? "+" : ""}${Math.abs(label.value) < 1000 ? label.value.toFixed(0) : `${(label.value / 1000).toFixed(1)}k`}
            </text>
          </g>
        ))}

        {/* Zero line */}
        <line
          x1={PAD_L}
          y1={zeroY}
          x2={W - PAD_R}
          y2={zeroY}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Agent lines */}
        {paths.map((p) => (
          <g key={p.agentId}>
            {/* Glow */}
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
            />
            {/* Main line */}
            <path
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Endpoint dot */}
            <circle cx={p.lastX} cy={p.lastY} r="3.5" fill={p.color} />
            <circle cx={p.lastX} cy={p.lastY} r="6" fill={p.color} opacity="0.2">
              <animate attributeName="r" from="4" to="8" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* Time label */}
        <text
          x={W - PAD_R}
          y={H - 4}
          textAnchor="end"
          fill="rgba(255,255,255,0.2)"
          fontSize="9"
          fontFamily="monospace"
        >
          {elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`} elapsed
        </text>
        <text
          x={PAD_L}
          y={H - 4}
          textAnchor="start"
          fill="rgba(255,255,255,0.2)"
          fontSize="9"
          fontFamily="monospace"
        >
          {history.length} data points
        </text>
      </svg>
    </div>
  );
}
