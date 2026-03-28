type Status = "online" | "offline" | "warning" | "trading" | "thinking";

const config: Record<Status, { color: string; label: string; pulse: boolean }> = {
  online: { color: "bg-profit", label: "Online", pulse: false },
  offline: { color: "bg-zinc-500", label: "Offline", pulse: false },
  warning: { color: "bg-yellow-500", label: "Warning", pulse: true },
  trading: { color: "bg-accent", label: "Trading", pulse: true },
  thinking: { color: "bg-blue-500", label: "Thinking", pulse: true },
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { color, label: defaultLabel, pulse } = config[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span className={`w-2 h-2 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
      {label || defaultLabel}
    </span>
  );
}
