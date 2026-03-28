"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutIcon },
  { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
  { href: "/markets", label: "Markets", icon: ChartIcon },
  { href: "/portfolio", label: "Portfolio", icon: WalletIcon },
  { href: "/agent", label: "Agent Log", icon: LobsterIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [clickCount, setClickCount] = useState(0);
  const [underwater, setUnderwater] = useState(false);

  const handleLogoClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setClickCount(0);
      setUnderwater(true);
      setTimeout(() => setUnderwater(false), 3000);
    }
  };

  return (
    <aside className={`flex flex-col w-56 shrink-0 border-r border-card-border bg-card/50 transition-colors duration-500 ${underwater ? "bg-blue-950/80" : ""}`}>
      {underwater && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-blue-400/20 animate-bubble"
              style={{
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes bubble {
              0% { bottom: -10px; opacity: 0.8; }
              100% { bottom: 100%; opacity: 0; }
            }
            .animate-bubble {
              animation: bubble 3s ease-out infinite;
            }
          `}</style>
        </div>
      )}
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 border-b border-card-border cursor-pointer select-none"
        onClick={handleLogoClick}
      >
        <span className="text-2xl">{underwater ? "🫧" : "🦞"}</span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-tight">
            Agent Trading
          </span>
          <span className="text-xs text-muted leading-tight">Sandbox</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon active={isActive} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Connect CTA */}
      <div className="p-3">
        <Link
          href="/connect"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <span>🔌</span> Connect Agent
        </Link>
      </div>

      {/* Status footer */}
      <div className="p-4 border-t border-card-border space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          Simulated Market Live
        </div>
        <p className="text-[10px] text-muted/30 leading-tight">
          Built at Ralphthon SF 2026 🦞
          <br />
          The French Lobster 🇫🇷
        </p>
      </div>
    </aside>
  );
}

function LayoutIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-current";
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-current";
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h2v8H3zm6-4h2v12H9zm6-6h2v18h-2zm6 10h2v8h-2z" />
    </svg>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-current";
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5zm-5 1a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  );
}

function TrophyIcon({ active }: { active: boolean }) {
  const color = active ? "text-accent" : "text-current";
  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-4.5-8a4.5 4.5 0 019 0V5H6.5v4zM6.5 5H4a1 1 0 00-1 1v2a3 3 0 003 3h.5M17.5 5H20a1 1 0 011 1v2a3 3 0 01-3 3h-.5" />
    </svg>
  );
}

function LobsterIcon({ active }: { active: boolean }) {
  return <span className={`text-base ${active ? "" : "grayscale opacity-60"}`}>🦞</span>;
}
