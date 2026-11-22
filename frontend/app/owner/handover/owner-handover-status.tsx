"use client";

import Link from "next/link";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { PageTitle } from "@/components/app/page-header";
import { Pill } from "@/components/app/status-pill";
import type { HandoverSummary } from "@syncargo/backend/data";
import type { HandoverReason, HandoverStatus } from "@syncargo/backend/types";
import { useDemoState } from "@/lib/demo-state";
import { formatMD, formatMMDD, formatPeriod } from "@/lib/date";
import { HANDOVER_REASON_LABEL, HANDOVER_STATUS_LABEL, HANDOVER_STATUS_TONE } from "@/lib/labels";
import { ownerAssignHref, ownerHandoverHref } from "@/lib/links";

type Row = {
  id: string;
  fromUserId: string;
  fromName: string;
  toName: string | null;
  reason: HandoverReason;
  shipperCount: number;
  /** [화주 이름, 넘어가는 건 수] */
  shippers: [string, number][];
  caseCount: number;
  openCount: number;
  status: HandoverStatus;
  noOwner: boolean;
  period: string;
  periodStart: string;
  fromLeavingAt: string | null;
};

/** R-07 인계 현황 (회사 전체) */
export function OwnerHandoverStatus({ handovers }: { handovers: HandoverSummary[] }) {
  const demo = useDemoState();

  const rows: Row[] = [
    // 실무자가 이번 세션에 요청한 인계 → 승인 대기로 맨 위
    ...demo.localHandovers.map<Row>((h) => ({
      id: h.id,
      fromUserId: "",
      fromName: h.fromName,
      toName: h.toName,
      reason: h.reason,
      shipperCount: h.shipperIds.length,
      shippers: h.shipperNames.map((n) => [n, 0]),
      caseCount: h.caseIds.length,
      openCount: 0,
      status: demo.approvedHandovers[h.id] ? "approved" : "requested",
      noOwner: false,
      period: formatPeriod(h.periodStart, h.periodEnd),
      periodStart: h.periodStart,
      fromLeavingAt: null,
    })),
    ...handovers.map<Row>((h) => {
      const assigned = demo.assignedOwners[`handover:${h.id}`];
      return {
        id: h.id,
        fromUserId: h.fromUserId,
        fromName: h.fromName,
        toName: h.toName ?? (assigned ? "지정됨" : null),
        reason: h.reason,
        shipperCount: h.shipperIds.length,
        shippers: h.shipperIds.map((sid, i) => [h.shipperNames[i], h.caseCountByShipper[sid] ?? 0]),
        caseCount: h.caseIds.length,
        openCount: h.openCount,
        status: h.status === "requested" && demo.approvedHandovers[h.id] ? "approved" : h.status,
        noOwner: !h.toUserId && !assigned,
        period: h.reason === "resign" ? `${formatMD(h.periodStart)} 퇴사` : formatPeriod(h.periodStart, h.periodEnd),
        periodStart: h.periodStart,
        fromLeavingAt: h.fromLeavingAt,
      };
    }),
  ];
  const urgent = rows.find((r) => r.noOwner);
  const recent = rows.filter((r) => r.status !== "requested" && !r.noOwner);

  return (
    <>
      <PageTitle
        title="인계 현황"
        description="담당 변경 · 휴가 · 퇴사로 넘어가는 화주와 건"
        actions={
          <Button asChild>
            <Link href={ownerAssignHref()}>담당자 지정</Link>
          </Button>
        }
      />

      {urgent && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-danger-soft px-[18px] py-4">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-bold text-danger">
              {urgent.fromName} {HANDOVER_REASON_LABEL[urgent.reason]}
              {urgent.fromLeavingAt ? ` (${formatMD(urgent.fromLeavingAt)})` : ""} · 다음 담당자가 아직 없어요
            </p>
            <p className="text-[13px] text-danger-ink">
              화주 {urgent.shipperCount}곳 · 건 {urgent.caseCount}개 · 미결 {urgent.openCount}건
            </p>
          </div>
          <Button asChild>
            <Link href={ownerAssignHref({ from: urgent.fromUserId })}>담당자 지정 →</Link>
          </Button>
        </div>
      )}

      <Card className="flex flex-col gap-2">
        <CardHeader title="진행 중인 인계" />
        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[150px]">넘기는 → 받는</span>
            <span className="w-[90px]">사유</span>
            <span className="w-[120px]">화주 · 건</span>
            <span className="w-[56px]">미결</span>
            <span className="w-[110px]">상태</span>
            <span className="flex-1">기간</span>
            <span className="w-[140px]">할 일</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              role="row"
              className={cn("flex items-center gap-4 border-b border-divider px-4 py-4 text-sm", r.noOwner && "bg-danger-row")}
            >
              <span className="w-[150px] font-bold text-foreground">
                {r.fromName} → {r.toName ?? "(미정)"}
              </span>
              <span className="w-[90px]">
                <span className="rounded-md bg-stat px-2 py-[3px] text-xs font-medium text-ink-2">{HANDOVER_REASON_LABEL[r.reason]}</span>
              </span>
              <span className="w-[120px] text-foreground">
                화주 {r.shipperCount} · 건 {r.caseCount}
              </span>
              <span className={cn("w-[56px]", r.openCount > 0 ? "font-bold text-danger" : "text-foreground")}>{r.openCount}건</span>
              <span className="w-[110px]">
                {r.noOwner ? (
                  <Pill tone="red">담당자 필요</Pill>
                ) : (
                  <Pill tone={HANDOVER_STATUS_TONE[r.status]}>{HANDOVER_STATUS_LABEL[r.status]}</Pill>
                )}
              </span>
              <span className="flex-1 text-foreground">{r.period}</span>
              <span className="w-[140px]">
                {r.noOwner ? (
                  <Button variant="outline" asChild>
                    <Link href={ownerAssignHref({ from: r.fromUserId })}>담당자 지정 →</Link>
                  </Button>
                ) : r.status === "requested" ? (
                  <Button variant="outline" asChild>
                    <Link href={ownerHandoverHref(r.id)}>승인 검토 →</Link>
                  </Button>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-1">
        <CardHeader title="최근 넘어간 화주 · 건" />
        {recent.length === 0 && <p className="py-4 text-sm text-muted-foreground">최근 넘어간 화주가 없어요.</p>}
        {recent.flatMap((r) =>
          r.shippers.map(([name, count]) => (
            <div key={`${r.id}-${name}`} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[15px] font-semibold text-foreground">
                  {name} · 건 {count}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {r.fromName} → {r.toName} · {formatMMDD(r.periodStart)} · 미결 {r.openCount}건
                </span>
              </span>
              <Pill tone={HANDOVER_STATUS_TONE[r.status]}>{HANDOVER_STATUS_LABEL[r.status]}</Pill>
            </div>
          )),
        )}
      </Card>
    </>
  );
}
