import { getHyperliquidClient } from '@/lib/hyperliquid/client';
import type {
  PaperAccount,
  PaperPosition,
  PaperTrade,
  PaperPortfolio,
  LeaderboardEntry,
  TradeResult,
  ExecuteTradeParams,
  StrategyConfig,
} from '@/types/paper-trading';
import type { Market } from '@/types/trading';

export class PaperTradingEngine {
  private accounts: Map<string, PaperAccount> = new Map();
  private locks: Map<string, Promise<void>> = new Map();

  /** Simple per-account mutex: serializes async operations on the same account */
  private async withAccountLock<T>(agentId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(agentId) ?? Promise.resolve();
    let release: () => void;
    const next = new Promise<void>((resolve) => { release = resolve; });
    this.locks.set(agentId, next);
    await prev;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  // --- Account management ---

  private generateWalletAddress(): string {
    const hex = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += hex[Math.floor(Math.random() * 16)];
    }
    return addr;
  }

  createAccount(
    agentId: string,
    name: string,
    strategy?: string,
    initialBalance: number = 10_000
  ): PaperAccount {
    if (this.accounts.has(agentId)) {
      return this.accounts.get(agentId)!;
    }

    const account: PaperAccount = {
      agentId,
      name,
      walletAddress: this.generateWalletAddress(),
      createdAt: new Date(),
      initialBalance,
      balance: initialBalance,
      positions: [],
      tradeHistory: [],
      strategy,
    };

    this.accounts.set(agentId, account);
    return account;
  }

  configureStrategy(agentId: string, config: StrategyConfig): PaperAccount | null {
    const account = this.accounts.get(agentId);
    if (!account) return null;
    account.strategyConfig = config;
    if (config.strategyDescription) {
      account.strategy = config.strategyDescription;
    } else {
      account.strategy = `${config.style} — ${config.focus} — ${config.leverage}x`;
    }
    return account;
  }

  getAccount(agentId: string): PaperAccount | undefined {
    return this.accounts.get(agentId);
  }

  getAllAccounts(): PaperAccount[] {
    return Array.from(this.accounts.values());
  }

  // --- Price helpers ---

  private async fetchMidPrice(symbol: string): Promise<number> {
    const markets: Market[] = await getHyperliquidClient().getMarkets();
    const market = markets.find(
      (m) => m.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!market || market.price === 0) {
      throw new Error(`No price available for ${symbol}`);
    }
    return market.price;
  }

  // --- Core trading ---

  async executeTrade(
    agentId: string,
    params: ExecuteTradeParams
  ): Promise<TradeResult> {
    return this.withAccountLock(agentId, () => this._executeTrade(agentId, params));
  }

  private async _executeTrade(
    agentId: string,
    params: ExecuteTradeParams
  ): Promise<TradeResult> {
    const account = this.accounts.get(agentId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const leverage = params.leverage ?? 1;
    let sizeAdjustedNote: string | undefined;

    // Determine execution price
    let execPrice: number;
    try {
      const midPrice = await this.fetchMidPrice(params.symbol);

      if (params.type === 'market') {
        execPrice = midPrice;
      } else {
        // Limit order validation
        if (!params.price) {
          return { success: false, error: 'Limit orders require a price' };
        }
        // Buy limit must be at or below mid; sell limit must be at or above mid
        if (params.side === 'buy' && params.price > midPrice) {
          return {
            success: false,
            error: `Buy limit price ${params.price} is above mid price ${midPrice}. Order would not fill.`,
          };
        }
        if (params.side === 'sell' && params.price < midPrice) {
          return {
            success: false,
            error: `Sell limit price ${params.price} is below mid price ${midPrice}. Order would not fill.`,
          };
        }
        execPrice = params.price;
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch price',
      };
    }

    // Validate execution price
    if (!execPrice || execPrice <= 0) {
      return {
        success: false,
        error: `Invalid execution price for ${params.symbol}: ${execPrice}. Market data may be unavailable.`,
      };
    }

    // Check for existing position in same symbol
    const existingPosition = account.positions.find(
      (p) => p.symbol.toUpperCase() === params.symbol.toUpperCase()
    );

    const isClosing =
      existingPosition &&
      ((existingPosition.side === 'long' && params.side === 'sell') ||
        (existingPosition.side === 'short' && params.side === 'buy'));

    let pnl: number | undefined;

    if (isClosing && existingPosition) {
      // Closing (or reducing) existing position
      const closeSize = Math.min(params.size, existingPosition.size);

      if (existingPosition.side === 'long') {
        pnl =
          (execPrice - existingPosition.entryPrice) *
          closeSize *
          existingPosition.leverage;
      } else {
        pnl =
          (existingPosition.entryPrice - execPrice) *
          closeSize *
          existingPosition.leverage;
      }

      account.balance += pnl;

      if (closeSize >= existingPosition.size) {
        // Fully closed
        account.positions = account.positions.filter(
          (p) => p.symbol.toUpperCase() !== params.symbol.toUpperCase()
        );
      } else {
        // Partially closed
        existingPosition.size -= closeSize;
      }
    } else if (
      existingPosition &&
      ((existingPosition.side === 'long' && params.side === 'buy') ||
        (existingPosition.side === 'short' && params.side === 'sell'))
    ) {
      // Adding to existing position — average entry price
      let tradeSize = params.size;
      let margin = (tradeSize * execPrice) / leverage;
      if (margin > account.balance) {
        // Auto-adjust size down to max affordable
        const maxMargin = account.balance * 0.95; // Keep 5% buffer
        if (maxMargin <= 0) {
          return { success: false, error: 'Insufficient balance — no margin available' };
        }
        const originalSize = tradeSize;
        tradeSize = (maxMargin * leverage) / execPrice;
        tradeSize = Math.max(0.001, tradeSize);
        margin = (tradeSize * execPrice) / leverage;
        params.size = tradeSize;
        sizeAdjustedNote = `Size adjusted from ${originalSize.toFixed(6)} to ${tradeSize.toFixed(6)} to fit available margin ($${account.balance.toFixed(2)})`;
        console.log(`[PaperEngine] ${sizeAdjustedNote}`);
      }
      account.balance -= margin;

      const totalSize = existingPosition.size + params.size;
      existingPosition.entryPrice =
        (existingPosition.entryPrice * existingPosition.size +
          execPrice * params.size) /
        totalSize;
      existingPosition.size = totalSize;
    } else {
      // Opening new position
      let tradeSize = params.size;
      let margin = (tradeSize * execPrice) / leverage;
      if (margin > account.balance) {
        // Auto-adjust size down to max affordable
        const maxMargin = account.balance * 0.95; // Keep 5% buffer
        if (maxMargin <= 0) {
          return { success: false, error: 'Insufficient balance — no margin available' };
        }
        const originalSize = tradeSize;
        tradeSize = (maxMargin * leverage) / execPrice;
        tradeSize = Math.max(0.001, tradeSize);
        margin = (tradeSize * execPrice) / leverage;
        params.size = tradeSize;
        sizeAdjustedNote = `Size adjusted from ${originalSize.toFixed(6)} to ${tradeSize.toFixed(6)} to fit available margin ($${account.balance.toFixed(2)})`;
        console.log(`[PaperEngine] ${sizeAdjustedNote}`);
      }
      account.balance -= margin;

      const position: PaperPosition = {
        symbol: params.symbol.toUpperCase(),
        side: params.side === 'buy' ? 'long' : 'short',
        size: params.size,
        entryPrice: execPrice,
        leverage,
        openedAt: new Date(),
      };
      account.positions.push(position);
    }

    // Record the trade
    const trade: PaperTrade = {
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: params.symbol.toUpperCase(),
      side: params.side,
      size: params.size,
      price: execPrice,
      leverage,
      pnl,
      timestamp: new Date(),
      agentId,
    };
    account.tradeHistory.push(trade);

    // Mirror trade to copiers
    await this.mirrorTradeToCopiers(agentId, params);

    return { success: true, trade, note: sizeAdjustedNote };
  }

  async closePosition(
    agentId: string,
    symbol: string
  ): Promise<TradeResult> {
    return this.withAccountLock(agentId, () => this._closePosition(agentId, symbol));
  }

  private async _closePosition(
    agentId: string,
    symbol: string
  ): Promise<TradeResult> {
    const account = this.accounts.get(agentId);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    const position = account.positions.find(
      (p) => p.symbol.toUpperCase() === symbol.toUpperCase()
    );
    if (!position) {
      return { success: false, error: `No open position for ${symbol}` };
    }

    let currentPrice: number;
    try {
      currentPrice = await this.fetchMidPrice(symbol);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to fetch price',
      };
    }

    // Calculate P&L
    let pnl: number;
    if (position.side === 'long') {
      pnl =
        (currentPrice - position.entryPrice) *
        position.size *
        position.leverage;
    } else {
      pnl =
        (position.entryPrice - currentPrice) *
        position.size *
        position.leverage;
    }

    // Credit balance: return margin + pnl
    const margin = (position.size * position.entryPrice) / position.leverage;
    account.balance += margin + pnl;

    // Remove position
    account.positions = account.positions.filter(
      (p) => p.symbol.toUpperCase() !== symbol.toUpperCase()
    );

    // Record closing trade
    const closeSide = position.side === 'long' ? 'sell' : 'buy';
    const trade: PaperTrade = {
      id: `${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      symbol: symbol.toUpperCase(),
      side: closeSide,
      size: position.size,
      price: currentPrice,
      leverage: position.leverage,
      pnl,
      timestamp: new Date(),
      agentId,
    };
    account.tradeHistory.push(trade);

    return { success: true, trade };
  }

  // --- Portfolio & leaderboard ---

  async getPortfolio(agentId: string): Promise<PaperPortfolio | null> {
    const account = this.accounts.get(agentId);
    if (!account) return null;

    // Fetch current prices for unrealized P&L
    let markets: Market[] = [];
    try {
      markets = await getHyperliquidClient().getMarkets();
    } catch {
      // If price fetch fails, unrealized P&L stays undefined
    }

    const priceMap = new Map<string, number>();
    for (const m of markets) {
      priceMap.set(m.symbol.toUpperCase(), m.price);
    }

    let totalUnrealizedPnl = 0;
    for (const pos of account.positions) {
      const currentPrice = priceMap.get(pos.symbol.toUpperCase());
      if (currentPrice) {
        if (pos.side === 'long') {
          pos.unrealizedPnl =
            (currentPrice - pos.entryPrice) * pos.size * pos.leverage;
        } else {
          pos.unrealizedPnl =
            (pos.entryPrice - currentPrice) * pos.size * pos.leverage;
        }
        totalUnrealizedPnl += pos.unrealizedPnl;
      }
    }

    const totalValue = account.balance + totalUnrealizedPnl;
    const totalPnl = totalValue - account.initialBalance;
    const totalPnlPercent =
      account.initialBalance > 0
        ? (totalPnl / account.initialBalance) * 100
        : 0;

    const tradesWithPnl = account.tradeHistory.filter(
      (t) => t.pnl !== undefined
    );
    const wins = tradesWithPnl.filter((t) => t.pnl! > 0).length;
    const winRate =
      tradesWithPnl.length > 0 ? (wins / tradesWithPnl.length) * 100 : 0;

    return {
      agentId: account.agentId,
      name: account.name,
      walletAddress: account.walletAddress,
      strategy: account.strategy,
      balance: account.balance,
      totalValue,
      totalPnl,
      totalPnlPercent,
      positions: account.positions,
      recentTrades: account.tradeHistory.slice(-20),
      winRate,
      totalTrades: account.tradeHistory.length,
    };
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const portfolios: PaperPortfolio[] = [];

    for (const account of this.accounts.values()) {
      const portfolio = await this.getPortfolio(account.agentId);
      if (portfolio) portfolios.push(portfolio);
    }

    portfolios.sort((a, b) => b.totalPnl - a.totalPnl);

    return portfolios.map((p, index) => ({
      rank: index + 1,
      agentId: p.agentId,
      name: p.name,
      strategy: p.strategy || 'unknown',
      totalValue: p.totalValue,
      pnl: p.totalPnl,
      pnlPercent: p.totalPnlPercent,
      winRate: p.winRate,
      totalTrades: p.totalTrades,
    }));
  }

  // --- Copy trading ---

  addCopier(copierAgentId: string, sourceAgentId: string): boolean {
    const copier = this.accounts.get(copierAgentId);
    const source = this.accounts.get(sourceAgentId);
    if (!copier || !source) return false;

    copier.copyingFrom = sourceAgentId;
    return true;
  }

  private async mirrorTradeToCopiers(
    sourceAgentId: string,
    params: ExecuteTradeParams
  ): Promise<void> {
    for (const account of this.accounts.values()) {
      if (account.copyingFrom === sourceAgentId) {
        // Scale the trade size proportionally to the copier's balance vs source balance
        const source = this.accounts.get(sourceAgentId);
        if (!source) continue;

        const sourceTotal = source.balance + source.initialBalance;
        const copierTotal = account.balance + account.initialBalance;
        const scale = sourceTotal > 0 ? copierTotal / sourceTotal : 1;

        const copierParams: ExecuteTradeParams = {
          ...params,
          size: Math.max(0.001, params.size * scale),
        };

        // Execute silently — don't let copier failures break the source trade
        try {
          await this.executeTrade(account.agentId, copierParams);
        } catch {
          // Copier trade failed — that's fine
        }
      }
    }
  }
}

// Singleton
let engine: PaperTradingEngine | null = null;

export function getPaperTradingEngine(): PaperTradingEngine {
  if (!engine) {
    engine = new PaperTradingEngine();
  }
  return engine;
}
