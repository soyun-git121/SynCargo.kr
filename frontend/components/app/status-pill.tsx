import { cn } from "cn";
import { STATUS_LABEL } from "@/lib/labels";
import type { CaseStatus } from "@syncargo/backend/types";

export type PillTone = "red" | "yellow" | "gray" | "green" | "blue";

const TONE: Record<PillTone, string> = {
  red: "bg-danger-soft text-danger",
  yellow: "bg-warning-soft text-warning",
  gray: "bg-neutral-soft text-neutral",
  green: "bg-success-soft text-success",
  blue: "bg-brand-soft text-primary",
};

/** Figma "Pill": 둥근 배지, 12px Bold */
export function Pill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<CaseStatus, PillTone> = {
  needs_check: "red",
  awaiting_reply: "yellow",
  in_progress: "gray",
  done: "green",
};

/** 상태 배지: 빨강=확인 필요, 노랑=답변 대기, 회색=진행 중, 초록=완료 */
export function StatusPill({ status, className }: { status: CaseStatus; className?: string }) {
  return (
    <Pill tone={STATUS_TONE[status]} className={className}>
      {STATUS_LABEL[status]}
    </Pill>
  );
}
