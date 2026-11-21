import { cn } from "cn";
import { daysUntil, ddayLabel } from "@/lib/date";

/** D-day 배지 (기준일 2026-11-16). D-2 이내는 빨강, 그 외 회색. */
export function DdayBadge({
  date,
  variant = "badge",
  className,
}: {
  date: string;
  /** text: 배경 없이 큰 글자 (화주 카드의 건 카드) */
  variant?: "badge" | "text";
  className?: string;
}) {
  const n = daysUntil(date);
  const urgent = n >= 0 && n <= 2;
  if (variant === "text") {
    return (
      <span className={cn("font-mono text-lg font-semibold", urgent ? "text-danger" : "text-neutral", className)}>
        {ddayLabel(date)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-lg px-2.5 py-1 font-mono text-sm leading-none font-semibold whitespace-nowrap",
        urgent ? "bg-danger-soft text-danger" : "bg-neutral-soft text-neutral",
        className,
      )}
    >
      {ddayLabel(date)}
    </span>
  );
}
