import { NextResponse } from 'next/server';
import { getHyperliquidClient } from '@/lib/hyperliquid/client';
import { getPaperTradingEngine } from '@/lib/trading/paper-engine';

// Base prices for non-Hyperliquid assets (stocks, commodities, forex)
const EXTRA_BASE_PRICES: Record<string, number> = {
  AAPL: 198.50, TSLA: 247.30, NVDA: 135.80, GOOG: 176.20,
  AMZN: 189.40, META: 512.60, MSFT: 442.10, NFLX: 785.30,
  AMD: 162.40, COIN: 265.80,
  GOLD: 2648.50, SILVER: 31.24, OIL: 71.85,
  EUR: 1.0842, GBP: 1.2715, JPY: 0.00667,
};

function generateMockCandles(basePrice: number, count: number) {
  const candles = [];
  let price = basePrice * (0.97 + Math.random() * 0.03);
  const now = Date.now();
  for (let i = count; i > 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * 0.008 * price;
    const close = price + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.003);
    const low = Math.min(open, close) * (1 - Math.random() * 0.003);
    candles.push({
      time: now - i * 3_600_000,
      open: +open.toPrecision(7),
      high: +high.toPrecision(7),
      low: +low.toPrecision(7),
      close: +close.toPrecision(7),
    });
    price = close;
  }
  return candles;
}

function generateMockOrderbook(price: number) {
  const spread = price * 0.0005;
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: +(price - spread * (i + 1)).toPrecision(7),
    size: +(10 + Math.random() * 50).toFixed(2),
  }));
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: +(price + spread * (i + 1)).toPrecision(7),
    size: +(10 + Math.random() * 50).toFixed(2),
  }));
  return { bids, asks };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }
  const sym = symbol.toUpperCase();

  // Check if this is a non-Hyperliquid asset (stocks/commodities/forex)
  const isExtraAsset = sym in EXTRA_BASE_PRICES;

  try {
    const client = getHyperliquidClient();

    // Fetch candles, orderbook, and current price in parallel
    // For extra assets, skip Hyperliquid calls and use mock data
    const [candles, orderbook, markets] = isExtraAsset
      ? [
          generateMockCandles(EXTRA_BASE_PRICES[sym], 48),
          generateMockOrderbook(EXTRA_BASE_PRICES[sym]),
          [],
        ]
      : await Promise.all([
          client.getCandles(sym, '1h', 48).catch(() => []),
          client.getOrderbook(sym).catch(() => ({ coin: sym, bids: [], asks: [] })),
          client.getMarkets().catch(() => []),
        ]);

    const market = isExtraAsset
      ? {
          price: EXTRA_BASE_PRICES[sym] * (1 + (Math.random() - 0.5) * 0.002),
          volume24h: 1_000_000_000 + Math.random() * 10_000_000_000,
          change24h: (Math.random() - 0.45) * 4,
          funding: 0,
          openInterest: 0,
        }
      : markets.find((m) => m.symbol.toUpperCase() === sym);

    // Get agent activity for this market
    const engine = getPaperTradingEngine();
    const accounts = engine.getAllAccounts();
    const agentActivity: {
      agentId: string;
      name: string;
      positions: { side: string; size: number; entryPrice: number; leverage: number }[];
      recentTrades: { side: string; size: number; price: number; timestamp: string; pnl?: number }[];
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
            timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : String(t.timestamp),
            pnl: t.pnl,
          })),
        });
      }
    }

    return NextResponse.json({
      symbol: sym,
      price: market?.price ?? 0,
      volume24h: market?.volume24h ?? 0,
      change24h: market?.change24h ?? 0,
      funding: market?.funding ?? 0,
      openInterest: market?.openInterest ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candles: candles.map((c: any) => ({
        time: c.timestamp ?? c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
      orderbook: {
        bids: (orderbook.bids ?? []).slice(0, 5),
        asks: (orderbook.asks ?? []).slice(0, 5),
      },
      agentActivity,
    });
  } catch {
    return NextResponse.json({
      symbol: sym, price: 0, volume24h: 0, change24h: 0, funding: 0, openInterest: 0,
      candles: [], orderbook: { bids: [], asks: [] }, agentActivity: [],
    });
  }
}
