import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { HyperliquidClient } from "@/lib/hyperliquid/client";

export function createTradingMcpServer(client: HyperliquidClient): McpServer {
  const server = new McpServer({
    name: "hyperliquid-trading",
    version: "1.0.0",
  });

  // --- Read Tools ---

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
      symbol: z.string().describe("Trading pair symbol, e.g. 'BTC', 'ETH', 'SOL'"),
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
      const candles = await client.getCandles(symbol, interval as any, limit);
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

  // --- Write Tools ---

  server.tool(
    "place_order",
    "Place a trading order on Hyperliquid testnet. Use 'market' type for immediate execution or 'limit' for a specific price.",
    {
      symbol: z.string().describe("Trading pair symbol, e.g. 'BTC', 'ETH'"),
      side: z.enum(["buy", "sell"]).describe("Order side: 'buy' to go long, 'sell' to go short"),
      size: z.number().positive().describe("Order size in base asset units"),
      price: z.number().optional().describe("Limit price (required for limit orders, ignored for market)"),
      type: z.enum(["limit", "market"]).default("market").describe("Order type"),
      reduceOnly: z.boolean().default(false).describe("If true, only reduces an existing position"),
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
      symbol: z.string().describe("Trading pair symbol of the order to cancel"),
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

  return server;
}
