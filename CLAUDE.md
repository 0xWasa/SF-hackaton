# The Lobster Pit 🦞

You are **Ralph Wiggum**, the autonomous AI coding agent for the Ralphthon hackathon. You are building **The Lobster Pit** — a paper trading sandbox for AI agents.

## Project Overview

**The Lobster Pit** is a paper trading sandbox where AI agents connect via MCP, get a generated wallet + $10K virtual USDC, configure their strategy, and trade against real Hyperliquid market prices. Agents compete on a leaderboard. The MCP server IS the product — the human dashboard is just an observation deck.

**Platform name: "The Lobster Pit"** — use this everywhere (page titles, sidebar, hero, footer, MCP server name, Connect page, README). Replace any "Agent Trading Sandbox" references.

## Design Philosophy — IMPORTANT

The website is a **spectator dashboard for humans** watching AI agents work. Think of it like a sports broadcast — humans are the audience, agents are the players. Every page should:

1. **Make the AI activity visible and exciting** — real-time agent reasoning, live trades, animated flows. Humans should feel like they're watching something alive.
2. **Be instantly understandable** — a judge who has never seen crypto should understand what's happening in 10 seconds. Use clear labels, visual hierarchy, and plain language. No jargon without explanation.
3. **Tell the story visually** — the dashboard should answer: "What is this? What are the agents doing? How do I connect my own agent?" without reading any docs.
4. **Look premium** — this is a big-screen demo. Bold typography, clean spacing, smooth animations. Think Bloomberg terminal meets a modern SaaS product. No clutter.

The humans never trade. They watch, understand, and connect their own AI agents. The website is the wow-effect mirror of agent activity.

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

**Your narrative:** The Lobster Pit is a trading sandbox designed for AI agents, not humans. Any AI agent — Claude, GPT, custom bots — can connect via MCP, get a wallet, pick a strategy, and start paper trading with real market prices. You don't need to know anything about crypto or trading — the onboarding guides your agent through everything. The dashboard is an observation deck where humans watch agents compete.

**The Big Idea**: The Lobster Pit is a **sandbox to train your AI agent to trade**. Connect any AI agent, it gets a wallet and $10K virtual USDC, and learns to trade against real market data — risk-free. Once your agent is profitable and battle-tested, the next step is real money. We're building the training ground today; the live trading bridge comes next.

**Key pitch**: "Train your AI agent to trade — risk free. It gets a wallet, $10K fake money, real market data. Watch it learn, make mistakes, and get better. When it's ready... real money is next."

**Tease on the dashboard/connect page**: Add a subtle "Coming Soon" section or badge: "🔜 When your agent is ready, deploy it with real funds on Hyperliquid mainnet. Paper trading today. Real trading tomorrow." This shows impact potential (20% of judging) — the product has a clear path beyond the hackathon.

**Demo flow (3 minutes):**
1. Open dashboard — "Welcome to The Lobster Pit" — live prices, architecture diagram, leaderboard
2. Hit "Launch All Lobsters" — 3 built-in agents with different strategies start paper trading
3. Switch to Agent Log — see all 3 lobsters reasoning and trading in real-time
4. Go to Connect page — "anyone can plug in their AI agent with one MCP config line"
5. Explain: agent connects → gets wallet → configures strategy (crypto, stocks, leverage) → starts trading. Zero crypto knowledge needed.
6. Show leaderboard — all agents competing in the same sandbox
7. Pitch: "The Lobster Pit — a sandbox where AI agents trade with fake money and real prices. Your agent gets a wallet, picks a strategy, and competes. No humans needed."

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

## ALREADY BUILT — Do NOT redo these

> Check git log if unsure. These are DONE and working. Do not rewrite or re-implement.

- ✅ Paper Trading Engine (`src/lib/trading/paper-engine.ts`) — virtual $10K accounts, real prices, leverage, copy trading
- ✅ AI Trading Agent + Manager (`src/lib/agent/`) — 3 lobster personalities, OpenAI function calling, 10s intervals
- ✅ MCP Server v2 with HTTP (`src/app/api/mcp/route.ts`) — 9 sandbox tools, session management
- ✅ API routes (`/api/markets`, `/api/agent`, `/api/leaderboard`, `/api/portfolio`, `/api/agent/[id]`)
- ✅ Live dashboard wired to real data (`src/app/page.tsx`)
- ✅ Connect page with MCP endpoint and setup guides (`src/app/connect/page.tsx`)
- ✅ Demo resilience — mock fallback, error handling, no 500s
- ✅ Creative frontend components — TickerTape, TradingFlow, AgentBrain, TradeFlash, AgentCard

> Architecture: ALL trading goes through PaperTradingEngine. HyperliquidClient is READ-ONLY for real market prices. No on-chain trades.

## REMAINING TASKS — Do these in order

### 1. HAC-24: FIX — Agent Trade Sizing (URGENT BUG — DO THIS FIRST)

Agents try to trade way more than their $10K balance (e.g. $308K margin needed). Fix in 3 places:

1. **`src/lib/agent/prompts.ts`**: Add explicit sizing rules: "Your balance is $X. position_value = size * price. margin = position_value / leverage. margin MUST be < balance. Example: $10K balance, 5x leverage, BTC at $109K → max size = 0.45 BTC."
2. **`src/lib/trading/paper-engine.ts`**: In `executeTrade`, if margin > balance, **auto-adjust size down** to max affordable size instead of rejecting. Return a note: "Size adjusted from X to Y to fit available margin."
3. **`src/lib/agent/trader.ts`**: In the OpenAI tool definition for `place_trade`, add to description: "IMPORTANT: size is in base asset units. BTC at $109K means size 0.01 = $1,090. Always check balance first."

### 2. HAC-23: MCP Agent Onboarding — Wallet + Strategy Config (URGENT — WOW FACTOR)

The killer feature. When an AI agent connects, it gets guided onboarding:

**Update `create_account`** in `src/lib/mcp/server.ts` to auto-generate a wallet address (random hex):
```
Welcome to The Lobster Pit! 🦞
Your paper trading wallet: 0x7a3b...4f2e
Balance: $10,000.00 USDC (virtual)
Call `configure_strategy` to set up your trading style.
```

**Add new MCP tool `configure_strategy`**:
- `name`: display name for leaderboard
- `focus`: "crypto" or "all_assets"
- `style`: conservative / momentum / degen / arbitrage / custom
- `leverage`: 1-50x default
- `strategy_description`: free text

Response guides agent on available tools and how to start trading.

**Update `get_my_portfolio`** to show wallet address.

**Rename platform everywhere**: "Agent Trading Sandbox" → "The Lobster Pit" in layout title, sidebar, hero, connect page, MCP server name.

Footer: "The Lobster Pit — Built by The French Lobster 🦞🇫🇷 at Ralphthon SF 2026"

Add "Coming Soon" teaser: "🔜 When your agent is ready, deploy with real funds on Hyperliquid mainnet."

### 3. HAC-25: Markets Page — Categories + Detail View + Agent Activity

Make https://justlevelup.fun/markets much richer:

**Asset categories** — tabs: All / Majors (BTC, ETH) / Altcoins / Memecoins
Group based on what `getMarkets()` returns from Hyperliquid.

**Clickable market detail** — click any row to open `/markets/[symbol]` or modal:
- Current price (large), simple SVG line chart from candle data
- Orderbook (top 5 bids/asks)
- 24h stats if available

**Agent activity per market**: which agents traded this asset, who holds positions, color-coded.

**Visual polish**: green/red animations, mini sparklines in rows, loading skeletons.

### 4. HAC-12: Lobster Theme + Platform Branding

- Lobster avatars for the 3 built-in agents
- "The lobster is trading..." / "The lobster is thinking..." status messages
- Bloomberg terminal meets underwater world aesthetic
- Make the dashboard instantly understandable to someone who has never seen crypto

### 5. HAC-21: Easter Eggs & Fun Effects

Pick the best 5-6:
- Konami Code (↑↑↓↓←→←→BA): lobster emoji rain
- Console ASCII art lobster on page load
- 404 page: "This page got liquidated" with sad lobster
- Click sidebar logo 5x → underwater theme for 3s
- Leaderboard #1 gets animated crown + "🏆 Top Lobster"
- Loading spinners = rotating lobster emoji
- Empty states: "No positions yet — the lobsters are still warming up 🦞"

Keep lightweight, ~30 min max.

### 6. HAC-14: Verify 3 Agents Work Concurrently

The agent manager exists. Verify all 3 agents actually run, trade, and show up on leaderboard.
- Test "Launch All" from the API
- Make sure agent log page shows all 3 with distinct personalities
- Combined P&L display

### 7. HAC-13: Audit & Fix

1. `npm run build` — fix ALL errors
2. Crawl every page: data, loading states, error states, dark theme
3. Fix every bug immediately
4. Handle edge cases: empty positions, zero balance, no agents connected

### 8. HAC-11: Demo Polish + README (Last)

- Full integration test: launch 3 agents, watch trades, verify leaderboard
- Hero section: "The Lobster Pit — Train your AI agent to trade. Risk free."
- "Coming Soon: Real Money" teaser section
- README.md: project description, setup, team members (The French Lobster 🦞🇫🇷)
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
