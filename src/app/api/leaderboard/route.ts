import { NextResponse } from 'next/server';
import { getPaperTradingEngine } from '@/lib/trading/paper-engine';

export async function GET() {
  try {
    const engine = getPaperTradingEngine();
    const leaderboard = await engine.getLeaderboard();

    return NextResponse.json({ leaderboard });
  } catch {
    return NextResponse.json({ leaderboard: [] });
  }
}
