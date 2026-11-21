import { cn } from "cn";
import { EVENT_KIND_LABEL } from "@/lib/labels";
import type { CaseEventKind } from "@syncargo/backend/types";
import { Pill, type PillTone } from "./status-pill";

export interface TimelineEntry {
  id: string;
  kind: CaseEventKind;
  title: string;
  /** "11/12 · A전자 박과장" */
  meta: string;
  /** 오른쪽: "원문 ↗" 링크 또는 버튼 */
  action?: React.ReactNode;
}

const TONE: Record<CaseEventKind, PillTone> = {
  request: "blue",
  reply: "gray",
  confirm: "green",
  issue: "red",
  off_mail: "yellow",
};

const DOT: Record<CaseEventKind, string> = {
  request: "dot-blue",
  reply: "dot-gray",
  confirm: "dot-green",
  issue: "dot-red",
  off_mail: "dot-yellow",
};

/** 변경 타임라인 (Figma W-05). 확인 필요 항목은 빨간 배경으로 강조. */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">아직 기록이 없습니다.</p>;
  }
  return (
    <ol className={cn("flex flex-col", className)}>
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const issue = e.kind === "issue";
        return (
          <li key={e.id} className="flex gap-3.5">
            <div className="flex w-3.5 shrink-0 flex-col items-center gap-1.5 pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/figma/${DOT[e.kind]}.svg`} alt="" width={12} height={12} className="size-3 shrink-0" />
              {!last && <span className="w-0.5 flex-1 bg-border" />}
            </div>
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 py-3",
                issue && "my-1 rounded-[10px] bg-danger-soft px-3",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Pill tone={TONE[e.kind]}>{EVENT_KIND_LABEL[e.kind]}</Pill>
                  <p className="truncate text-[15px] font-semibold text-foreground">{e.title}</p>
                </div>
                <p className={cn("text-[13px]", issue ? "text-danger-ink" : "text-muted-foreground")}>{e.meta}</p>
              </div>
              {e.action && <div className="shrink-0">{e.action}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
