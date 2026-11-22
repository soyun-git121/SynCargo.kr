"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { UnderlineTabs } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { HandoverSummary } from "@syncargo/backend/data";
import { useDemoState, type LocalHandover } from "@/lib/demo-state";
import { formatMD, formatPeriod } from "@/lib/date";
import { HANDOVER_STATUS_LABEL, HANDOVER_STATUS_TONE } from "@/lib/labels";
import { handoverNewHref, handoverPreviewHref, handoverSummaryHref, type HandoverTab } from "@/lib/links";

type Row = {
  id: string;
  fromName: string;
  toName: string | null;
  shipperIds: string[];
  shipperNames: string[];
  caseCount: number;
  openCount: number;
  statusLabel: string;
  statusTone: "yellow" | "green" | "gray";
  period: string;
  approvedAt: string | null;
  pending: HandoverSummary["pending"];
  href: string;
};

function fromServer(h: HandoverSummary, approvedLocally?: string): Row {
  const status = approvedLocally && h.status === "requested" ? "approved" : h.status;
  return {
    id: h.id,
    fromName: h.fromName,
    toName: h.toName,
    shipperIds: h.shipperIds,
    shipperNames: h.shipperNames,
    caseCount: h.caseIds.length,
    openCount: h.openCount,
    statusLabel: HANDOVER_STATUS_LABEL[status],
    statusTone: HANDOVER_STATUS_TONE[status],
    period: formatPeriod(h.periodStart, h.periodEnd, true),
    approvedAt: h.approvedAt ?? approvedLocally ?? null,
    pending: h.pending,
    href: handoverSummaryHref(h.id),
  };
}

function fromLocal(h: LocalHandover): Row {
  return {
    id: h.id,
    fromName: h.fromName,
    toName: h.toName,
    shipperIds: h.shipperIds,
    shipperNames: h.shipperNames,
    caseCount: h.caseIds.length,
    openCount: 0,
    statusLabel: "승인 대기",
    statusTone: "yellow",
    period: formatPeriod(h.periodStart, h.periodEnd, true),
    approvedAt: null,
    pending: [],
    href: handoverPreviewHref({ shippers: h.shipperIds, to: h.toUserId, reason: h.reason }),
  };
}

/** W-12 인계·미결 현황 (리디자인 v2): 보낸/받은 인계를 탭으로 · 미결 사항을 상태 색으로 */
export function HandoverStatusView({
  sent,
  received,
  initialTab,
}: {
  sent: HandoverSummary[];
  received: HandoverSummary[];
  initialTab: HandoverTab;
}) {
  const demo = useDemoState();
  const [tab, setTab] = useState<HandoverTab>(initialTab);
  const sentRows = [...demo.localHandovers.map(fromLocal), ...sent.map((h) => fromServer(h, demo.approvedHandovers[h.id]))];
  const receivedRows = received.map((h) => fromServer(h));
  const rows = tab === "sent" ? sentRows : receivedRows;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  return (
    <>
      <UnderlineTabs
        tabs={[
          { value: "sent", label: "보낸 인계", badge: <Pill tone={tab === "sent" ? "blue" : "gray"}>{sentRows.length}</Pill> },
          { value: "received", label: "받은 인계", badge: <Pill tone={tab === "received" ? "blue" : "gray"}>{receivedRows.length}</Pill> },
        ]}
        value={tab}
        onChange={(t) => {
          setTab(t);
          setSelectedId(null);
        }}
        right={
          <Button asChild>
            <Link href={handoverNewHref()}>+ 새 인계 시작</Link>
          </Button>
        }
      />

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-2">
          <CardHeader title={tab === "sent" ? "인계 목록" : "받은 인계"} />
          <div className="flex flex-col" role="table">
            <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <span className="w-[150px]">{tab === "sent" ? "넘기는 → 받는" : "넘긴 사람 → 받는 사람"}</span>
              <span className="flex-1">{tab === "sent" ? "화주 · 건" : "화주"}</span>
              {tab === "sent" && <span className="w-[60px]">미결</span>}
              {tab === "received" && <span className="w-[100px]">승인</span>}
              <span className="w-[90px]">상태</span>
              {tab === "sent" && <span className="w-[90px]">기간</span>}
            </div>
            {rows.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {tab === "sent" ? "보낸 인계가 없어요." : "받은 인계가 없어요."}
              </p>
            )}
            {rows.map((r) => {
              const on = r.id === selected?.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="row"
                  aria-selected={on}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "flex items-center gap-4 border-b border-divider px-4 py-4 text-left text-sm transition-colors",
                    on ? (tab === "sent" ? "bg-warning-soft/40" : "bg-brand-soft") : "hover:bg-subtle",
                  )}
                >
                  <span className="w-[150px] font-bold text-foreground">
                    {r.fromName} → {tab === "received" ? `나 (${r.toName})` : (r.toName ?? "미정")}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {tab === "sent"
                      ? `화주 ${r.shipperIds.length} · 건 ${r.caseCount}`
                      : r.shipperNames.length > 1
                        ? `${r.shipperNames[0]} 외 ${r.shipperNames.length - 1}곳`
                        : r.shipperNames[0]}
                  </span>
                  {tab === "sent" && (
                    <span className={cn("w-[60px]", r.openCount > 0 ? "font-bold text-danger" : "text-foreground")}>{r.openCount}건</span>
                  )}
                  {tab === "received" && <span className="w-[100px] text-foreground">{r.approvedAt ? formatMD(r.approvedAt) : "—"}</span>}
                  <span className="w-[90px]">
                    <Pill tone={r.statusTone}>{r.statusLabel}</Pill>
                  </span>
                  {tab === "sent" && <span className="w-[90px] font-mono text-foreground">{r.period}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {selected && (
          <Card className="flex w-[420px] shrink-0 flex-col gap-1">
            {tab === "sent" ? (
              <>
                <CardHeader
                  title="남은 미결 사항"
                  description={`${selected.fromName} → ${selected.toName ?? "미정"} · ${selected.period}`}
                />
                {selected.pending.length === 0 && <p className="py-4 text-sm text-muted-foreground">남은 미결 사항이 없어요.</p>}
                {selected.pending.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 border-b border-divider py-3.5">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[15px] font-semibold text-foreground">{i.title}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {i.caseCode ?? i.shipperName}
                        {i.dueDate ? ` · 기한 ${formatMD(i.dueDate)}` : ""}
                      </span>
                    </span>
                    <Pill tone={i.done ? "green" : "red"}>{i.done ? "완료" : "미결"}</Pill>
                  </div>
                ))}
                <Button variant="outline" asChild className="mt-3 w-full">
                  <Link href={selected.href}>인계 요약 보기 →</Link>
                </Button>
              </>
            ) : (
              <>
                <CardHeader title="받은 인계 요약" description={`${selected.fromName} → 나`} />
                <dl className="mt-2 flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">넘긴 사람</dt>
                    <dd className="text-[15px] font-bold text-foreground">{selected.fromName}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">받은 화주</dt>
                    <dd className="text-[15px] font-bold text-foreground">
                      {selected.shipperNames.length > 1
                        ? `${selected.shipperNames[0]} 외 ${selected.shipperNames.length - 1}곳`
                        : selected.shipperNames[0]}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">승인</dt>
                    <dd className="text-[15px] font-bold text-foreground">
                      {selected.approvedAt ? `${formatMD(selected.approvedAt)} 대표 승인 완료` : "승인 대기"}
                    </dd>
                  </div>
                </dl>
                <p className="my-3 rounded-lg bg-subtle px-3 py-2.5 text-[13px] text-ink-2">
                  화주별 남은 일과 근거는 인계 요약에서 볼 수 있어요.
                </p>
                <Button asChild className="w-full">
                  <Link href={selected.href}>인계 요약 보기 →</Link>
                </Button>
              </>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
