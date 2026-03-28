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
          symbol: { type: 'string', description: 'Trading pair symbol, e.g. BTC, ETH, SOL' },
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
      description: 'Do nothing this step — hold current positions',
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

      // Build a summary of top markets by price
      const topMarkets = markets
        .filter((m) => m.price > 0)
        .sort((a, b) => b.price - a.price)
        .slice(0, 20);

      const marketSummary = topMarkets
        .map((m) => `${m.symbol}: $${m.price.toFixed(2)}`)
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
          tool_choice: 'auto',
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
              const result = await paper.executeTrade(this.config.agentId, {
                symbol: args.symbol,
                side: args.side,
                size: args.size,
                leverage: args.leverage || 1,
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
