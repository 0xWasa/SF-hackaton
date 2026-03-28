import { NextResponse } from 'next/server';
import { getHyperliquidClient } from '@/lib/hyperliquid/client';

// Mock fallback with realistic prices + random micro-movements
const MOCK_BASE_PRICES: Record<string, number> = {
  BTC: 109432.50, ETH: 2534.80, SOL: 178.45, DOGE: 0.1823,
  ARB: 1.12, AVAX: 38.90, LINK: 16.45, MATIC: 0.72,
  XRP: 2.34, ADA: 0.68, DOT: 7.23, ATOM: 9.87,
  OP: 2.15, SUI: 3.42, APT: 12.56, NEAR: 5.78,
  FIL: 4.52, UNI: 11.34, AAVE: 234.56, INJ: 23.45,
};

// Stocks, commodities, and forex — realistic base prices for demo
// HIP-3 perps aren't live yet on Hyperliquid, so we generate these with
// small random movements to make the tabs populated and demo-ready
const EXTRA_ASSET_PRICES: Record<string, number> = {
  // Stocks (HIP-3 perps — coming soon on Hyperliquid)
  AAPL: 198.50, TSLA: 247.30, NVDA: 135.80, GOOG: 176.20,
  AMZN: 189.40, META: 512.60, MSFT: 442.10, NFLX: 785.30,
  AMD: 162.40, COIN: 265.80,
  // Commodities
  GOLD: 2648.50, SILVER: 31.24, OIL: 71.85,
  // Forex
  EUR: 1.0842, GBP: 1.2715, JPY: 0.00667,
};

// Persist small random walks so prices feel alive across refreshes
let extraPriceState: Record<string, number> | null = null;

function getExtraAssetMarkets() {
  if (!extraPriceState) {
    extraPriceState = { ...EXTRA_ASSET_PRICES };
  }
  return Object.entries(extraPriceState).map(([symbol, currentPrice]) => {
    // Small random walk: -0.15% to +0.15% per tick
    const jitter = 1 + (Math.random() - 0.5) * 0.003;
    const price = +(currentPrice * jitter).toPrecision(7);
    extraPriceState![symbol] = price;
    const change24h = (Math.random() - 0.45) * 4; // -1.8% to +2.2%
    const volume24h = symbol === 'GOLD' ? 180_000_000_000 :
      symbol === 'OIL' ? 95_000_000_000 :
      symbol === 'SILVER' ? 28_000_000_000 :
      ['EUR', 'GBP', 'JPY'].includes(symbol) ? 50_000_000_000 + Math.random() * 100_000_000_000 :
      Math.round(1_000_000_000 + Math.random() * 20_000_000_000);
    return { symbol, price, volume24h, change24h };
  });
}

function getMockMarkets() {
  return Object.entries(MOCK_BASE_PRICES).map(([symbol, basePrice]) => {
    const jitter = 1 + (Math.random() - 0.5) * 0.006;
    const price = +(basePrice * jitter).toPrecision(6);
    const change24h = (Math.random() - 0.45) * 8;
    return { symbol, price, volume24h: Math.round(Math.random() * 500_000_000), change24h };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedMarkets: { data: any[]; timestamp: number } | null = null;

export async function GET() {
  try {
    const client = getHyperliquidClient();
    const markets = await client.getMarkets();

    const filtered = markets
      .filter((m) => m.price > 0)
      .sort((a, b) => b.price - a.price);

    // Append stock/commodity/forex data (not on Hyperliquid yet)
    const extras = getExtraAssetMarkets();
    const combined = [...filtered, ...extras];

    cachedMarkets = { data: combined, timestamp: Date.now() };

    return NextResponse.json({ markets: combined });
  } catch {
    if (cachedMarkets && Date.now() - cachedMarkets.timestamp < 120_000) {
      return NextResponse.json({ markets: cachedMarkets.data, cached: true });
    }
    const mocked = [...getMockMarkets(), ...getExtraAssetMarkets()];
    return NextResponse.json({ markets: mocked, mock: true });
  }
}
