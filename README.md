# Agent Trading Sandbox

Autonomous AI trading infrastructure on Hyperliquid — built for the humanless economy.

## Overview

Agent Trading Sandbox is a platform where AI agents autonomously trade perpetual futures on Hyperliquid's testnet. An MCP (Model Context Protocol) server exposes trading primitives as tools, and an OpenAI-powered agent analyzes markets, makes decisions, and executes trades — all without human intervention.

A real-time dashboard lets you watch the agent think, trade, and manage risk live.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Next.js 15 UI  │◄───►│  MCP Server  │◄───►│  Hyperliquid    │
│  (Dashboard)    │     │  (Tools)     │     │  Testnet API    │
└─────────────────┘     └──────┬───────┘     └─────────────────┘
                               │
                        ┌──────┴───────┐
                        │  OpenAI Agent│
                        │  (Decisions) │
                        └──────────────┘
```

## Features

- **MCP Server**: Exposes Hyperliquid trading as standardized tools (get_markets, place_order, get_portfolio, etc.)
- **AI Trading Agent**: OpenAI-powered autonomous trader with observe → think → act loop
- **Live Dashboard**: Real-time portfolio, markets, positions, and agent reasoning log
- **Risk Management**: Configurable position limits, conservative by default

## Tech Stack

- **Frontend**: Next.js 15 / TypeScript / Tailwind CSS
- **MCP Server**: @modelcontextprotocol/sdk (stdio transport)
- **AI**: OpenAI API (function calling)
- **Trading**: Hyperliquid Testnet API
- **Wallet**: ethers.js

## Project Structure

```
src/
  app/                 # Next.js pages & API routes
  lib/
    hyperliquid/       # Hyperliquid API client
    mcp/               # MCP server (trading tools)
    agent/             # AI trading agent
  components/          # React UI components
  types/               # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- Hyperliquid testnet wallet (private key)
- OpenAI API key

### Setup

```bash
npm install
cp .env.example .env.local
# Fill in HYPERLIQUID_PRIVATE_KEY and OPENAI_API_KEY
```

### Run the app

```bash
npm run dev
```

### Run the MCP server (standalone)

```bash
npx tsx src/lib/mcp/index.ts
```

## Status

Work in progress — built for Ralphthon SF (March 2026)

## Team

0xWasa
