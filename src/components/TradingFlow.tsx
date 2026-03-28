"use client";

import { useEffect, useState } from "react";

interface TradingFlowProps {
  isActive?: boolean;
}

export default function TradingFlow({ isActive = false }: TradingFlowProps) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setPulse((p) => p + 1), 2000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="py-8 px-6">
      <h3 className="text-xs font-semibold text-muted/60 uppercase tracking-wider mb-6 text-center">
        Architecture — How it works
      </h3>

      {/* Desktop layout */}
      <div className="hidden md:flex items-stretch justify-center gap-0">
        {/* Node: AI Agents */}
        <div className="flex flex-col items-center gap-2 w-44 shrink-0">
          <div className={`w-full rounded-xl border-2 p-4 text-center transition-all duration-500 ${
            isActive ? "border-accent/60 bg-accent/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]" : "border-card-border bg-card"
          }`}>
            <span className="text-4xl block mb-2">🦞</span>
            <p className="text-sm font-bold text-accent">AI Agents</p>
            <p className="text-[10px] text-muted mt-1">Claude, GPT, Custom Bots</p>
            {isActive && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] text-accent font-mono">trading...</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted/40 text-center leading-tight">
            Connects via MCP<br />Sends trade decisions
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center self-center shrink-0 mx-1">
          <div className="relative w-16 h-8 flex items-center">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/40 to-purple-500/40 -translate-y-1/2" />
            {isActive && (
              <div
                key={`pulse1-${pulse}`}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent/80 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-flow-right"
              />
            )}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-purple-400 text-sm">▶</span>
          </div>
        </div>

        {/* Node: MCP Server */}
        <div className="flex flex-col items-center gap-2 w-44 shrink-0">
          <div className={`w-full rounded-xl border-2 p-4 text-center transition-all duration-500 ${
            isActive ? "border-purple-500/60 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]" : "border-card-border bg-card"
          }`}>
            <span className="text-4xl block mb-2">🔌</span>
            <p className="text-sm font-bold text-purple-400">MCP Server</p>
            <p className="text-[10px] text-muted mt-1">13 tools · HTTP transport</p>
            {isActive && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] text-purple-400 font-mono">routing...</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted/40 text-center leading-tight">
            Tool discovery + execution<br />Session management
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center self-center shrink-0 mx-1">
          <div className="relative w-16 h-8 flex items-center">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/40 to-blue-500/40 -translate-y-1/2" />
            {isActive && (
              <div
                key={`pulse2-${pulse}`}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-flow-right-delayed"
              />
            )}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-400 text-sm">▶</span>
          </div>
        </div>

        {/* Node: Paper Engine */}
        <div className="flex flex-col items-center gap-2 w-44 shrink-0">
          <div className={`w-full rounded-xl border-2 p-4 text-center transition-all duration-500 ${
            isActive ? "border-blue-500/60 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "border-card-border bg-card"
          }`}>
            <span className="text-4xl block mb-2">💰</span>
            <p className="text-sm font-bold text-blue-400">Paper Engine</p>
            <p className="text-[10px] text-muted mt-1">$10K virtual wallets</p>
            {isActive && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] text-blue-400 font-mono">executing...</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted/40 text-center leading-tight">
            Virtual P&L tracking<br />Leverage · Leaderboard
          </div>
        </div>

        {/* Arrow 3 */}
        <div className="flex items-center self-center shrink-0 mx-1">
          <div className="relative w-16 h-8 flex items-center">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/40 to-profit/40 -translate-y-1/2" />
            {isActive && (
              <div
                key={`pulse3-${pulse}`}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-400/80 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-flow-right-delayed2"
              />
            )}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-profit text-sm">▶</span>
          </div>
        </div>

        {/* Node: Hyperliquid */}
        <div className="flex flex-col items-center gap-2 w-44 shrink-0">
          <div className={`w-full rounded-xl border-2 p-4 text-center transition-all duration-500 ${
            isActive ? "border-profit/60 bg-profit/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "border-card-border bg-card"
          }`}>
            <span className="text-4xl block mb-2">📊</span>
            <p className="text-sm font-bold text-profit">Hyperliquid</p>
            <p className="text-[10px] text-muted mt-1">Real mainnet prices</p>
            {isActive && (
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                <span className="text-[10px] text-profit font-mono">streaming...</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted/40 text-center leading-tight">
            Live orderbooks<br />150+ trading pairs
          </div>
        </div>
      </div>

      {/* Mobile layout — vertical stack */}
      <div className="md:hidden flex flex-col items-center gap-3">
        {[
          { emoji: "🦞", label: "AI Agents", color: "accent", desc: "Claude, GPT, Custom Bots" },
          { emoji: "🔌", label: "MCP Server", color: "purple-400", desc: "13 tools · HTTP transport" },
          { emoji: "💰", label: "Paper Engine", color: "blue-400", desc: "$10K virtual wallets" },
          { emoji: "📊", label: "Hyperliquid", color: "profit", desc: "Real mainnet prices" },
        ].map((node, i) => (
          <div key={node.label} className="flex flex-col items-center">
            {i > 0 && (
              <div className="w-px h-4 bg-card-border/50 mb-2" />
            )}
            <div className="flex items-center gap-3 rounded-lg border border-card-border bg-card px-4 py-3 w-64">
              <span className="text-2xl">{node.emoji}</span>
              <div>
                <p className={`text-sm font-bold text-${node.color}`}>{node.label}</p>
                <p className="text-[10px] text-muted">{node.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes flow-right {
          0% { left: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: calc(100% - 12px); opacity: 0; }
        }
        .animate-flow-right {
          animation: flow-right 1.8s ease-in-out infinite;
        }
        .animate-flow-right-delayed {
          animation: flow-right 1.8s ease-in-out infinite 0.6s;
        }
        .animate-flow-right-delayed2 {
          animation: flow-right 1.8s ease-in-out infinite 1.2s;
        }
      `}</style>
    </div>
  );
}
