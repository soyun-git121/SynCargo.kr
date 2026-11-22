import { Fragment } from "react";
import { cn } from "cn";

const STEPS = ["대상 고르기", "미리보기 확인", "대표 승인"];

/** 인계 3단계 진행 표시 (W-08 · W-09 · 대표 R-08) */
export function HandoverSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-3" aria-label="인계 단계">
      {STEPS.map((label, i) => {
        const no = i + 1;
        const done = no < current;
        const now = no === current;
        return (
          <Fragment key={label}>
            {i > 0 && <span aria-hidden className={cn("h-px w-12", done || now ? "bg-primary" : "bg-border")} />}
            <li className="flex items-center gap-2" aria-current={now ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-[13px] font-bold",
                  now && "bg-primary text-white",
                  done && "bg-success-soft",
                  !now && !done && "border border-button-border bg-background text-ink-2",
                )}
              >
                {done ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/figma/check-green.svg" alt="완료" width={14} height={14} className="size-3.5" />
                ) : (
                  no
                )}
              </span>
              <span className={cn("text-sm", now ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
