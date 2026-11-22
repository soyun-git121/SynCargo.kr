import Link from "next/link";
import { cn } from "cn";
import type { CaseSummary } from "@syncargo/backend/data";
import { formatMDW } from "@/lib/date";
import { CaseCode } from "./case-code";
import { DdayBadge } from "./dday-badge";
import { ProgressSteps } from "./progress-steps";
import { StatusPill } from "./status-pill";

/** 화주 카드의 진행 중인 건 카드 (W-03 · 대표 R-03): 단계 진행 바 + 다음 기한 + 확인 필요 이유 */
export function ActiveCaseCard({ c, href }: { c: CaseSummary & { issue: string | null }; href: string }) {
  const alert = c.status === "needs_check";
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-3.5 rounded-[14px] border bg-card p-[18px] transition-shadow hover:shadow-md",
        alert ? "border-danger-border" : "border-border",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <CaseCode code={c.code} className="text-[15px]" />
          <span className="text-[13px] text-muted-foreground">{c.stateSummary}</span>
        </div>
        <StatusPill status={c.status} />
      </div>
      <ProgressSteps size="sm" stage={c.stage} alert={alert} />
      {c.nextDeadline && (
        <div className="flex items-center justify-between border-t border-divider pt-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">다음 기한</span>
            <span className="text-sm font-semibold text-foreground">
              {formatMDW(c.nextDeadline.date)} {c.nextDeadline.label}
              {c.stage === "arrival" && c.nextDeadline.label === "도착" ? " 예정" : ""}
            </span>
          </div>
          <DdayBadge date={c.nextDeadline.date} variant="text" />
        </div>
      )}
      {c.issue && (
        <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-[13px] leading-normal font-medium text-danger-ink">{c.issue}</p>
      )}
    </Link>
  );
}
