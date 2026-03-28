"use client";

import { useEffect, useState } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export default function EasterEggs() {
  const [konamiIdx, setKonamiIdx] = useState(0);
  const [showRain, setShowRain] = useState(false);
  const [hasConfetti, setHasConfetti] = useState(false);

  // Console ASCII art on mount
  useEffect(() => {
    console.log(`
     🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞
     🦞                       🦞
     🦞  AGENT TRADING        🦞
     🦞  SANDBOX              🦞
     🦞                       🦞
     🦞  Built by lobsters,   🦞
     🦞  for lobsters.        🦞
     🦞                       🦞
     🦞  No humans were       🦞
     🦞  harmed (but some     🦞
     🦞  wore costumes).      🦞
     🦞                       🦞
     🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞

  The French Lobster 🦞🇫🇷
  Ralphthon SF 2026
    `);
  }, []);

  // First visit confetti
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("confetti-shown");
    if (!seen) {
      sessionStorage.setItem("confetti-shown", "1");
      setHasConfetti(true);
      setTimeout(() => setHasConfetti(false), 3000);
    }
  }, []);

  // Konami code listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === KONAMI[konamiIdx]) {
        const next = konamiIdx + 1;
        if (next === KONAMI.length) {
          setKonamiIdx(0);
          setShowRain(true);
          setTimeout(() => setShowRain(false), 4000);
        } else {
          setKonamiIdx(next);
        }
      } else {
        setKonamiIdx(0);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [konamiIdx]);

  return (
    <>
      {/* Konami Code: lobster rain */}
      {showRain && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 rounded-xl px-6 py-3 text-center animate-fade-in">
            <p className="text-sm font-bold text-accent">I&apos;m in danger! 🦞</p>
            <p className="text-xs text-muted mt-1">— Ralph Wiggum</p>
          </div>
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-lobster-rain"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              🦞
            </div>
          ))}
          <style jsx>{`
            @keyframes lobster-rain {
              0% { top: -40px; opacity: 1; transform: rotate(0deg); }
              100% { top: 110vh; opacity: 0.5; transform: rotate(360deg); }
            }
            .animate-lobster-rain {
              animation: lobster-rain 3s linear forwards;
            }
            @keyframes fade-in {
              0% { opacity: 0; transform: translate(-50%, -20px); }
              100% { opacity: 1; transform: translate(-50%, 0); }
            }
            .animate-fade-in {
              animation: fade-in 0.3s ease-out;
            }
          `}</style>
        </div>
      )}

      {/* First visit confetti */}
      {hasConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${30 + Math.random() * 40}%`,
                backgroundColor: ["#f97316", "#ef4444", "#f59e0b", "#fb923c", "#dc2626"][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random() * 1.5}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes confetti {
              0% { top: -10px; opacity: 1; transform: translateX(0) rotate(0deg); }
              100% { top: 100vh; opacity: 0; transform: translateX(${Math.random() > 0.5 ? "" : "-"}${30 + Math.random() * 60}px) rotate(720deg); }
            }
            .animate-confetti {
              animation: confetti 2s ease-out forwards;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
