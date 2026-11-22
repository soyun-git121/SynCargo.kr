import { cn } from "cn";

/** 건 상세 맨 위 3칸 (W-05: 현재 상황 → 필요한 것 → 다음 행동 / 대표 R-06: 현재 상황 → 왜 막혔나 → 지금 누가 무엇을) */
const FLOW_TONE = {
  white: { box: "border-border bg-card", no: "bg-neutral text-white", label: "text-muted-foreground", value: "text-foreground", sub: "text-muted-foreground" },
  red: { box: "border-danger-border bg-danger-soft", no: "bg-danger-ink text-white", label: "text-danger-ink", value: "text-danger", sub: "text-danger-ink" },
  blue: { box: "border-brand-muted/50 bg-brand-soft", no: "bg-primary text-white", label: "text-primary", value: "text-primary", sub: "text-primary" },
} as const;

export function FlowTile({
  no,
  label,
  value,
  sub,
  tone = "white",
}: {
  no: number;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  tone?: keyof typeof FLOW_TONE;
}) {
  const t = FLOW_TONE[tone];
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5 rounded-xl border px-4 py-3.5", t.box)}>
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", t.label)}>
        <span className={cn("flex size-[18px] items-center justify-center rounded-full text-[11px] font-bold", t.no)}>{no}</span>
        {label}
      </p>
      <p className={cn("truncate text-base font-bold", t.value)}>{value}</p>
      <p className={cn("truncate text-xs", t.sub)}>{sub}</p>
    </div>
  );
}

export function FlowArrow() {
  return (
    <span aria-hidden className="flex shrink-0 items-center text-lg text-faint">
      →
    </span>
  );
}
