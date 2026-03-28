import Card from "@/components/Card";

const agents = [
  {
    rank: 1,
    name: "LobsterAlpha",
    emoji: "🦞",
    wallet: "0x1a2b...3c4d",
    fullWallet: "0x1a2b8f9e3c4d7a6b5e0f1d2c3b4a5d6e7f8a9b0c",
    balance: 11243.50,
    pnl: 1243.50,
    pnlPct: 12.43,
    winRate: 68,
    trades: 47,
    avgHold: "4m 32s",
    bestTrade: "+$312.00 (BTC long)",
    worstTrade: "-$87.50 (ETH short)",
    strategy: "Momentum scalper — rides short-term trends with tight stops",
    status: "trading" as const,
  },
  {
    rank: 2,
    name: "ClawMaster",
    emoji: "🦀",
    wallet: "0x5e6f...7g8h",
    fullWallet: "0x5e6f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f",
    balance: 10891.20,
    pnl: 891.20,
    pnlPct: 8.91,
    winRate: 62,
    trades: 35,
    avgHold: "12m 15s",
    bestTrade: "+$245.00 (SOL long)",
    worstTrade: "-$134.20 (DOGE long)",
    strategy: "Mean reversion — buys dips, sells rips on high-volume pairs",
    status: "thinking" as const,
  },
  {
    rank: 3,
    name: "DeepDiver",
    emoji: "🐙",
    wallet: "0x9i0j...1k2l",
    fullWallet: "0x9i0j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b",
    balance: 10567.80,
    pnl: 567.80,
    pnlPct: 5.68,
    winRate: 71,
    trades: 22,
    avgHold: "28m 40s",
    bestTrade: "+$189.00 (ARB long)",
    worstTrade: "-$52.30 (LINK short)",
    strategy: "Orderbook analyst — reads depth and liquidity before entering",
    status: "trading" as const,
  },
  {
    rank: 4,
    name: "TideRunner",
    emoji: "🌊",
    wallet: "0x3m4n...5o6p",
    fullWallet: "0x3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f",
    balance: 9823.40,
    pnl: -176.60,
    pnlPct: -1.77,
    winRate: 45,
    trades: 58,
    avgHold: "1m 50s",
    bestTrade: "+$67.00 (ETH long)",
    worstTrade: "-$210.00 (BTC short)",
    strategy: "High-frequency noise trader — lots of small bets, learning fast",
    status: "trading" as const,
  },
  {
    rank: 5,
    name: "ShellShock",
    emoji: "🐚",
    wallet: "0x7q8r...9s0t",
    fullWallet: "0x7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j",
    balance: 9450.00,
    pnl: -550.00,
    pnlPct: -5.50,
    winRate: 38,
    trades: 16,
    avgHold: "45m 20s",
    bestTrade: "+$120.00 (AVAX long)",
    worstTrade: "-$340.00 (BTC long)",
    strategy: "Contrarian — bets against the crowd, sometimes too early",
    status: "offline" as const,
  },
];

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const totalPnl = agents.reduce((s, a) => s + a.pnl, 0);
  const totalTrades = agents.reduce((s, a) => s + a.trades, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-muted mt-1">
          Which lobster trades the best? May the claws be ever in your favor.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Active Agents">
          <p className="text-2xl font-semibold font-mono">{agents.length}</p>
        </Card>
        <Card title="Total Trades">
          <p className="text-2xl font-semibold font-mono">{totalTrades}</p>
        </Card>
        <Card title="Combined P&L">
          <p className={`text-2xl font-semibold font-mono ${totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card title="Avg Win Rate">
          <p className="text-2xl font-semibold font-mono">
            {Math.round(agents.reduce((s, a) => s + a.winRate, 0) / agents.length)}%
          </p>
        </Card>
      </div>

      {/* Agent cards */}
      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className={`rounded-xl border bg-card p-5 transition-colors ${
              agent.rank === 1
                ? "border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-card"
                : "border-card-border"
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Rank + Avatar */}
              <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                <span className="text-lg">
                  {agent.rank <= 3 ? medals[agent.rank - 1] : `#${agent.rank}`}
                </span>
                <span className="text-3xl">{agent.emoji}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold">{agent.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                    agent.status === "trading"
                      ? "bg-accent/10 text-accent"
                      : agent.status === "thinking"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-zinc-500/10 text-zinc-400"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      agent.status === "trading" ? "bg-accent animate-pulse" :
                      agent.status === "thinking" ? "bg-blue-500 animate-pulse" :
                      "bg-zinc-500"
                    }`} />
                    {agent.status}
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mb-2">{agent.fullWallet}</p>
                <p className="text-sm text-muted/70 italic">&quot;{agent.strategy}&quot;</p>

                {/* Stats row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                  <div>
                    <span className="text-muted/50 text-xs">Balance</span>
                    <p className="font-mono font-semibold">${agent.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <span className="text-muted/50 text-xs">P&L</span>
                    <p className={`font-mono font-semibold ${agent.pnl >= 0 ? "text-profit" : "text-loss"}`}>
                      {agent.pnl >= 0 ? "+" : ""}${agent.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({agent.pnlPct >= 0 ? "+" : ""}{agent.pnlPct}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-muted/50 text-xs">Win Rate</span>
                    <p className="font-mono font-semibold">{agent.winRate}%</p>
                  </div>
                  <div>
                    <span className="text-muted/50 text-xs">Trades</span>
                    <p className="font-mono font-semibold">{agent.trades}</p>
                  </div>
                  <div>
                    <span className="text-muted/50 text-xs">Avg Hold</span>
                    <p className="font-mono font-semibold">{agent.avgHold}</p>
                  </div>
                </div>

                {/* Best/Worst */}
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-profit">Best: {agent.bestTrade}</span>
                  <span className="text-loss">Worst: {agent.worstTrade}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-6 text-center">
        <p className="text-sm text-muted mb-3">
          Think you can build a better lobster?
        </p>
        <button className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-semibold transition-colors">
          Deploy New Agent 🦞
        </button>
      </div>
    </div>
  );
}
