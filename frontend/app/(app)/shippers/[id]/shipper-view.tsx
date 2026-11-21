"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { ProgressSteps } from "@/components/app/progress-steps";
import { Pill, StatusPill } from "@/components/app/status-pill";
import { TextEditDialog } from "@/components/app/text-edit-dialog";
import type { ShipperDetail } from "@syncargo/backend/data";
import { demoNow, useDemoState } from "@/lib/demo-state";
import { formatMD, formatMDW, formatMMDD } from "@/lib/date";
import { TRADE_TYPE_LABEL } from "@/lib/labels";
import { caseHref, evidenceRefHref } from "@/lib/links";

type PatternRow = {
  id: string;
  text: string;
  suggested: boolean;
  note: string | null;
  confirmedLabel: string | null;
  evidenceHref: string | null;
};

/** W-03 화주 카드 */
export function ShipperView({ detail, userName }: { detail: ShipperDetail; userName: string }) {
  const { shipper, owner, activeCases, doneCaseCount, changes } = detail;
  const demo = useDemoState();
  const savedMemo = demo.shipperMemos[shipper.id];
  const [memo, setMemo] = useState(savedMemo?.text ?? shipper.memo);
  const [dialog, setDialog] = useState<{ open: boolean; pattern: PatternRow | null }>({ open: false, pattern: null });

  const memoMeta = savedMemo
    ? `${formatMD(savedMemo.savedAt)} · ${userName}`
    : shipper.memoUpdatedAt
      ? `${formatMD(shipper.memoUpdatedAt)} · ${detail.memoUpdatedByName}`
      : "아직 메모가 없어요";
  const memoDirty = memo !== (savedMemo?.text ?? shipper.memo);

  // 반복 조건: 서버 값 + 세션에서 "맞아요"·수정·추가한 값
  const patterns: PatternRow[] = [
    ...detail.patterns.map((p) => {
      const confirmedNow = demo.confirmedPatternIds.includes(p.id);
      const suggested = p.status === "suggested" && !confirmedNow;
      return {
        id: p.id,
        text: demo.patternTexts[p.id] ?? p.text,
        suggested,
        note: p.note,
        confirmedLabel: suggested
          ? null
          : confirmedNow
            ? `${formatMD(demoNow())} · ${userName}`
            : `${formatMD(p.confirmedAt!)} · ${p.confirmedByName}`,
        evidenceHref: evidenceRefHref(p.evidence),
      };
    }),
    ...demo.addedPatterns
      .filter((p) => p.shipperId === shipper.id)
      .map((p) => ({
        id: p.id,
        text: p.text,
        suggested: false,
        note: null,
        confirmedLabel: `${formatMD(p.createdAt)} · ${userName} · 직접 추가`,
        evidenceHref: null,
      })),
  ].sort((a, b) => Number(b.suggested) - Number(a.suggested));

  const resolvedSuggestions = detail.patterns.filter(
    (p) => p.status === "suggested" && demo.confirmedPatternIds.includes(p.id),
  ).length;
  const attention = detail.attentionCount - resolvedSuggestions;

  const confirm = (p: PatternRow) =>
    demo.confirmPattern(p.id, {
      kind: "pattern",
      label: "반복 조건 확인 (맞아요)",
      before: "확인 필요",
      after: p.text,
      targetLabel: shipper.name,
      mailId: null,
      correctedByName: userName,
    });

  return (
    <>
      <Card className="flex gap-6 p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h1 className="text-[30px] font-bold text-foreground">{shipper.name}</h1>
            <Button variant="outline" asChild>
              <Link href="/handover">이 화주 인계</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              `${TRADE_TYPE_LABEL[shipper.tradeType]} · ${shipper.route}`,
              `담당 ${owner.name}`,
              shipper.lastReviewedAt ? `최종 확인 ${shipper.lastReviewedAt}` : null,
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="rounded-full bg-stat px-3 py-1.5 text-[13px] text-ink-2">
                  {t}
                </span>
              ))}
          </div>
          <div className="flex gap-2.5">
            <Stat label="지금 챙길 것" value={attention} tone="red" />
            <Stat label="진행 중" value={activeCases.length} tone="gray" />
            <Stat label="완료" value={doneCaseCount} tone="green" />
          </div>
        </div>

        <form
          className="flex w-[420px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-subtle p-4"
          onSubmit={(e) => {
            e.preventDefault();
            demo.saveShipperMemo(shipper.id, memo);
          }}
        >
          <div className="flex items-center justify-between">
            <label htmlFor="shipper-memo" className="text-sm font-bold text-foreground">
              화주 메모
            </label>
            <span className="text-xs text-muted-foreground">{memoMeta}</span>
          </div>
          <textarea
            id="shipper-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="min-h-24 w-full resize-none rounded-lg border border-field-border bg-background px-3 py-2.5 text-sm leading-[1.6] text-foreground outline-none focus:border-primary"
          />
          <div className="flex items-center justify-end gap-2">
            {savedMemo && !memoDirty && <span className="text-xs font-semibold text-success">저장됨</span>}
            <Button type="submit" disabled={!memoDirty}>
              메모 저장
            </Button>
          </div>
        </form>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">진행 중인 건</h2>
            <span className="text-sm font-semibold text-muted-foreground">{activeCases.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <Legend color="bg-primary" label="지난 단계" />
            <Legend color="bg-brand-muted" label="지금 단계" />
            <Legend color="bg-border" label="남은 단계" />
            <Link
              href={`/cases?tab=done&shipper=${encodeURIComponent(shipper.id)}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              지난 건 보기 · 완료 {doneCaseCount}건 →
            </Link>
          </div>
        </div>
        {activeCases.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">진행 중인 건이 없어요.</Card>
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {activeCases.map((c) => {
              const alert = c.status === "needs_check";
              return (
                <Link
                  key={c.id}
                  href={caseHref(c)}
                  className={cn(
                    "flex flex-col gap-3.5 rounded-[14px] border bg-card p-[18px] transition-shadow hover:shadow-md",
                    alert ? "border-danger-border" : "border-border",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <CaseCode code={c.code} className="text-[15px]" />
                      <span className="text-[13px] text-muted-foreground">{c.stateSummary}</span>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  <ProgressSteps size="sm" stage={c.stage} alert={alert} />
                  {c.nextDeadline && (
                    <div className="flex items-center justify-between border-t border-divider pt-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">다음 기한</span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatMDW(c.nextDeadline.date)} {c.nextDeadline.label}
                          {c.stage === "arrival" && c.nextDeadline.label === "도착" ? " 예정" : ""}
                        </span>
                      </div>
                      <DdayBadge date={c.nextDeadline.date} variant="text" />
                    </div>
                  )}
                  {c.issue && (
                    <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-[13px] leading-normal font-medium text-danger-ink">{c.issue}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-1">
          <CardHeader
            title="반복 조건 · 주의사항"
            description="메일에서 정리한 내용 · 언제든 고칠 수 있어요"
            action={
              <Button variant="outline" onClick={() => setDialog({ open: true, pattern: null })}>
                + 직접 추가
              </Button>
            }
          />
          {patterns.map((p) =>
            p.suggested ? (
              <div key={p.id} className="my-1 flex items-center gap-3 rounded-[10px] bg-danger-soft p-3.5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground">{p.text}</span>
                    <Pill tone="red">확인 필요</Pill>
                  </div>
                  {p.note && <span className="text-[13px] text-danger-ink">{p.note}</span>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button onClick={() => confirm(p)}>맞아요</Button>
                  <Button variant="outline" onClick={() => setDialog({ open: true, pattern: p })}>
                    수정
                  </Button>
                  {p.evidenceHref && (
                    <Link href={p.evidenceHref} className="text-[13px] font-semibold text-danger-ink hover:underline">
                      근거 ↗
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-medium text-foreground">{p.text}</span>
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-semibold text-success">확인됨</span> · {p.confirmedLabel}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.evidenceHref && (
                    <Link href={p.evidenceHref} className="text-[13px] font-semibold text-primary hover:underline">
                      근거 ↗
                    </Link>
                  )}
                  <Button variant="outline" onClick={() => setDialog({ open: true, pattern: p })}>
                    수정
                  </Button>
                </div>
              </div>
            ),
          )}
        </Card>

        <Card className="flex w-[440px] shrink-0 flex-col gap-1">
          <CardHeader title="변경 이력" description="조건이 바뀐 날짜와 근거" />
          <ol className="mt-2 flex flex-col">
            {changes.map((ch, i) => {
              const last = i === changes.length - 1;
              const open = ch.status === "needs_check";
              return (
                <li key={ch.id} className="flex gap-3.5">
                  <div className="flex w-3.5 shrink-0 flex-col items-center gap-1.5 pt-[5px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={open ? "/figma/dot-red.svg" : "/figma/dot-hollow.svg"} alt="" width={12} height={12} className="size-3" />
                    {!last && <span className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", last ? "pb-1" : "pb-[18px]")}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-medium text-muted-foreground">{formatMMDD(ch.at)}</span>
                      {open && <Pill tone="red">확인 필요</Pill>}
                    </div>
                    <span className="text-[15px] font-semibold text-foreground">{ch.title}</span>
                    {ch.before && ch.after && (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{ch.before}</span>
                        <span className="text-faint">→</span>
                        <span className="font-bold text-foreground">{ch.after}</span>
                      </span>
                    )}
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{ch.sourceLabel}</span>
                      {ch.evidence && (
                        <Link href={evidenceRefHref(ch.evidence)!} className="font-semibold text-primary hover:underline">
                          근거 ↗
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <TextEditDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        title={dialog.pattern ? "반복 조건 수정" : "반복 조건 직접 추가"}
        description={`${shipper.name} · 고친 내용은 검토함 > 수정 이력에 남아요`}
        initial={dialog.pattern?.text ?? ""}
        placeholder="예: 서류 마감 하루 전에 재확인 전화"
        onSave={(text) =>
          demo.savePattern(
            { id: dialog.pattern?.id, shipperId: shipper.id, text },
            {
              kind: "pattern",
              label: dialog.pattern ? "반복 조건 수정" : "반복 조건 직접 추가",
              before: dialog.pattern?.text ?? null,
              after: text,
              targetLabel: shipper.name,
              mailId: null,
              correctedByName: userName,
            },
          )
        }
      />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "red" | "gray" | "green" }) {
  const style = {
    red: ["bg-danger-soft", "text-danger-ink", "text-danger"],
    gray: ["bg-stat", "text-neutral", "text-foreground"],
    green: ["bg-success-soft", "text-success", "text-success"],
  }[tone];
  return (
    <div className={cn("flex flex-1 flex-col gap-0.5 rounded-[10px] px-3.5 py-3", style[0])}>
      <span className={cn("text-xs font-semibold", style[1])}>{label}</span>
      <span className={cn("flex items-baseline gap-0.5", style[2])}>
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm font-semibold">건</span>
      </span>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-1.5 w-4 rounded-[3px]", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </span>
  );
}
