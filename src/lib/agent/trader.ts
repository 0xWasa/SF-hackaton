import OpenAI from 'openai';
import { getHyperliquidClient } from '../hyperliquid/client';
import { getSystemPrompt } from './prompts';
import { getPaperTradingEngine } from '../trading/paper-engine';
import type { AgentConfig, AgentLog, AgentAction, AgentStatus } from '@/types/agent';

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'place_trade',
      description: 'Place a new trade / open a position. IMPORTANT: size is in BASE ASSET UNITS, not USD. For example, BTC at $109,000 means size=0.01 is a $1,090 position. Always check your balance first: margin_needed = size * price / leverage. If size is too large, it will be auto-adjusted down.',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading pair symbol, e.g. BTC, ETH, SOL, AAPL, TSLA, GOLD' },
          side: { type: 'string', enum: ['buy', 'sell'], description: 'Trade direction' },
          size: { type: 'number', description: 'Size in base asset units (e.g. 0.01 BTC, 1.5 ETH). margin = size * price / leverage. Must fit within your balance.' },
          leverage: { type: 'number', description: 'Leverage multiplier (1-10)' },
          type: { type: 'string', enum: ['market', 'limit'], description: 'Order type' },
          price: { type: 'number', description: 'Limit price (required for limit orders)' },
        },
        required: ['symbol', 'side', 'size', 'leverage', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'close_position',
      description: 'Close an existing open position',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Symbol of the position to close' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'hold',
      description: 'Skip this step. ONLY use this if you already have 2+ open positions and see no good opportunities. Prefer trading over holding.',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'Why you are holding' },
        },
        required: ['reason'],
      },
    },
  },
];

export class TradingAgent {
  private config: AgentConfig;
  private openai: OpenAI;
  private logs: AgentLog[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private stepping = false; // guard against overlapping steps
  private totalSteps = 0;
  private lastStep?: Date;

  constructor(config: AgentConfig) {
    this.config = config;
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    // Run first step immediately
    this.step().catch((err) => console.error(`[${this.config.name}] step error:`, err));

    this.intervalId = setInterval(() => {
      this.step().catch((err) => console.error(`[${this.config.name}] step error:`, err));
    }, this.config.interval);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async step(): Promise<void> {
    if (!this.running) return;
    if (this.stepping) {
      console.log(`[${this.config.name}] Skipping step — previous step still running`);
      return;
    }
    this.stepping = true;

    const actions: AgentAction[] = [];
    let observation = '';
    let reasoning = '';
    let portfolioValue = 0;

    try { // outer try/finally for stepping guard
    try {
      // --- OBSERVE ---
      const client = getHyperliquidClient();
      const paper = getPaperTradingEngine();

      const markets = await client.getMarkets();
      const account = paper.getAccount(this.config.agentId);
      if (!account) {
        throw new Error(`No paper trading account for agent ${this.config.agentId}`);
      }

      // Inject stock/commodity/forex prices so agents can see ALL asset classes
      // (Hyperliquid API only returns crypto; extra assets use mock prices from the paper engine)
      const EXTRA_ASSET_PRICES: Record<string, number> = {
        AAPL: 198.50, TSLA: 247.30, NVDA: 135.80, GOOG: 176.20,
        AMZN: 189.40, META: 512.60, MSFT: 442.10, NFLX: 785.30,
        AMD: 162.40, COIN: 265.80, GME: 28.40, AMC: 4.85,
        HOOD: 24.60, RIVN: 13.20, PLTR: 24.80, DKNG: 38.50,
        GOLD: 2648.50, SILVER: 31.24, OIL: 71.85,
        EUR: 1.0842, GBP: 1.2715, JPY: 0.00667,
      };
      const existingSymbols = new Set(markets.map((m) => m.symbol));
      const extraMarkets = Object.entries(EXTRA_ASSET_PRICES)
        .filter(([sym]) => !existingSymbols.has(sym))
        .map(([symbol, basePrice]) => {
          const jitter = 1 + (Math.random() - 0.5) * 0.004;
          const price = +(basePrice * jitter).toPrecision(7);
          const change24h = (Math.random() - 0.45) * 4;
          const volume24h = symbol === 'GOLD' ? 180_000_000_000 : Math.round(1_000_000_000 + Math.random() * 10_000_000_000);
          return { symbol, price, volume24h, change24h };
        });
      const allMarkets = [...markets, ...extraMarkets];

      // Personality-tailored market views — each agent sees DIFFERENT asset classes
      const validMarkets = allMarkets.filter((m) => m.price > 0);
      const MAJORS = ['BTC', 'ETH', 'SOL', 'BNB'];
      const STOCKS = ['AAPL', 'TSLA', 'NVDA', 'GOOG', 'AMZN', 'META', 'MSFT', 'NFLX', 'AMD', 'COIN', 'GME', 'AMC', 'HOOD', 'RIVN', 'PLTR'];
      const COMMODITIES = ['GOLD', 'SILVER', 'OIL'];
      const BLUE_CHIPS = [...MAJORS, 'AAPL', 'NVDA', 'GOOG', 'MSFT', 'GOLD'];
      const MEMECOINS = ['DOGE', 'PEPE', 'WIF', 'BONK', 'SHIB', 'FLOKI', 'TURBO', 'NEIRO', 'POPCAT'];

      let topMarkets;
      if (this.config.personality === 'conservative') {
        // Conservative: blue-chip crypto + safe stocks + gold
        topMarkets = validMarkets
          .filter((m) => BLUE_CHIPS.includes(m.symbol))
          .sort((a, b) => b.volume24h - a.volume24h);
        // Add GOLD/SILVER if available
        for (const sym of COMMODITIES) {
          const c = validMarkets.find((m) => m.symbol === sym);
          if (c && !topMarkets.find((t) => t.symbol === sym)) topMarkets.push(c);
        }
      } else if (this.config.personality === 'degen') {
        // Degen: volatile altcoins + meme stocks + volatile tech
        const degenTargets = [...MEMECOINS, 'GME', 'AMC', 'HOOD', 'RIVN', 'TSLA', 'PLTR', 'DKNG'];
        const degenMarkets = validMarkets.filter((m) => degenTargets.includes(m.symbol));
        const altcoins = validMarkets
          .filter((m) => !MAJORS.includes(m.symbol) && !STOCKS.includes(m.symbol) && !COMMODITIES.includes(m.symbol))
          .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
          .slice(0, 10);
        topMarkets = [...degenMarkets, ...altcoins];
        // Deduplicate
        const seen = new Set<string>();
        topMarkets = topMarkets.filter((m) => seen.has(m.symbol) ? false : (seen.add(m.symbol), true)).slice(0, 20);
      } else {
        // Arbitrage: cross-asset — mix of crypto, stocks, commodities for spread capture
        const arbAssets = ['BTC', 'ETH', 'SOL', 'AAPL', 'TSLA', 'NVDA', 'GOLD', 'SILVER'];
        topMarkets = validMarkets.filter((m) => arbAssets.includes(m.symbol));
        // Add top volume markets for liquidity
        const topVol = validMarkets
          .sort((a, b) => b.volume24h - a.volume24h)
          .slice(0, 15);
        for (const m of topVol) {
          if (!topMarkets.find((t) => t.symbol === m.symbol)) topMarkets.push(m);
        }
        topMarkets = topMarkets.slice(0, 20);
      }

      const marketSummary = topMarkets
        .map((m) => {
          const change = m.change24h !== undefined ? ` (${m.change24h >= 0 ? '+' : ''}${m.change24h.toFixed(2)}%)` : '';
          const vol = m.volume24h > 0 ? ` vol:$${(m.volume24h / 1_000_000).toFixed(1)}M` : '';
          return `${m.symbol}: $${m.price >= 1 ? m.price.toFixed(2) : m.price.toFixed(6)}${change}${vol}`;
        })
        .join('\n');

      const positionsSummary = account.positions.length > 0
        ? account.positions
            .map(
              (p) =>
                `${p.symbol} ${p.side} ${p.size} @ $${p.entryPrice.toFixed(2)} (PnL: $${(p.unrealizedPnl ?? 0).toFixed(2)})`
            )
            .join(', ')
        : 'None';

      portfolioValue = account.balance + account.positions.reduce((sum, p) => sum + (p.unrealizedPnl ?? 0), 0);

      observation = `Top markets:\n${marketSummary}\n\nPortfolio: $${portfolioValue.toFixed(2)} | Positions: ${positionsSummary}`;

      // --- THINK ---
      const systemPrompt = getSystemPrompt(this.config.personality, account.balance, positionsSummary);

      const callOpenAI = () =>
        this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Here is the current market data:\n\n${marketSummary}\n\nYour current positions: ${positionsSummary}\nYour balance: $${account.balance.toFixed(2)}\n\nWhat do you want to do?`,
            },
          ],
          tools: TOOLS,
          tool_choice: 'required',
        });

      let response;
      try {
        response = await callOpenAI();
      } catch {
        // Retry once after 2s
        await new Promise((r) => setTimeout(r, 2000));
        response = await callOpenAI();
      }

      const message = response.choices[0]?.message;
      reasoning = message?.content || '(no reasoning provided)';

      // --- ACT ---
      if (message?.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          const fn = (toolCall as { function?: { name: string; arguments: string } }).function;
          if (!fn) continue;
          const fnName = fn.name;
          const args = JSON.parse(fn.arguments);

          if (fnName === 'place_trade') {
            try {
              const leverage = Math.min(Math.max(args.leverage || 1, 1), 50);
              const result = await paper.executeTrade(this.config.agentId, {
                symbol: args.symbol,
                side: args.side,
                size: Math.max(0.001, args.size),
                leverage,
                type: args.type || 'market',
                price: args.price,
              });
              const noteStr = result.note ? ` (${result.note})` : '';
              actions.push({
                type: 'place_trade',
                details: args,
                result: result.success ? 'success' : 'error',
                message: result.success
                  ? `Opened ${args.side} ${args.symbol} size=${result.trade?.size ?? args.size} @ ${args.leverage}x${noteStr}`
                  : `Failed: ${result.error}`,
              });
            } catch (err) {
              actions.push({
                type: 'place_trade',
                details: args,
                result: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          } else if (fnName === 'close_position') {
            try {
              const result = await paper.closePosition(this.config.agentId, args.symbol);
              actions.push({
                type: 'close_position',
                details: args,
                result: result.success ? 'success' : 'error',
                message: result.success
                  ? `Closed ${args.symbol} position`
                  : `Failed: ${result.error}`,
              });
            } catch (err) {
              actions.push({
                type: 'close_position',
                details: args,
                result: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          } else if (fnName === 'hold') {
            actions.push({
              type: 'hold',
              details: args,
              result: 'success',
              message: `Holding: ${args.reason}`,
            });
          }
        }
      } else {
        // No tool calls — treat as hold
        actions.push({
          type: 'hold',
          details: {},
          result: 'success',
          message: 'No action taken this step',
        });
      }
    } catch (err) {
      reasoning = `Error during step: ${err instanceof Error ? err.message : 'Unknown error'}`;
      console.error(`[${this.config.name}] Step error:`, err instanceof Error ? err.message : err);
      actions.push({
        type: 'hold',
        details: {},
        result: 'error',
        message: reasoning,
      });
    }

    // --- LOG ---
    this.totalSteps++;
    this.lastStep = new Date();

    const log: AgentLog = {
      timestamp: this.lastStep,
      agentId: this.config.agentId,
      agentName: this.config.name,
      observation,
      reasoning,
      actions,
      portfolioValue,
    };

    this.logs.push(log);

    // Keep only last 100 logs in memory
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    console.log(
      `[${this.config.name}] Step ${this.totalSteps}: ${actions.map((a) => `${a.type}(${a.result})`).join(', ')}`
    );
    } finally {
      this.stepping = false;
    }
  }

  getLogs(): AgentLog[] {
    return [...this.logs];
  }

  getStatus(): AgentStatus {
    return {
      agentId: this.config.agentId,
      name: this.config.name,
      personality: this.config.personality,
      isRunning: this.running,
      lastStep: this.lastStep,
      totalSteps: this.totalSteps,
      logs: this.logs.slice(-10), // Last 10 logs in status
    };
  }
}
