import { NextResponse } from 'next/server';
import { getPaperTradingEngine } from '@/lib/trading/paper-engine';

export async function GET() {
  try {
    const engine = getPaperTradingEngine();
    const accounts = engine.getAllAccounts();

    const portfolios = [];
    for (const account of accounts) {
      try {
        const portfolio = await engine.getPortfolio(account.agentId);
        if (portfolio) portfolios.push(portfolio);
      } catch {
        // Skip failed portfolio fetch — don't crash the whole route
      }
    }

    const totalValue = portfolios.reduce((s, p) => s + p.totalValue, 0);
    const totalPnl = portfolios.reduce((s, p) => s + p.totalPnl, 0);
    const totalTrades = portfolios.reduce((s, p) => s + p.totalTrades, 0);

    return NextResponse.json({
      portfolios,
      summary: {
        totalAgents: accounts.length,
        totalValue,
        totalPnl,
        totalTrades,
      },
    });
  } catch {
    return NextResponse.json({
      portfolios: [],
      summary: { totalAgents: 0, totalValue: 0, totalPnl: 0, totalTrades: 0 },
    });
  }
}
