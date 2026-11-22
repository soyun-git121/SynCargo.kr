"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { DdayBadge } from "@/components/app/dday-badge";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { HandoverSummary } from "@syncargo/backend/data";
import { useDemoState, type LocalHandover } from "@/lib/demo-state";
import { formatMD, formatPeriod } from "@/lib/date";
import { HANDOVER_REASON_LABEL } from "@/lib/labels";
import { ownerAssignHref, ownerHandoverHref } from "@/lib/links";

type Item = { id: string; title: string; sub: string; local?: LocalHandover; server?: HandoverSummary };

/** R-08 승인 대기 목록 + 선택한 인계의 요약 · 받는 사람 · 적용 시점 → 승인 / 반려 */
export function HandoverApproval({
  selectedId,
  pending,
  selected,
  notes,
  receivers,
}: {
  selectedId: string;
  pending: HandoverSummary[];
  selected: HandoverSummary | null;
  notes: { id: string; title: string; done: boolean }[];
  receivers: { id: string; name: string }[];
}) {
  const demo = useDemoState();
  const local = demo.localHandovers.find((h) => h.id === selectedId) ?? null;

  const items: Item[] = [
    ...demo.localHandovers.map((h) => ({
      id: h.id,
      title: `${h.fromName} → ${h.toName}`,
      sub: `화주 ${h.shipperIds.length} · 건 ${h.caseIds.length} · ${HANDOVER_REASON_LABEL[h.reason]}`,
      local: h,
    })),
    ...pending.map((h) => ({
      id: h.id,
      title: `${h.fromName} → ${h.toName ?? "(미정)"}${h.toUserId ? "" : " 외"}`,
      sub: `화주 ${h.shipperIds.length} · 건 ${h.caseIds.length} · ${HANDOVER_REASON_LABEL[h.reason]}`,
      server: h,
    })),
  ].filter((i) => !demo.approvedHandovers[i.id] || i.id === selectedId);

  const h = selected ?? null;
  const fromName = h?.fromName ?? local?.fromName ?? "";
  const initialTo = h?.toUserId ?? local?.toUserId ?? demo.assignedOwners[`handover:${selectedId}`] ?? "";
  const [to, setTo] = useState(initialTo);
  const [applyAt, setApplyAt] = useState(h?.periodStart ?? local?.periodStart ?? "");
  const [rejected, setRejected] = useState(false);
  const approvedAt = demo.approvedHandovers[selectedId];

  const shipperNames = h?.shipperNames ?? local?.shipperNames ?? [];
  const caseCount = h?.caseIds.length ?? local?.caseIds.length ?? 0;
  const open = (h?.pending ?? []).filter((p) => !p.done);
  const nearest = [...open].filter((p) => p.dueDate).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0];
  const toName = receivers.find((r) => r.id === to)?.name ?? null;
  const reason = h?.reason ?? local?.reason ?? "vacation";
  const period =
    reason === "resign"
      ? `퇴사 ${formatMD(h?.periodStart ?? local!.periodStart)}`
      : `${HANDOVER_REASON_LABEL[reason]} ${formatPeriod(h?.periodStart ?? local?.periodStart ?? "", h?.periodEnd ?? local?.periodEnd ?? null)}`;
  // 대표는 메일 원문 대신 요약만 본다 → 근거 링크는 숨김 (원문 공유는 담당자가)
  const summaryHref: string | null = null;

  return (
    <div className="flex items-start gap-5">
      <Card className="flex w-[340px] shrink-0 flex-col gap-2">
        <CardHeader title="승인 대기" count={items.length} />
        {items.length === 0 && <p className="py-4 text-sm text-muted-foreground">승인할 인계가 없어요.</p>}
        {items.map((i) => {
          const on = i.id === selectedId;
          return (
            <Link
              key={i.id}
              href={ownerHandoverHref(i.id)}
              className={cn(
                "flex items-center justify-between rounded-[10px] border px-3.5 py-3",
                on ? "border-primary bg-brand-soft" : "border-border hover:bg-subtle",
              )}
            >
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-semibold text-foreground">{i.title}</span>
                <span className="text-[13px] text-muted-foreground">{i.sub}</span>
              </span>
              {on && <span className="text-xs font-semibold text-primary">보는 중</span>}
            </Link>
          );
        })}
      </Card>

      {!h && !local ? (
        <Card className="flex-1 py-16 text-center text-sm text-muted-foreground">왼쪽에서 인계를 골라 주세요.</Card>
      ) : (
        <Card className="flex min-w-0 flex-1 flex-col gap-0">
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                인계 요약 · {fromName} → {toName ?? "(미정)"}
              </h2>
              <Pill tone={open.length ? "red" : "gray"}>미결 {open.length}건</Pill>
            </div>
            <span className="text-[13px] text-muted-foreground">{period}</span>
          </div>

          <SummaryRow label="넘어가는 화주 · 건" href={summaryHref}>
            {shipperNames.join(" · ")} / 건 {caseCount}개
          </SummaryRow>
          <SummaryRow label="미결 사항" href={summaryHref}>
            {open.length ? <span className="text-danger">{open.map((p) => p.title).join(" · ")}</span> : "없음"}
          </SummaryRow>
          {nearest && (
            <SummaryRow label="기한" href={summaryHref}>
              <span className="flex items-center gap-2">
                <DdayBadge date={nearest.dueDate!} />
                가장 가까운 기한 {formatMD(nearest.dueDate!)} {nearest.title.includes("서류") ? "서류 마감" : nearest.title}
              </span>
            </SummaryRow>
          )}
          {h?.contacts && (
            <SummaryRow label="확인 대상" href={summaryHref}>
              {h.contacts}
            </SummaryRow>
          )}

          {notes.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-warning-border/60 bg-warning-soft/50 px-4 py-3.5">
              <p className="text-[15px] font-bold text-foreground">중요 사항 · 챙길 일</p>
              <ul className="flex flex-col gap-1.5">
                {notes.map((n) => (
                  <li key={n.id} className="flex items-center gap-2 text-sm text-foreground">
                    <span className="size-1.5 rounded-full bg-warning" />
                    {demo.handoverNoteTexts[n.id] ?? n.title}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{fromName}가 인계 미리보기에서 남긴 내용</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[15px] font-bold text-foreground">받는 사람 · 적용 시점</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">받는 사람</span>
                <Dropdown
                  aria-label="받는 사람"
                  value={to}
                  onChange={setTo}
                  options={[{ value: "", label: "선택" }, ...receivers.map((r) => ({ value: r.id, label: r.name }))]}
                />
              </div>
              <label>
                <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">적용 시점</span>
                <input
                  value={applyAt}
                  onChange={(e) => setApplyAt(e.target.value)}
                  className="h-10 w-full rounded-lg border border-field-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>
            </div>
            {h && (
              <Link href={ownerAssignHref({ from: h.fromUserId })} className="w-fit text-[13px] font-semibold text-primary hover:underline">
                다른 담당자로 바꾸기 →
              </Link>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-divider pt-4">
            <p className="text-[13px] text-muted-foreground">
              {approvedAt
                ? `${formatMD(approvedAt)} 승인했어요 · ${toName ?? "받는 사람"} 홈에 인계 요약이 보여요`
                : rejected
                  ? `반려했어요 · ${fromName}에게 다시 요청하라고 알려요`
                  : "승인하면 받는 사람 홈에 인계 요약이 표시됩니다."}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={!!approvedAt || rejected} onClick={() => setRejected(true)}>
                반려
              </Button>
              <Button
                disabled={!!approvedAt || rejected || !to}
                title={!to ? "받는 사람을 먼저 골라 주세요" : undefined}
                onClick={() => {
                  demo.assignOwner(`handover:${selectedId}`, to);
                  demo.approveHandover(selectedId);
                }}
              >
                {approvedAt ? "승인 완료" : "승인"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryRow({ label, href, children }: { label: string; href: string | null; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-divider py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[15px] font-semibold text-foreground">{children}</span>
      </div>
      {href && (
        <Link href={href} className="shrink-0 text-[13px] font-semibold text-primary hover:underline">
          근거 ↗
        </Link>
      )}
    </div>
  );
}
