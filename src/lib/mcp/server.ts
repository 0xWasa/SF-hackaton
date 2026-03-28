import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HyperliquidClient } from "@/lib/hyperliquid/client";
import { getPaperTradingEngine } from "@/lib/trading/paper-engine";

/**
 * Create MCP server with market-data tools only (original behaviour).
 */
export function createTradingMcpServer(client: HyperliquidClient): McpServer {
  const server = new McpServer({
    name: "hyperliquid-trading",
    version: "1.0.0",
  });

  registerMarketDataTools(server, client);
  registerWriteTools(server, client);

  return server;
}

/**
 * Create MCP server with market-data tools AND sandbox (paper-trading) tools.
 * Each HTTP session should create its own instance with a unique `agentId`.
 * If `agentId` is not yet known (before create_account), pass `undefined`
 * and the server will assign one on account creation.
 */
export function createSandboxMcpServer(
  client: HyperliquidClient,
  getAgentId: () => string | undefined,
  setAgentId: (id: string) => void
): McpServer {
  const server = new McpServer({
    name: "agent-trading-sandbox",
    version: "2.0.0",
  });

  // Keep all existing market-data tools
  registerMarketDataTools(server, client);

  // Add sandbox-specific tools
  registerSandboxTools(server, getAgentId, setAgentId);

  return server;
}

// ---------------------------------------------------------------------------
// Market-data (read) tools
// ---------------------------------------------------------------------------

function registerMarketDataTools(server: McpServer, client: HyperliquidClient) {
  server.tool(
    "get_markets",
    "Get all available trading markets with current mid prices from Hyperliquid testnet",
    {},
    async () => {
      const markets = await client.getMarkets();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(markets, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_orderbook",
    "Get the order book (top 10 bids and asks) for a specific trading pair",
    {
      symbol: z
        .string()
        .describe("Trading pair symbol, e.g. 'BTC', 'ETH', 'SOL'"),
    },
    async ({ symbol }) => {
      const book = await client.getOrderbook(symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(book, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_portfolio",
    "Get the current account state: balance, positions, open orders, and P&L",
    {},
    async () => {
      const state = await client.getAccountState();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(state, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_candles",
    "Get OHLCV candlestick data for a trading pair",
    {
      symbol: z.string().describe("Trading pair symbol, e.g. 'BTC', 'ETH'"),
      interval: z
        .enum(["1m", "5m", "15m", "1h", "4h", "1d"])
        .default("1h")
        .describe("Candle interval"),
      limit: z
        .number()
        .default(50)
        .describe("Number of candles to return (max 100)"),
    },
    async ({ symbol, interval, limit }) => {
      const candles = await client.getCandles(
        symbol,
        interval as "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
        limit
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(candles, null, 2),
          },
        ],
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Hyperliquid write tools (kept for stdio transport)
// ---------------------------------------------------------------------------

function registerWriteTools(server: McpServer, client: HyperliquidClient) {
  server.tool(
    "place_order",
    "Place a trading order on Hyperliquid testnet. Use 'market' type for immediate execution or 'limit' for a specific price.",
    {
      symbol: z.string().describe("Trading pair symbol, e.g. 'BTC', 'ETH'"),
      side: z
        .enum(["buy", "sell"])
        .describe("Order side: 'buy' to go long, 'sell' to go short"),
      size: z.number().positive().describe("Order size in base asset units"),
      price: z
        .number()
        .optional()
        .describe(
          "Limit price (required for limit orders, ignored for market)"
        ),
      type: z
        .enum(["limit", "market"])
        .default("market")
        .describe("Order type"),
      reduceOnly: z
        .boolean()
        .default(false)
        .describe("If true, only reduces an existing position"),
    },
    async ({ symbol, side, size, price, type, reduceOnly }) => {
      const result = await client.placeOrder({
        symbol,
        side,
        size,
        price,
        type,
        reduceOnly,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "cancel_order",
    "Cancel a specific open order by its order ID",
    {
      symbol: z
        .string()
        .describe("Trading pair symbol of the order to cancel"),
      orderId: z.string().describe("The order ID to cancel"),
    },
    async ({ symbol, orderId }) => {
      const result = await client.cancelOrder(symbol, orderId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "cancel_all_orders",
    "Cancel all open orders across all trading pairs",
    {},
    async () => {
      const result = await client.cancelAllOrders();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}

// ---------------------------------------------------------------------------
// Sandbox (paper-trading) tools
// ---------------------------------------------------------------------------

function registerSandboxTools(
  server: McpServer,
  getAgentId: () => string | undefined,
  setAgentId: (id: string) => void
) {
  const engine = getPaperTradingEngine();

  // Helper: require an agentId or return an error content block
  function requireAgent(): { agentId: string } | { error: true; content: { type: "text"; text: string }[] } {
    const id = getAgentId();
    if (!id) {
      return {
        error: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: "No account found for this session. Call create_account first.",
            }),
          },
        ],
      };
    }
    return { agentId: id };
  }

  // ---- Account Management ----

  server.tool(
    "create_account",
    "Create your paper trading account on the Agent Trading Sandbox. You start with $10,000 virtual USDC. Call this FIRST before any trading. Provide your name and optionally describe your trading strategy.",
    {
      name: z.string().describe("Your agent / player name"),
      strategy: z
        .string()
        .optional()
        .describe("Describe your trading strategy in a few words"),
    },
    async ({ name, strategy }) => {
      // Generate a deterministic-ish agentId from the name
      const agentId =
        getAgentId() ??
        `agent-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

      const account = engine.createAccount(agentId, name, strategy);
      setAgentId(agentId);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                message: `Welcome to the sandbox, ${name}! Your account is ready.`,
                agentId: account.agentId,
                balance: account.balance,
                strategy: account.strategy ?? "none specified",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "get_my_portfolio",
    "Get your current portfolio: balance, positions, unrealized P&L, trade history, and win rate.",
    {},
    async () => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      const portfolio = await engine.getPortfolio(check.agentId);
      if (!portfolio) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Portfolio not found" }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(portfolio, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_leaderboard",
    "See all agents ranked by total P&L. Shows name, strategy, returns, win rate.",
    {
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max number of entries to return"),
    },
    async ({ limit }) => {
      const leaderboard = await engine.getLeaderboard();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(leaderboard.slice(0, limit), null, 2),
          },
        ],
      };
    }
  );

  // ---- Trading ----

  server.tool(
    "place_trade",
    "Execute a paper trade at real market prices. Default leverage is 1x (up to 50x). Default type is 'market'. Size is in base asset units (e.g., 0.01 for BTC).",
    {
      symbol: z.string().describe("Trading pair symbol, e.g. 'BTC', 'ETH'"),
      side: z.enum(["buy", "sell"]).describe("Trade direction"),
      size: z
        .number()
        .positive()
        .describe("Size in base asset units (e.g. 0.01 for BTC)"),
      leverage: z
        .number()
        .min(1)
        .max(50)
        .optional()
        .default(1)
        .describe("Leverage multiplier (1-50x, default 1x)"),
      type: z
        .enum(["market", "limit"])
        .optional()
        .default("market")
        .describe("Order type (default 'market')"),
      price: z
        .number()
        .optional()
        .describe("Limit price (required for limit orders)"),
    },
    async ({ symbol, side, size, leverage, type, price }) => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      const result = await engine.executeTrade(check.agentId, {
        symbol,
        side,
        size,
        leverage,
        type: type ?? "market",
        price,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "close_position",
    "Close your open position in a symbol. Realizes P&L based on current market price.",
    {
      symbol: z.string().describe("Symbol of the position to close"),
    },
    async ({ symbol }) => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      const result = await engine.closePosition(check.agentId, symbol);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "set_leverage",
    "Set default leverage for your future trades. Range: 1-50x.",
    {
      leverage: z
        .number()
        .min(1)
        .max(50)
        .describe("Default leverage multiplier"),
    },
    async ({ leverage }) => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      // Store on the account object (extend if needed, for now just acknowledge)
      const account = engine.getAccount(check.agentId);
      if (account) {
        (account as unknown as Record<string, unknown>).defaultLeverage = leverage;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              message: `Default leverage set to ${leverage}x for future trades.`,
              leverage,
            }),
          },
        ],
      };
    }
  );

  // ---- Social ----

  server.tool(
    "copy_agent",
    "Automatically mirror another agent's trades. When they trade, your account executes the same trade.",
    {
      agentId: z.string().describe("The agent ID to copy"),
    },
    async ({ agentId: targetAgentId }) => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      const success = engine.addCopier(check.agentId, targetAgentId);
      if (!success) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error:
                  "Could not set up copy trading. Check that both agent IDs are valid.",
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              message: `You are now copying agent ${targetAgentId}. Their future trades will be mirrored to your account.`,
            }),
          },
        ],
      };
    }
  );

  server.tool(
    "list_agents",
    "See all agents currently in the sandbox with their strategies and performance stats.",
    {},
    async () => {
      const accounts = engine.getAllAccounts();
      const summaries = accounts.map((a) => ({
        agentId: a.agentId,
        name: a.name,
        strategy: a.strategy ?? "none",
        balance: a.balance,
        positions: a.positions.length,
        totalTrades: a.tradeHistory.length,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summaries, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_agent_trades",
    "View another agent's recent trades to analyze their strategy.",
    {
      agentId: z.string().describe("The agent ID to look up"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Number of recent trades to return"),
    },
    async ({ agentId: targetAgentId, limit }) => {
      const account = engine.getAccount(targetAgentId);
      if (!account) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: `Agent ${targetAgentId} not found` }),
            },
          ],
        };
      }

      const trades = account.tradeHistory.slice(-(limit ?? 20));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                agentId: targetAgentId,
                name: account.name,
                trades,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
