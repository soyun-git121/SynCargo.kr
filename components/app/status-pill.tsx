import { cn } from "cn";
import { STATUS_LABEL } from "@/lib/labels";
import type { CaseStatus } from "@/lib/types";

const STYLE: Record<CaseStatus, string> = {
  needs_check: "bg-danger-soft text-danger",
  awaiting_reply: "bg-warning-soft text-warning",
  in_progress: "bg-neutral-soft text-neutral",
  done: "bg-success-soft text-success",
};

const DOT: Record<CaseStatus, string> = {
  needs_check: "bg-danger",
  awaiting_reply: "bg-warning",
  in_progress: "bg-neutral",
  done: "bg-success",
};

/** 상태 배지: 빨강=확인 필요, 노랑=답변 대기, 회색=진행 중, 초록=완료/확정 */
export function StatusPill({
  status,
  label,
  className,
}: {
  status: CaseStatus;
  /** 기본 문구 대신 쓸 텍스트 (예: "확정") */
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        STYLE[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
