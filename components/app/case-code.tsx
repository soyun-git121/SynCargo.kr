import { cn } from "cn";
import { NO_CODE_LABEL } from "@/lib/labels";

/** 건 번호: 고정폭 글꼴. 번호 없는 건(국내 운송·통관)은 "번호 없음"을 회색으로. */
export function CaseCode({ code, className }: { code: string | null; className?: string }) {
  if (!code) {
    return <span className={cn("text-sm font-semibold text-muted-foreground", className)}>{NO_CODE_LABEL}</span>;
  }
  return <span className={cn("font-mono text-sm font-semibold text-foreground", className)}>{code}</span>;
}
