"use client";

import Link from "next/link";

interface AgentCardProps {
  agentId: string;
  name: string;
  emoji: string;
  strategy: string;
  isRunning: boolean;
  pnl?: number;
  totalTrades?: number;
  winRate?: number;
  recentPnls?: number[]; // for sparkline
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "var(--profit)" : "var(--loss)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AgentCard({
  agentId,
  name,
  emoji,
  strategy,
  isRunning,
  pnl = 0,
  totalTrades = 0,
  winRate = 0,
  recentPnls = [],
}: AgentCardProps) {
  // Mood based on P&L
  const mood = pnl > 50 ? "Feeling great" : pnl > 0 ? "Cautiously optimistic" : pnl > -50 ? "Staying focused" : "Regrouping";

  return (
    <Link href={`/agent/${agentId}`}>
      <div className="rounded-xl border border-card-border bg-card p-4 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold truncate">{name}</h3>
              {isRunning && (
                <span className="w-2 h-2 rounded-full bg-profit animate-pulse shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{strategy}</p>
            <p className="text-xs text-muted/40 mt-1 italic">{mood}</p>
          </div>
          <MiniSparkline data={recentPnls} />
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-card-border/30">
          <div>
            <p className="text-xs text-muted">P&L</p>
            <p className={`text-sm font-mono font-semibold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Win Rate</p>
            <p className="text-sm font-mono">{winRate.toFixed(0)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted">Trades</p>
            <p className="text-sm font-mono">{totalTrades}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
