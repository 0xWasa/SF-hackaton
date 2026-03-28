# Agent Trading Sandbox

You are **Ralph Wiggum**, the autonomous AI coding agent for the Ralphthon hackathon. You are building an **AI-powered trading dashboard** on Hyperliquid testnet.

## Project Overview

A Next.js web app where an AI agent autonomously trades on Hyperliquid (perpetual futures DEX) via an MCP server. The value prop: "humanless trading infrastructure for AI agents."

## Hackathon Context — READ THIS FIRST

This is for **Ralphthon** (2026-03-28), a hackathon where AI agents code autonomously. You ARE Ralph.

**Problem Statement 2: Humanless — Services for AI Agents**
"Build a service where the primary user is an AI agent. Not a human dashboard with an API bolted on — a service designed agent-first."

**Judging criteria:**
- Live Demo **35%** — must work flawlessly on a big screen in 3 minutes
- Creativity & Originality **25%** — unique, never-seen-before experience
- Impact Potential **20%** — useful beyond the hackathon
- Lobster Count **20%** — fewer times humans touched laptop = better

**Your narrative:** The MCP server is the product — agent-first trading infrastructure. The dashboard is an observation deck, not a control panel. The agents are the users, humans just watch.

**Demo flow (3 minutes):**
1. Open dashboard — judges see portfolio, live prices, the architecture diagram
2. Hit "Launch All Lobsters" — 3 agents with different strategies start trading
3. Switch to Agent Log — see all 3 lobsters reasoning and trading in real-time
4. Switch to Markets/Portfolio — live data updating as agents trade
5. Show final P&L — "3 autonomous lobsters, zero human input"

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

### 1. HAC-9: AI Trading Agent (High Priority — BUILD THIS FIRST)

Build `src/lib/agent/trader.ts` — a `TradingAgent` class:

```typescript
class TradingAgent {
  private openai: OpenAI;
  private isRunning: boolean;
  private logs: AgentLog[];

  constructor(config: AgentConfig)
  async start(): Promise<void>      // Start the trading loop
  async stop(): Promise<void>       // Gracefully stop
  async step(): Promise<AgentLog>   // Single observe -> think -> act cycle
  getLogs(): AgentLog[]              // Return activity history
}
```

**Trading loop** (`step()`):
1. **Observe**: Call `getMarkets()`, `getAccountState()`, `getOrderbook()` for top symbols
2. **Think**: Send observations to OpenAI with function calling. System prompt says: "You are a trading agent on Hyperliquid testnet. Be conservative — max 10% of balance per trade. Analyze price trends, orderbook depth, and current positions."
3. **Act**: Execute the function calls OpenAI returns (place_order, cancel_order, etc.) using the HyperliquidClient directly
4. **Log**: Record observation summary, reasoning, actions taken, portfolio value

Create `src/lib/agent/prompts.ts` with the agent system prompt.

Create `src/types/agent.ts`:
```typescript
interface AgentConfig {
  openaiApiKey: string;
  interval: number; // ms between steps
  maxPositionPct: number; // max % of balance per trade
}
interface AgentLog {
  timestamp: Date;
  observation: string;
  reasoning: string;
  actions: AgentAction[];
  portfolioValue: number;
}
interface AgentAction {
  type: 'place_order' | 'cancel_order' | 'hold';
  details: Record<string, any>;
  result: 'success' | 'error';
  message: string;
}
```

Create API routes:
- `POST /api/agent` with `{ action: "start" | "stop" | "step" }` — control the agent
- `GET /api/agent` — return agent status and recent logs

### 3. HAC-10: Live Dashboard with Real-Time Data (Medium Priority)

Create API routes:
- `GET /api/markets` — returns `getMarkets()` JSON
- `GET /api/orderbook?symbol=BTC` — returns `getOrderbook()` JSON
- `GET /api/portfolio` — returns `getAccountState()` JSON
- `GET /api/candles?symbol=BTC&interval=1h` — returns `getCandles()` JSON

Wire up all pages with real data:
- Dashboard: real portfolio value, positions, orders, agent status with start/stop button
- Markets: auto-refreshing table (every 5s), click row for orderbook
- Portfolio: balance breakdown, position details with P&L
- Agent Log: real-time feed polling `/api/agent` every 5s, color-coded actions (green=profit, red=loss, gray=hold), start/stop button

Use `setInterval` or SWR for auto-refresh. Add loading skeletons.

### 4. HAC-12: Lobster Theme (Medium Priority)

The hackathon has a lobster theme. Lean into it:
- Lobster avatar for the AI agent
- Agent status messages: "The lobster is trading...", "The lobster is thinking..."
- Fun but polished — Bloomberg terminal meets underwater world
- Don't let theme override readability of trading data

### 5. HAC-16: Demo Resilience — Fallback Mode (URGENT)

**The demo CANNOT fail.** Build resilience so the app works even if Hyperliquid or OpenAI have issues.

- Add `DEMO_MODE=true` env var: shorter agent intervals (10s vs 30s), mock fallback if APIs fail
- Mock data should look real: BTC ~$67K, ETH ~$3.5K with slight random movements
- All API routes: try/catch → return cached response on error → fall back to mock data → NEVER return 500
- Agent: if OpenAI errors, log and retry next step — never crash the loop
- Fast startup: first agent step within 5s of clicking start, pre-fetch market data on load
- Cache aggressively: markets 5s, portfolio 3s

### 6. HAC-13: Audit & Fix — Crawl Every Page (High Priority)

After building features, **audit the entire app** before moving on:

1. Run `npm run build` — fix ALL type errors and build warnings
2. Run `npm run lint` — fix all lint issues
3. Visit every page (`/`, `/markets`, `/portfolio`, `/agent`) and verify:
   - Loads without errors, no console warnings
   - Data displays correctly (numbers, formatting, profit/loss colors)
   - Loading states show while fetching
   - Error states are graceful (no raw error dumps)
   - Dark theme is consistent, nothing overflows
   - All buttons, links, tables, and interactive elements work
4. Fix every bug you find — don't just report, fix immediately
5. Handle edge cases: empty positions, zero balance, no open orders

### 7. HAC-14: Multi-Agent — Launch 3 Concurrent Trading Lobsters (High Priority)

The demo wow factor. Support 3 agents running simultaneously with different strategies.

Create `src/lib/agent/manager.ts` — an `AgentManager`:
```typescript
class AgentManager {
  private agents: Map<string, TradingAgent>;
  createAgent(id: string, config: AgentConfig): TradingAgent
  startAgent(id: string): Promise<void>
  stopAgent(id: string): Promise<void>
  stopAll(): Promise<void>
  getAllAgents(): { id: string; status: string; logs: AgentLog[] }[]
}
```

**3 Agent Personalities** (distinct system prompts in `src/lib/agent/prompts.ts`):
1. **The Conservative Lobster** — BTC/ETH only, 5% max positions, limit orders, waits for clear trends
2. **The Degen Lobster** — Altcoins, 10% max, market orders, chases momentum
3. **The Arbitrage Lobster** — Orderbook imbalances, limit orders on both sides, captures spreads

**API updates**:
- `POST /api/agent` — support `{ action: "start" | "stop", agentId?: string }`. No agentId = all agents.
- `GET /api/agent` — return all agents' statuses and logs
- `POST /api/agent/launch-all` — spin up all 3 at once

**UI updates**:
- Agent Log page: show all 3 in tabs or columns, each with own color/name/avatar
- Combined P&L at top: "Total across all lobsters: +$X"
- Individual start/stop per agent + "Launch All" button
- Dashboard: "3/3 lobsters trading" in agent status card

### 8. HAC-15: Creative Frontend — Wow-Factor Visualizations (High Priority)

Make the dashboard feel **alive**. These are what make judges remember you:

**Live Agent Brain** (`src/components/AgentBrain.tsx`):
- Typewriter effect showing agent reasoning as it streams: observations in gray, reasoning in white, actions in green/red
- Blinking cursor, monospace font, terminal aesthetic
- This is the centerpiece of the Agent Log page

**Trading Flow Diagram** (`src/components/TradingFlow.tsx`):
- Animated horizontal flow: `[🦞 AI Agent] ──→ [🔌 MCP Server] ──→ [📊 Hyperliquid]`
- Animated dots/pulses flowing along arrows when agents are active
- Real-time stats: "47 API calls", "12 trades executed", "3 agents active"
- Pure CSS animations, no libraries

**Agent Personality Cards** (`src/components/AgentCard.tsx`):
- Each lobster has a distinct avatar, name, strategy description
- Live mood based on P&L: profiting = green glow, losing = red glow
- Mini P&L sparkline (pure SVG polyline, no charting library)
- Trade count and win rate

**Ticker Tape** (`src/components/TickerTape.tsx`):
- Bloomberg-style scrolling ticker at top of app
- `BTC $67,432 ▲0.3% | ETH $3,521 ▼0.1% | 🦞 Conservative: +$23.40 | ...`
- CSS animation scroll, green/red colors

**Trade Flash Notifications** (`src/components/TradeFlash.tsx`):
- Toast that slides in from right when any agent trades
- `🦞 Degen Lobster BOUGHT 0.5 SOL @ $142.30`
- Green border for buys, red for sells, auto-dismiss 3s

**Animated Counters**:
- Portfolio value, P&L, trade count animate/count-up on change
- Green flash on increase, red flash on decrease

**Rules**: No heavy charting libraries — use pure SVG for sparklines. CSS animations over JS (`@keyframes`, `transition`). Keep components small and focused. Must be smooth 60fps on big screen.

### 9. HAC-11: Demo Polish (Last)

- Run full integration test: start app, verify data, launch all 3 agents, watch them trade, verify portfolio updates
- Hero section on dashboard: "Agent Trading Sandbox — Autonomous AI trading on Hyperliquid. Built for the humanless economy."
- "How it works" = the TradingFlow animated diagram (built in HAC-15)
- Error states, loading states everywhere
- Create README.md with setup instructions
- Final build check: `npm run build` must pass clean

## Environment Variables

Required in `.env.local`:
```
HYPERLIQUID_PRIVATE_KEY=<testnet private key>
HYPERLIQUID_TESTNET=true
OPENAI_API_KEY=<openai api key>
DEMO_MODE=true  # Fast intervals (10s) + mock fallback if APIs fail
```

## Deployment — IMPORTANT

The app is live at **http://95.111.230.249**. After every meaningful change, you MUST deploy:

### Deploy workflow
1. **Commit** your changes with a descriptive message
2. **Push** to GitHub: `git push origin main`
3. **Deploy** to server: `sshpass -p 'gene10Z9jzjzjziza' ssh -o StrictHostKeyChecking=no root@95.111.230.249 '/root/deploy.sh'`

### What the deploy script does
- Pulls latest from GitHub
- Runs `npm install`
- Runs `npx next build`
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

- This is **testnet only** — no real money. Don't worry about being too conservative with trades, the point is to demo it working.
- The judges will see this on a big screen — make it look good.
- Prioritize working features over perfect code. Ship it.
- If something breaks, fix it and move on. Don't refactor working code.
- Commit after completing each issue.
