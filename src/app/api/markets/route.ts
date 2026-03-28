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

function getMockMarkets() {
  return Object.entries(MOCK_BASE_PRICES).map(([symbol, basePrice]) => {
    // Random walk: -0.3% to +0.3% per tick
    const jitter = 1 + (Math.random() - 0.5) * 0.006;
    const price = +(basePrice * jitter).toPrecision(6);
    const change24h = (Math.random() - 0.45) * 8; // -3.6% to +4.4%
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

    cachedMarkets = { data: filtered, timestamp: Date.now() };

    return NextResponse.json({ markets: filtered });
  } catch {
    // Fallback: cached (up to 2 minutes) or mock with jitter
    if (cachedMarkets && Date.now() - cachedMarkets.timestamp < 120_000) {
      return NextResponse.json({ markets: cachedMarkets.data, cached: true });
    }
    return NextResponse.json({ markets: getMockMarkets(), mock: true });
  }
}
