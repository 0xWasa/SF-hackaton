"use client";

import { useEffect, useState, useCallback } from "react";

interface TradeNotification {
  id: string;
  agentName: string;
  message: string;
  isProfit: boolean;
  timestamp: number;
}

export default function TradeFlash() {
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  const checkForTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/agent");
      const data = await res.json();
      const agents = data.agents || [];

      const newNotifs: TradeNotification[] = [];

      for (const agent of agents) {
        for (const log of agent.logs || []) {
          const logTime = new Date(log.timestamp).getTime();
          if (logTime <= lastCheckTime) continue;

          for (const action of log.actions || []) {
            if (action.type === "place_trade" || action.type === "close_position") {
              newNotifs.push({
                id: `${agent.agentId}-${logTime}-${Math.random()}`,
                agentName: agent.name,
                message: action.message,
                isProfit: action.type === "close_position" || action.message?.includes("buy"),
                timestamp: logTime,
              });
            }
          }
        }
      }

      if (newNotifs.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifs].slice(-5));
      }

      setLastCheckTime(Date.now());
    } catch {
      // silent
    }
  }, [lastCheckTime]);

  useEffect(() => {
    const interval = setInterval(checkForTrades, 4000);
    return () => clearInterval(interval);
  }, [checkForTrades]);

  // Auto-dismiss after 4s
  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [notifications]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto rounded-lg border-l-4 px-4 py-3 bg-card/95 backdrop-blur shadow-lg max-w-sm animate-slide-in ${
            notif.isProfit ? "border-l-profit" : "border-l-loss"
          }`}
        >
          <p className="text-xs font-semibold text-foreground/80">🦞 {notif.agentName}</p>
          <p className={`text-xs mt-0.5 ${notif.isProfit ? "text-profit" : "text-loss"}`}>
            {notif.message}
          </p>
        </div>
      ))}
      <style jsx>{`
        @keyframes slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
