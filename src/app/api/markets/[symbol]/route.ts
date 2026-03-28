import { NextResponse } from 'next/server';
import { getHyperliquidClient } from '@/lib/hyperliquid/client';
import { getPaperTradingEngine } from '@/lib/trading/paper-engine';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  try {
    const client = getHyperliquidClient();

    // Fetch candles, orderbook, and current price in parallel
    const [candles, orderbook, markets] = await Promise.all([
      client.getCandles(sym, '1h', 48).catch(() => []),
      client.getOrderbook(sym).catch(() => ({ coin: sym, bids: [], asks: [] })),
      client.getMarkets().catch(() => []),
    ]);

    const market = markets.find(
      (m) => m.symbol.toUpperCase() === sym
    );

    // Get agent activity for this market
    const engine = getPaperTradingEngine();
    const accounts = engine.getAllAccounts();
    const agentActivity: {
      agentId: string;
      name: string;
      positions: { side: string; size: number; entryPrice: number; leverage: number }[];
      recentTrades: { side: string; size: number; price: number; timestamp: Date; pnl?: number }[];
    }[] = [];

    for (const account of accounts) {
      const positions = account.positions.filter(
        (p) => p.symbol.toUpperCase() === sym
      );
      const trades = account.tradeHistory
        .filter((t) => t.symbol.toUpperCase() === sym)
        .slice(-5);

      if (positions.length > 0 || trades.length > 0) {
        agentActivity.push({
          agentId: account.agentId,
          name: account.name,
          positions: positions.map((p) => ({
            side: p.side,
            size: p.size,
            entryPrice: p.entryPrice,
            leverage: p.leverage,
          })),
          recentTrades: trades.map((t) => ({
            side: t.side,
            size: t.size,
            price: t.price,
            timestamp: t.timestamp,
            pnl: t.pnl,
          })),
        });
      }
    }

    return NextResponse.json({
      symbol: sym,
      price: market?.price ?? 0,
      volume24h: market?.volume24h ?? 0,
      candles: candles.map((c) => ({
        time: c.timestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
      orderbook: {
        bids: orderbook.bids.slice(0, 5),
        asks: orderbook.asks.slice(0, 5),
      },
      agentActivity,
    });
  } catch {
    return NextResponse.json(
      { symbol: sym, price: 0, candles: [], orderbook: { bids: [], asks: [] }, agentActivity: [] },
    );
  }
}
