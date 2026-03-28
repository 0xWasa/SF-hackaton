"use client";

import { useMemo } from "react";

function seeded(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

export default function AmbientBubbles() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        size: 3 + seeded(i * 7) * 6,
        left: seeded(i * 7 + 1) * 100,
        delay: seeded(i * 7 + 2) * 20,
        duration: 12 + seeded(i * 7 + 3) * 18,
        opacity: 0.03 + seeded(i * 7 + 4) * 0.06,
        drift: -30 + seeded(i * 7 + 5) * 60,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep ocean gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-950/[0.08] via-transparent to-cyan-950/[0.04]" />

      {/* Ambient bubbles */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full ambient-bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            bottom: `-${b.size}px`,
            background: `radial-gradient(circle at 30% 30%, rgba(56, 189, 248, ${b.opacity * 2}), rgba(14, 165, 233, ${b.opacity}))`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ['--drift' as string]: `${b.drift}px`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ambient-rise {
          0% {
            transform: translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(var(--drift)) scale(0.6);
            opacity: 0;
            bottom: 105%;
          }
        }
        .ambient-bubble {
          animation: ambient-rise var(--duration, 15s) ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
