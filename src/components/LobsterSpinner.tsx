const sizes = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

interface LobsterSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export default function LobsterSpinner({ size = "md", message }: LobsterSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={`${sizes[size]} animate-lobster-spin inline-block`}>🦞</span>
      {message && <p className="text-xs text-muted/60 animate-pulse">{message}</p>}
    </div>
  );
}
