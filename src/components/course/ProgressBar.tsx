type Props = {
  done: number;
  total: number;
  variant?: "primary" | "accent";
  showCount?: boolean;
};

export const ProgressBar = ({
  done,
  total,
  variant = "primary",
  showCount = true,
}: Props) => {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const fill = variant === "accent" ? "bg-accent" : "bg-primary";
  return (
    <div className="flex items-center gap-3 min-w-0">
      {showCount && (
        <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">
          {done}/{total}
        </span>
      )}
      <div className="flex-1 h-1.5 bg-secondary min-w-[60px]">
        <div
          className={`h-full ${fill} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0 w-9 text-right">
        {pct}%
      </span>
    </div>
  );
};
