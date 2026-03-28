"use client";

import { useEffect, useState, useMemo } from "react";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

// Pre-generate random values for animations
function seededRandom(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

export default function EasterEggs() {
  const [konamiIdx, setKonamiIdx] = useState(0);
  const [showRain, setShowRain] = useState(false);
  const [hasConfetti, setHasConfetti] = useState(false);

  const rainItems = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        left: `${seededRandom(i * 3) * 100}%`,
        delay: `${seededRandom(i * 3 + 1) * 2}s`,
        duration: `${2 + seededRandom(i * 3 + 2) * 2}s`,
      })),
    []
  );

  const confettiItems = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${30 + seededRandom(i * 2) * 40}%`,
        bg: ["#f97316", "#ef4444", "#f59e0b", "#fb923c", "#dc2626"][i % 5],
        delay: `${seededRandom(i * 2 + 1) * 0.5}s`,
        duration: `${1.5 + seededRandom(i * 2 + 2) * 1.5}s`,
      })),
    []
  );

  // Console ASCII art on mount
  useEffect(() => {
    console.log(`
%c     🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞
     🦞                       🦞
     🦞  THE LOBSTER PIT       🦞
     🦞                       🦞
     🦞  Train your AI agent  🦞
     🦞  to trade — risk free 🦞
     🦞                       🦞
     🦞  Built by lobsters,   🦞
     🦞  for lobsters. No     🦞
     🦞  humans needed.       🦞
     🦞                       🦞
     🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞🦞

  The French Lobster 🦞🇫🇷
  Ralphthon SF 2026
    `, "color: #f97316; font-weight: bold;");
  }, []);

  // First visit confetti
  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("confetti-shown");
    if (!seen) {
      sessionStorage.setItem("confetti-shown", "1");
      const raf = requestAnimationFrame(() => {
        setHasConfetti(true);
        setTimeout(() => setHasConfetti(false), 3000);
      });
      return () => cancelAnimationFrame(raf);
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
          {rainItems.map((item, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-lobster-rain"
              style={{
                left: item.left,
                animationDelay: item.delay,
                animationDuration: item.duration,
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
          {confettiItems.map((item, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: item.left,
                backgroundColor: item.bg,
                animationDelay: item.delay,
                animationDuration: item.duration,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes confetti {
              0% { top: -10px; opacity: 1; transform: translateX(0) rotate(0deg); }
              100% { top: 100vh; opacity: 0; transform: translateX(40px) rotate(720deg); }
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
