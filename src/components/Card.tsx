interface CardProps {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export default function Card({ title, subtitle, children, className = "", action }: CardProps) {
  return (
    <div className={`rounded-xl border border-card-border bg-card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted/60 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
