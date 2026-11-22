"use client";

import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * 대표 화면: 메일 원문 대신 근거 문장만 보여 준다 (R-06 댓글 기준).
 * 마우스를 올리거나 키보드로 고르면 문장이 뜬다.
 */
export function EvidenceSentence({
  text,
  source,
  tone = "blue",
}: {
  text: string | null;
  /** "11/14 A전자 박과장 메일" */
  source?: string;
  tone?: "blue" | "red";
}) {
  if (!text) return <span className="text-[13px] text-faint">근거 없음</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn("shrink-0 text-[13px] font-semibold hover:underline", tone === "red" ? "text-danger-ink" : "text-primary")}
        >
          근거 문장 ↗
        </button>
      </TooltipTrigger>
      <TooltipContent
        className="max-w-[360px] flex-col items-start gap-0 border border-l-4 border-warning-border bg-warning-soft px-3.5 py-3 text-foreground"
        arrowClassName="bg-warning-soft fill-warning-soft"
      >
        <p className="text-sm leading-normal font-medium">“…{text}”</p>
        <p className="mt-1 text-xs font-semibold text-warning">{source ? `근거 문장 · ${source}` : "근거 문장"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
