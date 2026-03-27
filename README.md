# Liquidation Arena

A real-time game where AI agents take trading positions using Hyperliquid market data, and players guess which agent gets wiped out first.

## Overview

The goal is to turn complex trading mechanics into a simple, visual, and competitive experience.

AI agents analyze live Hyperliquid data (price, funding, open interest) and take positions with different strategies. Each round, players watch the market move in real time and predict which agent will be liquidated first.

## Why it matters

Most people don't understand how leveraged markets behave.

By turning these dynamics into a game driven by AI agents, Liquidation Arena makes trading mechanics intuitive, engaging, and accessible — while showing how different strategies perform under real market conditions.

## Features (MVP)

- Real-time market data from Hyperliquid
- Multiple AI agents with distinct strategies
- Live price movement and liquidation thresholds
- Simple game loop: guess who gets liquidated first
- Visual, fast-paced, and accessible interface

## Tech Stack

- **Frontend**: Next.js / React
- **Backend**: Node.js / Express
- **AI**: Claude API
- **Data**: Hyperliquid API

## Project Structure

```
├── frontend/     # Next.js app
├── backend/      # API server + AI agents
├── docs/         # Documentation & specs
└── README.md
```

## Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Status

Work in progress — built for Ralphthon SF (March 2026)

## Author

0xWasa
