import { Pill } from "./status-pill";

/** 막혀 있는 건 배지: 확인 n (빨강) · 대기 n (노랑), 없으면 — */
export function BlockedPills({ check, wait }: { check: number; wait: number }) {
  if (!check && !wait) return <span className="text-faint">—</span>;
  return (
    <span className="flex gap-1">
      {check > 0 && <Pill tone="red">확인 {check}</Pill>}
      {wait > 0 && <Pill tone="yellow">대기 {wait}</Pill>}
    </span>
  );
}

export const BLOCKED_KIND_LABEL = { reply: "답변 대기", approval: "승인 대기", check: "확인 필요" } as const;
export const BLOCKED_KIND_TONE = { reply: "yellow", approval: "yellow", check: "red" } as const;
