"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { StatusPill } from "@/components/app/status-pill";
import { Pill } from "@/components/app/status-pill";
import { TextEditDialog } from "@/components/app/text-edit-dialog";
import type { HandoverShipperPreview } from "@syncargo/backend/data";
import type { HandoverReason } from "@syncargo/backend/types";
import { useDemoState } from "@/lib/demo-state";
import { formatMD, formatMMDD } from "@/lib/date";
import { HANDOVER_REASON_LABEL } from "@/lib/labels";
import { caseHref, evidenceRefHref, handoverEditHref, handoverHref, shipperHref, type HandoverDraft } from "@/lib/links";

export type PreviewMode =
  /** W-09: 실무자가 요청 전에 확인 */
  | { kind: "draft"; draft: HandoverDraft }
  /** W-12 '인계 요약 보기': 이미 요청된 인계 (읽기 전용 + 챙길 일 체크) */
  | { kind: "view"; statusLabel: string };

/** W-09 인계 미리보기 (리디자인 v2): 고른 화주를 위 탭으로, 화주별 요약 · 남은 일 · 중요 사항 · 근거 메일 */
export function HandoverPreview({
  mode,
  fromName,
  toUserId,
  toName,
  reason,
  period,
  shippers,
  readOnlySummary = false,
}: {
  mode: PreviewMode;
  fromName: string;
  toUserId: string | null;
  toName: string | null;
  reason: HandoverReason;
  period: string | null;
  shippers: HandoverShipperPreview[];
  /** 읽기 전용: 요약 수정·챙길 일 추가 없음 */
  readOnlySummary?: boolean;
}) {
  const router = useRouter();
  const demo = useDemoState();
  const [activeId, setActiveId] = useState(shippers[0]?.shipper.id);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [noteDialog, setNoteDialog] = useState<{ open: boolean; id?: string; title: string }>({ open: false, title: "" });

  const active = shippers.find((s) => s.shipper.id === activeId) ?? shippers[0];
  const totalOpen = shippers.reduce((n, s) => n + s.openCount, 0);
  const caseCount = shippers.reduce((n, s) => n + s.cases.length, 0);

  if (!active) {
    return <Card className="py-16 text-center text-sm text-muted-foreground">인계할 화주를 먼저 골라 주세요.</Card>;
  }

  const notes = [
    ...active.notes.map((n) => ({ ...n, title: demo.handoverNoteTexts[n.id] ?? n.title })),
    ...demo.addedHandoverNotes
      .filter((n) => n.shipperId === active.shipper.id)
      .map((n) => ({ id: n.id, title: demo.handoverNoteTexts[n.id] ?? n.title, sub: `${active.shipper.name} · 직접 추가`, done: false })),
  ];
  const s = active.summary;
  const summaryText = demo.handoverSummaries[active.shipper.id];

  const request = () => {
    if (mode.kind !== "draft" || !toUserId || !toName) return;
    demo.requestHandover({
      fromName,
      toUserId,
      toName,
      shipperIds: shippers.map((x) => x.shipper.id),
      shipperNames: shippers.map((x) => x.shipper.name),
      caseIds: shippers.flatMap((x) => x.cases.map((c) => c.id)),
      reason,
      periodStart: "2026-11-23",
      periodEnd: reason === "vacation" ? "2026-11-27" : null,
    });
    router.push(handoverHref("sent"));
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] font-bold text-foreground">
            {fromName} → {toName ?? <span className="text-danger">담당자 미정</span>}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="blue">자동 생성</Pill>
            <Pill tone={totalOpen > 0 ? "red" : "gray"}>미결 {totalOpen}건</Pill>
            <Pill tone="gray">
              {HANDOVER_REASON_LABEL[reason]}
              {period ? ` ${period}` : ""}
            </Pill>
            {mode.kind === "view" && <Pill tone="yellow">{mode.statusLabel}</Pill>}
          </div>
        </div>
        {mode.kind === "draft" && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={handoverEditHref(mode.draft)}>대상 수정</Link>
            </Button>
            <Button onClick={request} disabled={!toUserId}>
              인계 요청 →
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-muted-foreground">
          넘기는 화주 {shippers.length}곳 · 건 {caseCount}개 · 이름을 누르면 화주별 남은 일과 근거가 보여요
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(shippers.length, 4)}, minmax(0, 1fr))` }} role="tablist">
          {shippers.map((x) => {
            const on = x.shipper.id === active.shipper.id;
            return (
              <button
                key={x.shipper.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveId(x.shipper.id)}
                className={cn(
                  "flex items-center justify-between rounded-xl border bg-card px-4 py-3.5 text-left transition-colors",
                  on ? "border-2 border-primary bg-brand-soft px-[15px] py-[13px]" : "border-border hover:bg-subtle",
                )}
              >
                <span className="flex flex-col gap-1">
                  <span className={cn("text-base font-bold", on ? "text-primary" : "text-foreground")}>{x.shipper.name}</span>
                  <span className={cn("text-xs", x.openCount > 0 && on ? "text-danger" : "text-muted-foreground")}>
                    건 {x.cases.length} · 미결 {x.openCount}
                  </span>
                </span>
                {on ? <span className="text-xs font-semibold text-primary">보는 중</span> : <span className="text-lg text-faint">›</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-5">
        <Card className="flex w-[360px] shrink-0 flex-col gap-4">
          <CardHeader title={`화주 요약 · ${active.shipper.name}`} />
          {summaryText ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{summaryText}</p>
          ) : (
            <dl className="flex flex-col gap-3.5">
              <SummaryRow label="거래" value={s.trade} />
              <SummaryRow label="반복 조건" value={s.patterns} />
              {s.latestChange && <SummaryRow label="최근 변경" value={s.latestChange} />}
              {s.caution && <SummaryRow label="주의" value={s.caution} danger />}
            </dl>
          )}
          {!readOnlySummary && mode.kind === "draft" && (
            <Button variant="outline" className="w-full" onClick={() => setSummaryDialog(true)}>
              요약 수정
            </Button>
          )}
          <Link href={shipperHref(active.shipper.id)} className="text-[13px] font-semibold text-primary hover:underline">
            화주 카드 열기 ↗
          </Link>
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex flex-col gap-1">
            <CardHeader title={`진행 건과 남은 일 · ${active.shipper.name}`} />
            {active.cases.length === 0 && <p className="py-4 text-sm text-muted-foreground">진행 중인 건이 없어요.</p>}
            {active.cases.map((c) => (
              <Link
                key={c.id}
                href={caseHref(c)}
                className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0 hover:bg-subtle/60"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <CaseCode code={c.code} className="text-[15px]" />
                  <span className="truncate text-[13px] text-muted-foreground">
                    남은 일 {c.remaining}
                    {c.dueDate ? ` · 기한 ${formatMD(c.dueDate)}` : ""}
                  </span>
                </span>
                <StatusPill status={c.status} />
              </Link>
            ))}
          </Card>

          <section className="flex flex-col gap-1 rounded-[14px] border border-warning-border/60 bg-warning-soft/50 px-[22px] py-5">
            <CardHeader
              title="중요 사항 · 챙길 일"
              description="받는 사람이 꼭 알아야 할 것"
              action={
                !readOnlySummary && (
                  <Button variant="outline" onClick={() => setNoteDialog({ open: true, title: "" })}>
                    + 추가
                  </Button>
                )
              }
            />
            {notes.length === 0 && <p className="py-3 text-sm text-muted-foreground">아직 적은 내용이 없어요.</p>}
            {notes.map((n) => {
              const done = demo.handoverNoteDone[n.id] ?? n.done;
              return (
                <div key={n.id} className="flex items-center gap-3 border-b border-warning-border/40 py-3.5 last:border-b-0">
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={done} onChange={() => demo.toggleHandoverNote(n.id)} className="peer sr-only" />
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30",
                        done ? "border-primary bg-primary" : "border-field-border bg-background",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {done && <img src="/figma/check-white.svg" alt="" width={14} height={14} className="size-3.5" />}
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className={cn("text-[15px] font-semibold", done ? "text-muted-foreground line-through" : "text-foreground")}>
                        {n.title}
                      </span>
                      <span className="text-[13px] text-muted-foreground">{n.sub}</span>
                    </span>
                  </label>
                  {!readOnlySummary && (
                    <button
                      type="button"
                      onClick={() => setNoteDialog({ open: true, id: n.id, title: n.title })}
                      className="px-3 text-sm font-semibold text-primary hover:underline"
                    >
                      수정
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        </div>

        <Card className="flex w-[300px] shrink-0 flex-col gap-1">
          <CardHeader title={`근거 메일 · ${active.shipper.name}`} />
          {active.mails.length === 0 && <p className="py-3 text-sm text-muted-foreground">연결된 메일이 없어요.</p>}
          {active.mails.map((m) => {
            const href = evidenceRefHref(m.evidence);
            const body = (
              <>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[15px] font-semibold text-foreground">{m.subject}</span>
                  <span className="text-[13px] text-muted-foreground">{formatMMDD(m.receivedAt)}</span>
                </span>
                {href && <span className="text-sm font-semibold text-primary">↗</span>}
              </>
            );
            return href ? (
              <Link key={m.id} href={href} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0 hover:bg-subtle/60">
                {body}
              </Link>
            ) : (
              <div key={m.id} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
                {body}
              </div>
            );
          })}
        </Card>
      </div>

      <TextEditDialog
        open={summaryDialog}
        onOpenChange={setSummaryDialog}
        title={`화주 요약 수정 · ${active.shipper.name}`}
        description="자동 정리된 요약을 받는 사람이 읽기 좋게 고쳐 주세요"
        initial={
          summaryText ??
          [`거래: ${s.trade}`, `반복 조건: ${s.patterns}`, s.latestChange && `최근 변경: ${s.latestChange}`, s.caution && `주의: ${s.caution}`]
            .filter(Boolean)
            .join("\n")
        }
        multiline
        onSave={(text) => demo.saveHandoverSummary(active.shipper.id, text)}
      />
      <TextEditDialog
        open={noteDialog.open}
        onOpenChange={(open) => setNoteDialog((d) => ({ ...d, open }))}
        title={noteDialog.id ? "챙길 일 수정" : "중요 사항 · 챙길 일 추가"}
        description={`${active.shipper.name} · 메모처럼 적어 두면 받는 사람에게 그대로 보여요`}
        initial={noteDialog.title}
        placeholder="예: 창고 변경 여부 전화로 확인"
        onSave={(title) => demo.saveHandoverNote({ id: noteDialog.id, shipperId: active.shipper.id, title })}
      />
    </>
  );
}

function SummaryRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("text-[15px] font-semibold", danger ? "text-danger" : "text-foreground")}>{value}</dd>
    </div>
  );
}
