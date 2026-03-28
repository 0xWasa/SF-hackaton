export interface PaperAccount {
  agentId: string;
  name: string;
  walletAddress: string;
  createdAt: Date;
  initialBalance: number;
  balance: number;
  positions: PaperPosition[];
  tradeHistory: PaperTrade[];
  strategy?: string;
  strategyConfig?: StrategyConfig;
  copyingFrom?: string;
}

export interface StrategyConfig {
  focus: 'crypto' | 'all_assets';
  style: 'conservative' | 'momentum' | 'degen' | 'arbitrage' | 'custom';
  leverage: number;
  strategyDescription?: string;
}

export interface PaperPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  openedAt: Date;
  unrealizedPnl?: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  leverage: number;
  pnl?: number;
  timestamp: Date;
  agentId: string;
}

export interface PaperPortfolio {
  agentId: string;
  name: string;
  walletAddress: string;
  strategy?: string;
  balance: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: PaperPosition[];
  recentTrades: PaperTrade[];
  winRate: number;
  totalTrades: number;
}

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  name: string;
  strategy: string;
  totalValue: number;
  pnl: number;
  pnlPercent: number;
  winRate: number;
  totalTrades: number;
}

export interface TradeResult {
  success: boolean;
  trade?: PaperTrade;
  error?: string;
  note?: string;
}

export interface ExecuteTradeParams {
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  leverage?: number;
  type: 'market' | 'limit';
  price?: number;
}
