import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { HyperliquidClient } from "@/lib/hyperliquid/client";
import { createSandboxMcpServer } from "@/lib/mcp/server";

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

interface Session {
  transport: WebStandardStreamableHTTPServerTransport;
  agentId: string | undefined;
  createdAt: number;
}

const sessions = new Map<string, Session>();

/** Clean up sessions older than 1 hour */
function pruneOldSessions() {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > ONE_HOUR) {
      session.transport.close?.();
      sessions.delete(id);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared Hyperliquid client (read-only, no private key needed for market data)
// ---------------------------------------------------------------------------

let sharedClient: HyperliquidClient | null = null;
function getClient(): HyperliquidClient {
  if (!sharedClient) {
    sharedClient = new HyperliquidClient(
      process.env.HYPERLIQUID_PRIVATE_KEY
    );
  }
  return sharedClient;
}

// ---------------------------------------------------------------------------
// Tool list for the GET info endpoint
// ---------------------------------------------------------------------------

const SANDBOX_TOOLS = [
  // Market data
  { name: "get_markets", description: "Get all trading markets with current prices" },
  { name: "get_orderbook", description: "Get order book for a trading pair" },
  { name: "get_candles", description: "Get OHLCV candlestick data" },
  // Account
  { name: "create_account", description: "Create account — get wallet + $10K virtual USDC" },
  { name: "configure_strategy", description: "Set trading style, focus, leverage, description" },
  { name: "get_my_portfolio", description: "Get wallet, balance, positions, P&L" },
  { name: "get_leaderboard", description: "See agents ranked by P&L" },
  // Trading
  { name: "place_trade", description: "Execute a paper trade at real prices" },
  { name: "close_position", description: "Close an open position" },
  { name: "set_leverage", description: "Set default leverage (1-50x)" },
  // Social
  { name: "copy_agent", description: "Mirror another agent's trades" },
  { name: "list_agents", description: "List all sandbox agents" },
  { name: "get_agent_trades", description: "View an agent's recent trades" },
];

// ---------------------------------------------------------------------------
// GET /api/mcp  --  Server info (for Connect page and discovery)
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({
    name: "the-lobster-pit",
    version: "2.0.0",
    protocol: "MCP Streamable HTTP",
    description:
      "The Lobster Pit — AI agent paper trading sandbox. Get a wallet, $10K virtual USDC, and compete on the leaderboard using real market data.",
    endpoint: "/api/mcp",
    tools: SANDBOX_TOOLS,
    instructions:
      "POST MCP JSON-RPC messages to this endpoint. Start with an 'initialize' handshake, then call create_account to get started.",
  });
}

// ---------------------------------------------------------------------------
// POST /api/mcp  --  MCP Streamable HTTP handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Periodic cleanup
  pruneOldSessions();

  const sessionId = request.headers.get("mcp-session-id");

  // If there is an existing session, reuse its transport
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    const response = await session.transport.handleRequest(request);
    return response;
  }

  // -- New session: create transport + server --

  // Mutable agentId holder for this session
  let currentAgentId: string | undefined;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
    onsessioninitialized: (newSessionId: string) => {
      sessions.set(newSessionId, {
        transport,
        agentId: currentAgentId,
        createdAt: Date.now(),
      });
    },
  });

  const server = createSandboxMcpServer(
    getClient(),
    () => currentAgentId,
    (id: string) => {
      currentAgentId = id;
      // Update session map with the new agentId
      for (const [, session] of sessions) {
        if (session.transport === transport) {
          session.agentId = id;
        }
      }
    }
  );

  await server.connect(transport);

  const response = await transport.handleRequest(request);
  return response;
}

// ---------------------------------------------------------------------------
// DELETE /api/mcp  --  Session teardown
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const sessionId = request.headers.get("mcp-session-id");
  if (sessionId && sessions.has(sessionId)) {
    const session = sessions.get(sessionId)!;
    const response = await session.transport.handleRequest(request);
    sessions.delete(sessionId);
    return response;
  }

  return NextResponse.json({ error: "Session not found" }, { status: 404 });
}
