import { cn } from "cn";
import { daysUntil, ddayLabel } from "@/lib/date";

/** D-day 배지. 기준일(2026-11-16) 기준. D-2 이내 빨강, D-5 이내 노랑, 그 외 회색. */
export function DdayBadge({ date, className }: { date: string; className?: string }) {
  const n = daysUntil(date);
  const tone =
    n < 0
      ? "bg-neutral-soft text-muted-foreground"
      : n <= 2
        ? "bg-danger text-white"
        : n <= 5
          ? "bg-warning-soft text-warning"
          : "bg-neutral-soft text-neutral";
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-md px-2 font-mono text-xs font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {ddayLabel(date)}
    </span>
  );
}
