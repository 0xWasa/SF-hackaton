import { NextResponse } from 'next/server';
import { getHyperliquidClient } from '@/lib/hyperliquid/client';

// Mock fallback for demo resilience
const MOCK_MARKETS = [
  { symbol: 'BTC', price: 109432.50, volume24h: 0 },
  { symbol: 'ETH', price: 2534.80, volume24h: 0 },
  { symbol: 'SOL', price: 178.45, volume24h: 0 },
  { symbol: 'DOGE', price: 0.1823, volume24h: 0 },
  { symbol: 'ARB', price: 1.12, volume24h: 0 },
  { symbol: 'AVAX', price: 38.90, volume24h: 0 },
  { symbol: 'LINK', price: 16.45, volume24h: 0 },
  { symbol: 'MATIC', price: 0.72, volume24h: 0 },
];

let cachedMarkets: { data: any[]; timestamp: number } | null = null;

export async function GET() {
  try {
    const client = getHyperliquidClient();
    const markets = await client.getMarkets();

    // Filter to markets with prices, sort by price desc
    const filtered = markets
      .filter((m) => m.price > 0)
      .sort((a, b) => b.price - a.price);

    cachedMarkets = { data: filtered, timestamp: Date.now() };

    return NextResponse.json({ markets: filtered });
  } catch (error) {
    // Fallback: cached or mock
    if (cachedMarkets && Date.now() - cachedMarkets.timestamp < 60_000) {
      return NextResponse.json({ markets: cachedMarkets.data, cached: true });
    }
    return NextResponse.json({ markets: MOCK_MARKETS, mock: true });
  }
}
