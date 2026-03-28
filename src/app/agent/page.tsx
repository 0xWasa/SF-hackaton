import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agent Log</h1>
          <p className="text-sm text-muted mt-1">
            Watch the lobster think and trade in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status="offline" label="Agent stopped" />
          <button className="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-medium transition-colors">
            Start Agent
          </button>
        </div>
      </div>

      {/* Agent config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Trading Interval">
          <p className="text-xl font-semibold font-mono">30s</p>
          <p className="text-xs text-muted mt-1">Time between decisions</p>
        </Card>
        <Card title="Max Position Size">
          <p className="text-xl font-semibold font-mono">10%</p>
          <p className="text-xs text-muted mt-1">Of total balance per trade</p>
        </Card>
        <Card title="Total Decisions">
          <p className="text-xl font-semibold font-mono">0</p>
          <p className="text-xs text-muted mt-1">Since last start</p>
        </Card>
      </div>

      {/* Activity log */}
      <Card title="Activity Feed" subtitle="Real-time agent reasoning and actions">
        <div className="flex items-center justify-center py-20 text-sm text-muted/40">
          <div className="text-center max-w-sm">
            <span className="text-6xl block mb-4">🦞</span>
            <p className="text-base font-medium text-muted/60 mb-2">
              The lobster is sleeping
            </p>
            <p className="text-xs leading-relaxed">
              Press &quot;Start Agent&quot; to wake the lobster. It will analyze markets,
              make trading decisions, and log its reasoning here in real-time.
            </p>
          </div>
        </div>
      </Card>

      {/* Example of what a log entry will look like */}
      <Card title="Log Entry Preview" subtitle="This is what agent activity looks like">
        <div className="space-y-3">
          <div className="rounded-lg border border-card-border/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted font-mono">12:31:05 PM</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                TRADE
              </span>
            </div>
            <p className="text-sm text-foreground/80 mb-2">
              <strong>Observation:</strong> BTC showing bullish momentum, price up 2.3% in last hour. Orderbook depth is strong on bid side.
            </p>
            <p className="text-sm text-foreground/80 mb-2">
              <strong>Reasoning:</strong> Short-term momentum play. RSI not overbought. Setting tight stop-loss at 1% below entry.
            </p>
            <p className="text-sm text-profit">
              <strong>Action:</strong> BUY 0.01 BTC @ $87,234 (market order)
            </p>
          </div>

          <div className="rounded-lg border border-card-border/50 p-4 opacity-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted font-mono">12:30:35 PM</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 font-medium">
                HOLD
              </span>
            </div>
            <p className="text-sm text-foreground/80 mb-2">
              <strong>Observation:</strong> Market is ranging. No clear directional signal.
            </p>
            <p className="text-sm text-foreground/80">
              <strong>Reasoning:</strong> Waiting for stronger signal before committing capital.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
