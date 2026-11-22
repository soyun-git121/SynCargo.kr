"use client";

import Link from "next/link";
import { Pill } from "@/components/app/status-pill";
import type { HandoverSummary } from "@syncargo/backend/data";
import { useDemoState } from "@/lib/demo-state";
import { HANDOVER_REASON_LABEL, HANDOVER_STATUS_LABEL, HANDOVER_STATUS_TONE } from "@/lib/labels";
import { ownerAssignHref, ownerHandoverHref } from "@/lib/links";

/** 대표 홈 '인계 현황' 한 줄 (승인·지정은 이번 세션 상태를 반영) */
export function HandoverRow({ handover: h }: { handover: HandoverSummary }) {
  const { approvedHandovers, assignedOwners } = useDemoState();
  const assigned = !h.toUserId && assignedOwners[`handover:${h.id}`];
  const noOwner = !h.toUserId && !assigned;
  const approved = h.status === "requested" && approvedHandovers[h.id];
  const status = approved ? "approved" : h.status;
  return (
    <Link
      href={noOwner ? ownerAssignHref({ from: h.fromUserId }) : ownerHandoverHref(h.id)}
      className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0 hover:bg-subtle/60"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[15px] font-semibold text-foreground">
          {h.fromName} → {h.toName ?? (assigned ? "지정됨" : "(미정)")}
        </span>
        <span className="text-[13px] text-muted-foreground">
          화주 {h.shipperIds.length} · 건 {h.caseIds.length} · {HANDOVER_REASON_LABEL[h.reason]}
        </span>
      </span>
      {noOwner ? (
        <Pill tone="red">담당자 필요</Pill>
      ) : (
        <Pill tone={HANDOVER_STATUS_TONE[status]}>{HANDOVER_STATUS_LABEL[status]}</Pill>
      )}
    </Link>
  );
}
