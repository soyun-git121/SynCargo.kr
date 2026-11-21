import { cn } from "cn";
import { STAGES } from "@/lib/labels";
import type { CaseStage } from "@syncargo/backend/types";

/**
 * 5단계 진행 바 (부킹 → 서류 → 선적 → 도착 → 정산).
 * - md: 건 상세(W-05). 지난 단계 ✓, 지금 단계 "· 지금", 확인 필요면 빨강
 * - sm: 화주 카드의 건 카드(W-03). 지난=파랑, 지금=연파랑(확인 필요면 빨강), 남은=회색
 */
export function ProgressSteps({
  stage,
  alert = false,
  done = false,
  size = "md",
  className,
}: {
  stage: CaseStage;
  /** 지금 단계에 확인 필요한 일이 있음 → 빨강 */
  alert?: boolean;
  /** 모든 단계 완료 */
  done?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const current = done ? STAGES.length : STAGES.findIndex((s) => s.key === stage);

  return (
    <ol className={cn("flex w-full items-start gap-1", className)}>
      {STAGES.map((s, i) => {
        const past = i < current;
        const now = i === current;
        const barColor = past
          ? "bg-primary"
          : now
            ? alert
              ? "bg-danger-strong"
              : size === "md"
                ? "bg-primary"
                : "bg-brand-muted"
            : "bg-border";

        if (size === "sm") {
          return (
            <li key={s.key} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={cn("h-1.5 w-full rounded-[3px]", barColor)} />
              <span
                className={cn(
                  "text-xs",
                  now ? (alert ? "font-bold text-danger" : "font-bold text-foreground") : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </li>
          );
        }

        return (
          <li key={s.key} className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={cn("h-2.5 w-full rounded-[5px]", barColor)} />
            <span className="flex items-center gap-1.5">
              {past && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/figma/check-blue.svg" alt="" width={14} height={14} className="size-3.5" />
              )}
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  now ? (alert ? "font-bold text-danger" : "font-bold text-primary") : "text-muted-foreground",
                )}
              >
                {now ? `${s.label} · 지금` : s.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
