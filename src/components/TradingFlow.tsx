"use client";

interface TradingFlowProps {
  isActive?: boolean;
}

export default function TradingFlow({ isActive = false }: TradingFlowProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 px-4 overflow-x-auto">
      {/* Agent */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="w-16 h-16 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-3xl">
          🦞
        </div>
        <span className="text-xs font-semibold text-accent">AI Agent</span>
      </div>

      {/* Arrow 1 */}
      <div className="flex items-center gap-0 shrink-0">
        <div className="w-12 h-px bg-gradient-to-r from-accent/50 to-accent relative">
          {isActive && (
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent animate-flow-dot" />
          )}
        </div>
        <span className="text-accent text-xs">▶</span>
      </div>

      {/* MCP Server */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="w-16 h-16 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
          🔌
        </div>
        <span className="text-xs font-semibold text-purple-400">MCP Server</span>
      </div>

      {/* Arrow 2 */}
      <div className="flex items-center gap-0 shrink-0">
        <div className="w-12 h-px bg-gradient-to-r from-purple-500/50 to-purple-500 relative">
          {isActive && (
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 animate-flow-dot-delayed" />
          )}
        </div>
        <span className="text-purple-400 text-xs">▶</span>
      </div>

      {/* Paper Engine */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="w-16 h-16 rounded-xl bg-profit/10 border border-profit/30 flex items-center justify-center text-3xl">
          📊
        </div>
        <span className="text-xs font-semibold text-profit">Hyperliquid</span>
      </div>

      <style jsx>{`
        @keyframes flow-dot {
          0% { left: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% - 8px); opacity: 0; }
        }
        .animate-flow-dot {
          animation: flow-dot 1.5s ease-in-out infinite;
        }
        .animate-flow-dot-delayed {
          animation: flow-dot 1.5s ease-in-out infinite 0.3s;
        }
      `}</style>
    </div>
  );
}
