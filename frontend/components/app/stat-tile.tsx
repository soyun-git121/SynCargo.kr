import Link from "next/link";
import { cn } from "cn";

const TONE = {
  gray: ["bg-stat", "text-neutral", "text-foreground"],
  red: ["bg-danger-soft", "text-danger-ink", "text-danger"],
  yellow: ["bg-warning-soft", "text-warning", "text-warning"],
  green: ["bg-success-soft", "text-success", "text-success"],
  blue: ["bg-brand-soft", "text-primary", "text-primary"],
} as const;

/** 숫자 칸 (대표 홈 · 화주 카드 · 계약·사용량): 라벨 12px + 숫자 24px + 단위 + 보조 문구 */
export function StatTile({
  label,
  value,
  unit = "건",
  sub,
  tone = "gray",
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: React.ReactNode;
  tone?: keyof typeof TONE;
  href?: string;
  className?: string;
}) {
  const [bg, labelColor, valueColor] = TONE[tone];
  const body = (
    <div className={cn("flex h-full flex-col gap-0.5 rounded-[10px] px-3.5 py-3", bg, className)}>
      <p className={cn("text-xs font-semibold", labelColor)}>{label}</p>
      <p className={cn("flex items-baseline gap-0.5", valueColor)}>
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm font-semibold">{unit}</span>}
      </p>
      {sub && <p className={cn("text-xs", labelColor)}>{sub}</p>}
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
