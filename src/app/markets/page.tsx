import Card from "@/components/Card";

const mockMarkets = [
  { symbol: "BTC", price: 87234.5, change: 2.34 },
  { symbol: "ETH", price: 3456.78, change: -1.12 },
  { symbol: "SOL", price: 178.9, change: 5.67 },
  { symbol: "DOGE", price: 0.1823, change: -0.45 },
  { symbol: "ARB", price: 1.23, change: 3.21 },
  { symbol: "AVAX", price: 34.56, change: -2.1 },
  { symbol: "LINK", price: 14.89, change: 1.45 },
  { symbol: "MATIC", price: 0.89, change: -0.32 },
];

export default function MarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="text-sm text-muted mt-1">
          Live prices from Hyperliquid Testnet
        </p>
      </div>

      <Card title="All Markets" subtitle="Click a row to view orderbook">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-xs text-muted/60">
                <th className="pb-3 text-left font-medium">Symbol</th>
                <th className="pb-3 text-right font-medium">Price</th>
                <th className="pb-3 text-right font-medium">24h Change</th>
                <th className="pb-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockMarkets.map((m) => (
                <tr
                  key={m.symbol}
                  className="border-b border-card-border/50 last:border-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <td className="py-3">
                    <span className="font-semibold">{m.symbol}</span>
                    <span className="text-muted ml-1">/ USD</span>
                  </td>
                  <td className="py-3 text-right font-mono">
                    ${m.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-3 text-right font-mono ${m.change >= 0 ? "text-profit" : "text-loss"}`}>
                    {m.change >= 0 ? "+" : ""}{m.change.toFixed(2)}%
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-accent hover:text-accent/80 font-medium">
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
