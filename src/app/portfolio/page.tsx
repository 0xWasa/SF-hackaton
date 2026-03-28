import Card from "@/components/Card";

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-sm text-muted mt-1">
          Account balances and position details
        </p>
      </div>

      {/* Balance overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Account Value">
          <p className="text-2xl font-semibold font-mono">$10,000.00</p>
        </Card>
        <Card title="Margin Used">
          <p className="text-2xl font-semibold font-mono">$0.00</p>
          <p className="text-sm text-muted mt-1">0% utilized</p>
        </Card>
        <Card title="Unrealized P&L">
          <p className="text-2xl font-semibold font-mono text-muted">$0.00</p>
        </Card>
      </div>

      {/* Positions */}
      <Card title="Open Positions" subtitle="Currently held positions">
        <div className="flex items-center justify-center py-16 text-sm text-muted/40">
          <div className="text-center">
            <span className="text-5xl block mb-3">🦞</span>
            <p>No open positions</p>
            <p className="text-xs mt-1">Start the trading agent to open positions</p>
          </div>
        </div>
      </Card>

      {/* Trade History */}
      <Card title="Trade History" subtitle="Recent fills and executions">
        <div className="flex items-center justify-center py-12 text-sm text-muted/40">
          No trades yet
        </div>
      </Card>
    </div>
  );
}
