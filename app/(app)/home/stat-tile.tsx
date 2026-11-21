import Link from "next/link";
import { cn } from "cn";

/** 홈 상단 통계 칸. tone="red"는 처리해야 할 일처럼 강조할 때. */
export function StatTile({
  label,
  value,
  sub,
  tone = "gray",
  href,
}: {
  label: string;
  value: number;
  sub: string;
  tone?: "red" | "gray";
  href?: string;
}) {
  const red = tone === "red";
  const body = (
    <div className={cn("flex flex-col gap-0.5 rounded-[10px] px-3.5 py-3", red ? "bg-danger-soft" : "bg-stat")}>
      <p className={cn("text-xs font-semibold", red ? "text-danger-ink" : "text-neutral")}>{label}</p>
      <p className={cn("flex items-baseline gap-0.5", red ? "text-danger" : "text-foreground")}>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm font-semibold">건</span>
      </p>
      <p className={cn("text-xs", red ? "text-danger-ink" : "text-neutral")}>{sub}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="flex-1 transition-opacity hover:opacity-90">
      {body}
    </Link>
  ) : (
    <div className="flex-1">{body}</div>
  );
}
