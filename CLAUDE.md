# Agent Trading Sandbox

You are **Ralph Wiggum**, the autonomous AI coding agent for the Ralphthon hackathon. You are building an **AI-powered trading dashboard** on Hyperliquid testnet.

## Project Overview

A **paper trading sandbox** where AI agents connect via MCP, get $10K virtual USDC, and trade against real Hyperliquid market prices. Agents create their own accounts, pick strategies, set leverage, and compete on a leaderboard. The MCP server IS the product — human dashboard is just an observation deck.

## Hackathon Context — READ THIS FIRST

This is for **Ralphthon** (2026-03-28), a hackathon where AI agents code autonomously. You ARE Ralph.
**Team name: The French Lobster 🦞🇫🇷** — use this in the footer, README, and anywhere the team is referenced.

**Problem Statement 2: Humanless — Services for AI Agents**
"Build a service where the primary user is an AI agent. Not a human dashboard with an API bolted on — a service designed agent-first."

**Judging criteria:**
- Live Demo **35%** — must work flawlessly on a big screen in 3 minutes
- Creativity & Originality **25%** — unique, never-seen-before experience
- Impact Potential **20%** — useful beyond the hackathon
- Lobster Count **20%** — fewer times humans touched laptop = better

**Your narrative:** The MCP server is the product — agent-first trading infrastructure. The dashboard is an observation deck, not a control panel. The agents are the users, humans just watch.

**Demo flow (3 minutes):**
1. Open dashboard — judges see live prices, architecture diagram, leaderboard
2. Hit "Launch All Lobsters" — 3 built-in agents with different strategies start paper trading
3. Switch to Agent Log — see all 3 lobsters reasoning and trading in real-time
4. Go to Connect page — "anyone can plug in their AI agent with one MCP config"
5. Show leaderboard — all agents ranked by P&L, competing in the sandbox
6. Pitch: "A sandbox where AI agents trade with fake money and real prices. No humans needed."

## Tech Stack

- **Framework**: Next.js (App Router) + TypeScript + Tailwind CSS v4
- **AI**: OpenAI API with function calling
- **Trading**: Hyperliquid testnet via `@nktkas/hyperliquid` SDK
- **Protocol**: MCP (Model Context Protocol) server exposes trading tools
- **Wallet**: `viem` for signing (private key in env)

## What's Already Built (DO NOT rewrite these)

- **Hyperliquid client** (`src/lib/hyperliquid/client.ts`) — fully working. **Dual transport**: reads from MAINNET (real prices, real orderbooks), writes to TESTNET (paper trading). Uses `@nktkas/hyperliquid` SDK + `viem` for signing.
- **MCP server** (`src/lib/mcp/server.ts`) — fully working. Exposes 7 tools: `get_markets`, `get_orderbook`, `get_portfolio`, `get_candles`, `place_order`, `cancel_order`, `cancel_all_orders`.
- **MCP entry point** (`src/lib/mcp/index.ts`) — stdio transport, ready to run.
- **Types** (`src/types/trading.ts`) — Market, Orderbook, Position, Order, AccountState, Candle, PlaceOrderParams, OrderResult.
- **Layout** (`src/app/layout.tsx`) — dark theme, sidebar + main content area.
- **Components**: `Sidebar.tsx` (nav with 6 pages + Connect Agent CTA), `Card.tsx` (reusable card), `StatusBadge.tsx` (status indicator), `DataTable.tsx` (generic table).
- **CSS theme** (`src/app/globals.css`) — dark trading terminal colors with CSS variables: `--accent: #f97316`, `--profit: #10b981`, `--loss: #ef4444`.
- **Dashboard** (`src/app/page.tsx`) — Hero explaining the project, how-it-works flow, mini leaderboard, live activity feed, agent-first CTA.
- **Leaderboard** (`src/app/leaderboard/page.tsx`) — 5 mock agents ranked by P&L with full stats (wallet, win rate, trades, strategy, best/worst trade).
- **Markets** (`src/app/markets/page.tsx`) — Mock price table with 8 pairs.
- **Portfolio** (`src/app/portfolio/page.tsx`) — Balance cards + empty positions/history.
- **Agent Log** (`src/app/agent/page.tsx`) — Agent config cards + empty feed + preview of log entries.
- **Connect** (`src/app/connect/page.tsx`) — Agent-first MCP onboarding: one config block, tool catalog, agent-server conversation example. Paper trading emphasized.

## What Needs To Be Built (in priority order)

> **Architecture note**: ALL trading (built-in agents + external agents) goes through the Paper Trading Engine. The existing HyperliquidClient is used READ-ONLY for real market prices. No actual on-chain trades. This is a sandbox.

### 1. HAC-17: Paper Trading Engine (URGENT — Foundation for everything)

Build `src/lib/trading/paper-engine.ts` — the core of the sandbox:

```typescript
class PaperTradingEngine {
  private accounts: Map<string, PaperAccount>;

  createAccount(agentId: string, name: string, strategy?: string, initialBalance?: number): PaperAccount
  getAccount(agentId: string): PaperAccount | undefined
  getAllAccounts(): PaperAccount[]

  // Execute a virtual trade against REAL market price from HyperliquidClient
  async executeTrade(agentId: string, params: {
    symbol: string;
    side: 'buy' | 'sell';
    size: number;
    leverage?: number;       // default 1x, up to 50x
    type: 'market' | 'limit';
    price?: number;
  }): Promise<TradeResult>

  async closePosition(agentId: string, symbol: string): Promise<TradeResult>
  async getPortfolio(agentId: string): Promise<PaperPortfolio>  // real-time P&L
  async getLeaderboard(): Promise<LeaderboardEntry[]>

  // Copy trading: when source agent trades, mirror to copier
  addCopier(copierAgentId: string, sourceAgentId: string): void
}
```

**How it works:**
1. Agent creates account → gets $10,000 virtual USDC
2. Agent calls executeTrade → engine fetches REAL mid price from `HyperliquidClient.getMarkets()` (mainnet)
3. Trade is recorded in-memory. Position tracked. Margin = size / leverage.
4. P&L recalculated in real-time using current market prices
5. If unrealized loss > margin → auto-liquidation
6. Copy trading: when source trades, copier's account mirrors automatically

Create types in `src/types/paper-trading.ts`:
```typescript
interface PaperAccount {
  agentId: string;
  name: string;
  createdAt: Date;
  initialBalance: number;   // $10,000
  balance: number;           // available USDC
  positions: PaperPosition[];
  tradeHistory: PaperTrade[];
  strategy?: string;
  copyingFrom?: string;      // agentId being copied
}
interface PaperPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  leverage: number;
  openedAt: Date;
  unrealizedPnl?: number;
}
interface PaperTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  leverage: number;
  pnl?: number;
  timestamp: Date;
}
interface PaperPortfolio {
  agentId: string;
  name: string;
  balance: number;
  totalValue: number;        // balance + unrealized P&L
  totalPnl: number;
  totalPnlPercent: number;
  positions: PaperPosition[];
  recentTrades: PaperTrade[];
  winRate: number;
  totalTrades: number;
}
interface LeaderboardEntry {
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
```

Use a singleton: `getPaperTradingEngine()` — shared across API routes and agents.

### 2. HAC-18: MCP Server v2 — HTTP Transport + Sandbox Tools (URGENT)

Upgrade the MCP server so external AI agents can connect over HTTP.

**HTTP Transport** (`src/app/api/mcp/route.ts`):
- Use `@modelcontextprotocol/sdk` StreamableHTTPServerTransport
- `POST /api/mcp` — handles MCP JSON-RPC over HTTP
- Each connection gets a session ID → maps to a paper trading account
- This is the URL agents connect to: `https://justlevelup.fun/api/mcp`

**New MCP Tools** (add to `src/lib/mcp/server.ts`):

Account:
- `create_account` — "Create your paper trading account. You get $10,000 virtual USDC. Call this FIRST. Provide your name and trading strategy description." Input: `{ name: string, strategy?: string }`
- `get_my_portfolio` — "Get your balance, positions, P&L, trade history, win rate." Input: `{}`
- `get_leaderboard` — "See all agents ranked by P&L." Input: `{ limit?: number }`

Trading:
- `place_trade` — "Execute a paper trade at real market prices. Supports leverage up to 50x." Input: `{ symbol, side, size, leverage?, type?, price? }`
- `close_position` — "Close an open position and realize P&L." Input: `{ symbol }`
- `set_leverage` — "Set default leverage for future trades (1-50x)." Input: `{ leverage: number }`

Social:
- `copy_agent` — "Automatically mirror another agent's trades." Input: `{ agentId: string }`
- `list_agents` — "See all connected agents, their strategies and stats." Input: `{}`
- `get_agent_trades` — "See another agent's recent trades." Input: `{ agentId, limit? }`

Market Data (keep existing):
- `get_markets`, `get_orderbook`, `get_candles` — already exist, keep them

**Tool descriptions must be written FOR AI agents** — explicit about what to call first, when to use each tool, what parameters mean.

### 3. HAC-9: AI Trading Agent — 3 Built-in Lobsters (High Priority)

Build `src/lib/agent/trader.ts` — a `TradingAgent` class that uses the **Paper Trading Engine** (NOT direct Hyperliquid execution):

```typescript
class TradingAgent {
  private openai: OpenAI;
  private engine: PaperTradingEngine;
  private agentId: string;
  private isRunning: boolean;
  private logs: AgentLog[];

  constructor(config: AgentConfig)
  async start(): Promise<void>
  async stop(): Promise<void>
  async step(): Promise<AgentLog>
  getLogs(): AgentLog[]
}
```

**Trading loop** (`step()`):
1. **Observe**: Get real market data from HyperliquidClient + own portfolio from PaperTradingEngine
2. **Think**: Send to OpenAI with function calling + personality-specific system prompt
3. **Act**: Execute trades via `engine.executeTrade()` (paper trading, not real)
4. **Log**: Record observation, reasoning, actions, portfolio value

**AgentManager** (`src/lib/agent/manager.ts`) runs 3 agents simultaneously:

1. **The Conservative Lobster** — BTC/ETH only, 1-2x leverage, limit orders, waits for clear trends
2. **The Degen Lobster** — Altcoins, 5-10x leverage, market orders, chases momentum
3. **The Arbitrage Lobster** — Orderbook imbalances, both sides, captures spreads

Create `src/lib/agent/prompts.ts` with distinct personality prompts.
Create `src/types/agent.ts` with AgentConfig, AgentLog, AgentAction types.

**API routes**:
- `POST /api/agent` — `{ action: "start"|"stop"|"launch-all", agentId?: string }`
- `GET /api/agent` — all agents' statuses and logs
- `GET /api/agent/[id]` — single agent's full detail: reasoning chain, every decision, trade history

**Agent Detail View** (`/agent/[id]/page.tsx`):
When you click on any agent (from leaderboard, agent log, or dashboard), open a detailed view showing:
- Full reasoning stream with typewriter effect (the AgentBrain component)
- Every decision: what it observed, what it thought, what it did
- Trade history with P&L per trade
- Position chart / sparkline
- Strategy description
- Live status (thinking / trading / idle)
This is the WOW moment — judges click on a lobster and see its entire thought process in real-time.

**IMPORTANT**: Built-in agents use the SAME PaperTradingEngine as external agents. They appear on the same leaderboard. This is the whole point — built-in and external agents compete in the same sandbox.

### 4. HAC-10: Live Dashboard with Real-Time Data (High Priority)

Create API routes:
- `GET /api/markets` — real prices from HyperliquidClient
- `GET /api/orderbook?symbol=BTC` — real orderbook
- `GET /api/candles?symbol=BTC&interval=1h` — real candles
- `GET /api/portfolio` — combined sandbox stats from PaperTradingEngine
- `GET /api/leaderboard` — all agents ranked by P&L

Wire up all pages with real data + auto-refresh (5s intervals):
- **Dashboard**: live market overview, agent count, combined sandbox P&L, leaderboard preview, "Launch All" button
- **Markets**: auto-refreshing price table, click for orderbook modal
- **Portfolio**: per-agent breakdown, positions with real-time P&L
- **Agent Log**: real-time feed of all agent reasoning + trades, color-coded (green=profit, red=loss)
- **Leaderboard**: all agents (built-in + external) ranked by performance

Add loading skeletons, error states, animated counters.

### 5. HAC-19: Connect Page Overhaul — Real Agent Onboarding (High Priority)

Rebuild the Connect page to actually let people connect their AI agents:

**MCP Endpoint** — show prominently:
```
MCP Server: https://justlevelup.fun/api/mcp
```

**Setup guides** (tabs):
- Claude Code / Claude Desktop: JSON config block, copy-pasteable
- Any MCP client: endpoint + transport info
- Quick start prompt: "Connect to the Agent Trading Sandbox. Create an account, analyze markets, start trading. You have $10K virtual USDC."

**Strategy Presets** — visual cards with copyable prompts:
- Conservative (BTC/ETH, 1-2x, limit orders)
- Momentum (top movers, 5x, market orders)
- Degen (altcoins, 10-50x, aggressive)
- Arbitrage (spread capture, both sides)
- Copy Trader (follow a top-performing agent)

**Tool Catalog** — all MCP tools grouped by category with descriptions + example calls

**Live Connected Agents** — real-time list of who's trading in the sandbox right now

### 6. HAC-12: Lobster Theme (Medium Priority)

- Lobster avatars for the 3 built-in agents
- Agent status messages: "The lobster is trading...", "The lobster is thinking..."
- Fun but polished — Bloomberg terminal meets underwater world
- Don't let theme override readability of trading data

### 7. HAC-16: Demo Resilience — Fallback Mode (High Priority)

**The demo CANNOT fail.**

- `DEMO_MODE=true` env var: 10s agent intervals (vs 30s), mock fallback if APIs fail
- All API routes: try/catch → cached response → mock data → NEVER return 500
- Mock data looks real: BTC ~$109K, ETH ~$2.5K with random movements
- Agent: if OpenAI errors, log and retry next step — never crash
- Fast startup: first agent step within 5s, pre-fetch market data on load

### 8. HAC-15: Creative Frontend — Wow-Factor Visualizations (High Priority)

**Live Agent Brain** (`src/components/AgentBrain.tsx`):
- Typewriter effect showing agent reasoning streaming: observations gray, reasoning white, actions green/red
- Blinking cursor, monospace, terminal aesthetic — centerpiece of Agent Log page

**Trading Flow Diagram** (`src/components/TradingFlow.tsx`):
- Animated: `[🦞 AI Agent] ──→ [🔌 MCP Server] ──→ [📊 Hyperliquid]`
- Pulsing dots when active, real-time stats

**Agent Personality Cards** (`src/components/AgentCard.tsx`):
- Distinct avatar/name/strategy, live mood based on P&L, mini SVG sparkline, win rate

**Ticker Tape** (`src/components/TickerTape.tsx`):
- Bloomberg-style scrolling: `BTC $109,432 ▲0.3% | 🦞 Conservative: +$23.40 | ...`

**Trade Flash Notifications** (`src/components/TradeFlash.tsx`):
- Toast slides in on each trade, green/red border, auto-dismiss 3s

**Rules**: Pure SVG sparklines, CSS animations, no heavy libraries, 60fps.

### 9. HAC-13: Audit & Fix (High Priority)

1. `npm run build` — fix ALL errors
2. `npm run lint` — fix all issues
3. Crawl every page: check data, loading states, error states, dark theme, interactions
4. Fix every bug immediately
5. Handle edge cases: empty positions, zero balance, no agents connected

### 10. HAC-21: Easter Eggs & Fun Effects (Medium Priority)

Add delightful surprises throughout the app. Pick the best ones:

- **Konami Code** (↑↑↓↓←→←→BA): rain of lobster emojis + Ralph Wiggum "I'm in danger" quote
- **Console ASCII art**: `console.log` a lobster on app load + "Built by lobsters, for lobsters. No humans were harmed (but some wore costumes)."
- **404 page** (`src/app/not-found.tsx`): "This page got liquidated. Even AI can't find it." with a sad lobster
- **Click sidebar lobster logo 5x** → 3s underwater theme (blue overlay, bubble CSS animation)
- **Lobster typing animation** in agent log: three animated dots that are tiny lobsters
- **First visit confetti**: orange/red burst on first page load (sessionStorage to trigger once)
- **Leaderboard #1**: animated crown + "🏆 Top Lobster" badge
- **Fun agent reasoning**: agents occasionally drop Ralph Wiggum quotes in their reasoning
- **Empty states**: fun copy like "No positions yet — the lobsters are still warming up 🦞"
- **Footer**: "Built at Ralphthon SF 2026 🦞 W&B Office, 400 Alabama St"
- **Loading spinners**: rotating lobster emoji instead of generic spinners

Keep it lightweight (CSS + vanilla JS, no libraries). Don't spend more than ~30 min. Sprinkles, not the cake.

### 11. HAC-11: Demo Polish (Last)

- Full integration test: launch 3 agents, watch them trade, verify leaderboard updates
- Verify Connect page works: follow the setup instructions yourself, connect a 4th agent
- Hero section on dashboard explaining the sandbox concept
- README.md with setup instructions
- Final `npm run build` must pass clean

## Environment Variables

Required in `.env.local`:
```
HYPERLIQUID_PRIVATE_KEY=<testnet private key>
HYPERLIQUID_TESTNET=true
OPENAI_API_KEY=<openai api key>
DEMO_MODE=true  # Fast intervals (10s) + mock fallback if APIs fail
```

## Deployment — IMPORTANT

The app is live at **https://justlevelup.fun**. After every meaningful change, you MUST deploy:

### Deploy workflow
1. **Commit** your changes with a descriptive message
2. **Push** to GitHub: `git push origin main`
3. **Deploy** to server: `sshpass -p 'gene10Z9jzjzjziza' ssh -o StrictHostKeyChecking=no root@95.111.230.249 '/root/deploy.sh'`

### What the deploy script does
- Pulls latest from GitHub
- Runs `npm install`
- Runs `NEXT_FONT_GOOGLE_MOCKED=1 npx next build` (server cant reach Google Fonts)
- Restarts the pm2 process

### Deploy after EVERY completed issue
Do not batch deployments. Each completed issue should be committed, pushed, and deployed immediately so the live site stays up to date.

### If deployment fails
- Check build errors first: `npm run build` locally
- If pm2 is down: `sshpass -p 'gene10Z9jzjzjziza' ssh root@95.111.230.249 'cd /root/SF-hackaton && PORT=80 pm2 start npm --name trading-sandbox -- start'`

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (use to verify no type errors)
- `npm run lint` — run ESLint
- `npx tsx src/lib/mcp/index.ts` — run MCP server standalone

## Code Conventions

- Use the existing Tailwind CSS variables (`bg-card`, `text-muted`, `text-accent`, `text-profit`, `text-loss`, etc.) — defined in `globals.css`
- Use `font-tabular` class for numeric values
- Components go in `src/components/`, lib code in `src/lib/`, types in `src/types/`
- Import paths use `@/` alias (maps to `src/`)
- Use the existing `HyperliquidClient` from `src/lib/hyperliquid/client.ts` — don't create a new one. Use `getHyperliquidClient()` singleton in API routes.
- The MCP server is a reference for tool definitions but the AI agent should call `HyperliquidClient` methods directly (not go through MCP for server-side code)
- App Router: pages are `page.tsx` files in `src/app/<route>/`
- API routes are `route.ts` files in `src/app/api/<route>/`
- Client components need `"use client"` directive
- Keep `@ts-nocheck` on hyperliquid client (SDK type issues)

## Important Notes

- **Paper trading only** — all trades are virtual against real prices. No real money, no on-chain execution for sandbox agents.
- **One PaperTradingEngine instance** — shared singleton. Built-in lobster agents and external MCP agents all trade in the same sandbox, same leaderboard.
- **HyperliquidClient is READ-ONLY** — only used to fetch real market prices from mainnet. Never execute real trades.
- The judges will see this on a big screen — make it look good.
- Prioritize working features over perfect code. Ship it.
- If something breaks, fix it and move on. Don't refactor working code.
- Commit and deploy after completing each issue.
