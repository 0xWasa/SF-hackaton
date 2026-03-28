import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HyperliquidClient } from "@/lib/hyperliquid/client";
import { getPaperTradingEngine } from "@/lib/trading/paper-engine";

/**
 * Create MCP server with market-data tools only (original behaviour).
 */
export function createTradingMcpServer(client: HyperliquidClient): McpServer {
  const server = new McpServer({
    name: "the-lobster-pit",
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
    name: "the-lobster-pit",
    version: "2.0.0",
  });

  // Register only the market-data tools useful for sandbox agents
  // (excludes get_portfolio which shows raw Hyperliquid data — agents should use get_my_portfolio)
  registerSandboxMarketDataTools(server, client);

  // Add sandbox-specific tools
  registerSandboxTools(server, getAgentId, setAgentId);

  return server;
}

// ---------------------------------------------------------------------------
// Market-data tools for sandbox (no get_portfolio — agents use get_my_portfolio)
// ---------------------------------------------------------------------------

function registerSandboxMarketDataTools(server: McpServer, client: HyperliquidClient) {
  server.tool(
    "get_markets",
    "Get all available trading markets with current mid prices from Hyperliquid mainnet. Returns symbol, price, and 24h stats for 150+ pairs.",
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
    "Get the order book (top 10 bids and asks) for a specific trading pair. Useful for analyzing market depth and spread.",
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
    "get_candles",
    "Get OHLCV candlestick data for a trading pair. Useful for technical analysis and trend detection.",
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
// Market-data (read) tools — full set including get_portfolio (for stdio transport)
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
    "Create your paper trading account on The Lobster Pit. You start with $10,000 virtual USDC and get a generated wallet address. Call this FIRST before any trading. Then call configure_strategy to set up your trading style.",
    {
      name: z.string().describe("Your agent / player name for the leaderboard"),
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

      const walletShort = `${account.walletAddress.slice(0, 6)}...${account.walletAddress.slice(-4)}`;

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Welcome to The Lobster Pit! 🦞`,
              ``,
              `Your paper trading wallet: ${walletShort}`,
              `Full address: ${account.walletAddress}`,
              `Balance: $${account.balance.toLocaleString()} USDC (virtual)`,
              `Agent ID: ${account.agentId}`,
              ``,
              `Next step: Call \`configure_strategy\` to set up your trading style (focus, leverage, strategy).`,
              `Or jump right in — call \`get_markets\` to see live prices, then \`place_trade\` to start trading.`,
              ``,
              `Available tools (13):`,
              `  📊 Market Data: get_markets, get_orderbook, get_candles`,
              `  ⚡ Trading: place_trade, close_position, set_leverage`,
              `  👤 Account: configure_strategy, get_my_portfolio, get_leaderboard`,
              `  🤝 Social: list_agents, copy_agent, get_agent_trades`,
            ].join("\n"),
          },
        ],
      };
    }
  );

  server.tool(
    "configure_strategy",
    "Configure your trading strategy on The Lobster Pit. Sets your focus (crypto or all assets), trading style, default leverage, and an optional description for the leaderboard.",
    {
      name: z
        .string()
        .optional()
        .describe("Update your display name on the leaderboard"),
      focus: z
        .enum(["crypto", "all_assets"])
        .default("crypto")
        .describe("Asset focus: 'crypto' for crypto only, 'all_assets' for everything"),
      style: z
        .enum(["conservative", "momentum", "degen", "arbitrage", "custom"])
        .default("momentum")
        .describe("Trading style preset"),
      leverage: z
        .number()
        .min(1)
        .max(50)
        .default(5)
        .describe("Default leverage for trades (1-50x)"),
      strategy_description: z
        .string()
        .optional()
        .describe("Free-text description of your strategy (shown on leaderboard)"),
    },
    async ({ name: newName, focus, style, leverage, strategy_description }) => {
      const check = requireAgent();
      if ("error" in check) return { content: check.content };

      const account = engine.configureStrategy(check.agentId, {
        focus,
        style,
        leverage,
        strategyDescription: strategy_description,
      });

      if (!account) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "Account not found. Call create_account first." }),
            },
          ],
        };
      }

      // Update name if provided
      if (newName) {
        account.name = newName;
      }

      // Set default leverage on account
      (account as unknown as Record<string, unknown>).defaultLeverage = leverage;

      const styleGuides: Record<string, string> = {
        conservative: "Focus on BTC/ETH with low leverage. Use limit orders. Cut losses at -2%, take profits at 1-3%.",
        momentum: "Scan for biggest movers. Use market orders on strong trends. Trail your stops. 5-10x leverage.",
        degen: "High leverage on altcoins. Big swings, big risks. YOLO into volatile assets.",
        arbitrage: "Watch orderbook spreads. Trade both sides. Quick in/out. Focus on liquid pairs.",
        custom: "You're running your own strategy — good luck!",
      };

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Strategy configured! 🦞`,
              ``,
              `Focus: ${focus === "crypto" ? "Crypto assets" : "All asset classes"}`,
              `Style: ${style}`,
              `Default leverage: ${leverage}x`,
              strategy_description ? `Description: ${strategy_description}` : "",
              ``,
              `Tip: ${styleGuides[style]}`,
              ``,
              `Ready to trade! Here's how:`,
              `1. Call \`get_markets\` to see available trading pairs with live prices`,
              `2. Call \`get_orderbook\` on a symbol to see buy/sell depth`,
              `3. Call \`place_trade\` to execute — e.g. place_trade({ symbol: "BTC", side: "buy", size: 0.01, leverage: ${leverage} })`,
              `4. Call \`get_my_portfolio\` to check your positions and P&L`,
              `5. Call \`get_leaderboard\` to see how you rank against other agents`,
            ].filter(Boolean).join("\n"),
          },
        ],
      };
    }
  );

  server.tool(
    "get_my_portfolio",
    "Get your current portfolio: wallet address, balance, positions, unrealized P&L, trade history, and win rate.",
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
