"use client";

import { useEffect, useState, useRef } from "react";

interface AgentBrainProps {
  observation: string;
  reasoning: string;
  actions: { type: string; message: string; result: string }[];
  animate?: boolean;
}

export default function AgentBrain({ observation, reasoning, actions, animate = true }: AgentBrainProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [phase, setPhase] = useState<"observation" | "reasoning" | "action">("observation");
  const containerRef = useRef<HTMLDivElement>(null);

  const fullText = [
    observation ? `[OBSERVE] ${observation.slice(0, 300)}` : "",
    reasoning ? `\n[THINK] ${reasoning.slice(0, 500)}` : "",
    ...actions.map(
      (a) => `\n[${a.type === "place_trade" ? "TRADE" : a.type === "close_position" ? "CLOSE" : "HOLD"}] ${a.message}`
    ),
  ]
    .filter(Boolean)
    .join("");

  useEffect(() => {
    if (!animate || !fullText) {
      setDisplayedText(fullText);
      return;
    }

    setDisplayedText("");
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));

      // Update phase for cursor color
      const shown = fullText.slice(0, idx);
      if (shown.includes("[THINK]") || shown.includes("[TRADE]") || shown.includes("[CLOSE]") || shown.includes("[HOLD]")) {
        if (shown.includes("[TRADE]") || shown.includes("[CLOSE]") || shown.includes("[HOLD]")) {
          setPhase("action");
        } else {
          setPhase("reasoning");
        }
      } else {
        setPhase("observation");
      }

      if (idx >= fullText.length) clearInterval(timer);
    }, 12);

    return () => clearInterval(timer);
  }, [fullText, animate]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  const cursorColor =
    phase === "observation" ? "bg-muted/50" :
    phase === "reasoning" ? "bg-foreground" :
    "bg-profit";

  return (
    <div
      ref={containerRef}
      className="rounded-lg bg-black/60 border border-card-border p-4 font-mono text-sm leading-relaxed max-h-80 overflow-y-auto"
    >
      {displayedText.split("\n").map((line, i) => {
        let color = "text-muted/60"; // observation
        if (line.startsWith("[THINK]")) color = "text-foreground/90";
        else if (line.startsWith("[TRADE]")) color = "text-accent";
        else if (line.startsWith("[CLOSE]")) color = "text-profit";
        else if (line.startsWith("[HOLD]")) color = "text-muted/40";

        return (
          <div key={i} className={color}>
            {line}
          </div>
        );
      })}
      <span className={`inline-block w-2 h-4 ${cursorColor} animate-blink ml-0.5 align-middle`} />
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
}
