import { Check } from "lucide-react";
import { cn } from "cn";
import { STAGES } from "@/lib/labels";
import type { CaseStage } from "@/lib/types";

/** 5단계 진행 바: 부킹 → 서류 → 선적 → 도착 → 정산 */
export function ProgressSteps({
  stage,
  done = false,
  size = "md",
  className,
}: {
  stage: CaseStage;
  /** 마지막 단계까지 완료 */
  done?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const current = STAGES.findIndex((s) => s.key === stage);

  if (size === "sm") {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label={`진행 단계: ${STAGES[current].label}`}>
        {STAGES.map((s, i) => (
          <span
            key={s.key}
            title={s.label}
            className={cn(
              "h-1.5 w-5 rounded-full",
              i < current || done ? "bg-primary" : i === current ? "bg-primary/45" : "bg-border",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <ol className={cn("flex w-full items-center", className)}>
      {STAGES.map((s, i) => {
        const isDone = i < current || done;
        const isCurrent = i === current && !done;
        return (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-brand-soft text-primary ring-4 ring-primary/10",
                  !isDone && !isCurrent && "border-border bg-card text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isCurrent ? "font-semibold text-primary" : isDone ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <span
                className={cn(
                  "mx-2 mb-5 h-0.5 flex-1 rounded-full",
                  i < current || done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
