"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { ActiveCaseCard } from "@/components/app/active-case-card";
import { Pill } from "@/components/app/status-pill";
import { TextEditDialog } from "@/components/app/text-edit-dialog";
import type { ShipperDetail } from "@syncargo/backend/data";
import { demoNow, useDemoState } from "@/lib/demo-state";
import { formatMD, formatMMDD } from "@/lib/date";
import { TRADE_TYPE_LABEL } from "@/lib/labels";
import { caseHref, casesHref, evidenceRefHref, handoverNewHref, reviewHref } from "@/lib/links";

type PatternRow = {
  id: string;
  text: string;
  suggested: boolean;
  note: string | null;
  confirmedLabel: string | null;
  evidenceHref: string | null;
};

/** W-03 화주 카드 */
export function ShipperView({
  detail,
  userName,
  focusCheck = false,
}: {
  detail: ShipperDetail;
  userName: string;
  /** 화주 목록의 '확인 필요' 배지로 들어옴 → 확인 항목을 맨 위에 펼침 */
  focusCheck?: boolean;
}) {
  const { shipper, owner, activeCases, doneCaseCount, changes } = detail;
  const demo = useDemoState();
  const fromShipper = { kind: "shipper", id: shipper.id } as const;
  const savedMemo = demo.shipperMemos[shipper.id];
  const [memo, setMemo] = useState(savedMemo?.text ?? shipper.memo);
  const [dialog, setDialog] = useState<{ open: boolean; pattern: PatternRow | null }>({ open: false, pattern: null });
  const [changeDialog, setChangeDialog] = useState<{ open: boolean; change: Change | null }>({ open: false, change: null });
  const [checkOpen, setCheckOpen] = useState(focusCheck);
  const [showAllChanges, setShowAllChanges] = useState(false);

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
        evidenceHref: evidenceRefHref(p.evidence, fromShipper),
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

  const resolvedSuggestions =
    detail.patterns.filter((p) => p.status === "suggested" && demo.confirmedPatternIds.includes(p.id)).length +
    changes.filter((ch) => ch.status === "needs_check" && demo.confirmedChangeIds.includes(ch.id)).length;
  const attention = detail.attentionCount - resolvedSuggestions;

  const changeOpen = (ch: Change) => ch.status === "needs_check" && !demo.confirmedChangeIds.includes(ch.id);
  const changeAfterText = (ch: Change) => demo.changeAfter[ch.id] ?? ch.after;
  const confirmChange = (ch: Change, after: string | null) =>
    demo.confirmChange(ch.id, after, {
      kind: "value",
      label: after !== null ? `변경 수정: ${ch.title}` : `변경 확정: ${ch.title}`,
      before: ch.before,
      after: after ?? ch.after,
      targetLabel: shipper.name,
      mailId: ch.mailId,
      correctedByName: userName,
    });

  // 확인할 것: 확인 필요 반복 조건 + 확정 안 된 변경 + 확인 필요 건
  const checkPatterns = patterns.filter((p) => p.suggested);
  const checkChanges = changes.filter(changeOpen);
  const checkCases = activeCases.filter(
    (c) => c.status === "needs_check" && c.issue && !(c.reviewItemId && demo.reviewDecisions[c.reviewItemId]),
  );
  const checkCount = checkPatterns.length + checkChanges.length + checkCases.length;
  const visibleChanges = showAllChanges ? changes : changes.slice(0, 3);

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
              <Link href={handoverNewHref([shipper.id])}>이 화주 인계</Link>
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

      {checkOpen && checkCount > 0 && (
        <section className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-danger-strong bg-card p-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{shipper.name}에서 확인할 것</h2>
              <Pill tone="red">{checkCount}건</Pill>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">화주 목록의 ‘확인 필요’에서 들어와 먼저 펼쳤어요</span>
              <button type="button" onClick={() => setCheckOpen(false)} className="font-semibold text-primary hover:underline">
                접기
              </button>
            </div>
          </div>
          {checkPatterns.map((p) => (
            <CheckRow
              key={p.id}
              tag="반복 조건"
              title={p.text}
              sub={p.note}
              actions={
                <>
                  <Button onClick={() => confirm(p)}>맞아요</Button>
                  <Button variant="outline" onClick={() => setDialog({ open: true, pattern: p })}>
                    수정
                  </Button>
                  {p.evidenceHref && <EvidenceLink href={p.evidenceHref} />}
                </>
              }
            />
          ))}
          {checkChanges.map((ch) => (
            <CheckRow
              key={ch.id}
              tag="변경"
              title={ch.before && ch.after ? `${ch.title.replace(/ 요청$/, "")} ${ch.before} → ${changeAfterText(ch)} 요청` : ch.title}
              sub={`${formatMMDD(ch.at)} · 아직 확정 안 됨`}
              actions={
                <>
                  <Button onClick={() => confirmChange(ch, null)}>확정</Button>
                  <Button variant="outline" onClick={() => setChangeDialog({ open: true, change: ch })}>
                    수정
                  </Button>
                  {ch.evidence && <EvidenceLink href={evidenceRefHref(ch.evidence, fromShipper)!} />}
                </>
              }
            />
          ))}
          {checkCases.map((c) => (
            <CheckRow
              key={c.id}
              tag={c.code ?? "번호 없음"}
              mono
              title={c.issue!}
              sub={[
                c.issueAt ? `${formatMMDD(c.issueAt)} 자동 발견` : null,
                c.nextDeadline ? `${c.nextDeadline.label} ${formatMMDD(c.nextDeadline.date)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <Button variant="outline" asChild>
                  <Link href={c.reviewItemId ? reviewHref("links", c.reviewItemId) : caseHref(c)}>
                    {c.reviewItemId ? "검토함에서 확인 →" : "건 상세에서 확인 →"}
                  </Link>
                </Button>
              }
            />
          ))}
        </section>
      )}

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
              href={casesHref({ shipper: shipper.id, status: "done" })}
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
            {activeCases.map((c) => (
              <ActiveCaseCard key={c.id} c={c} href={caseHref(c)} />
            ))}
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
          <CardHeader
            title="변경 이력"
            description="조건이 바뀐 날짜와 근거"
            action={
              changes.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllChanges((v) => !v)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  {showAllChanges ? "접기" : `전체 보기 · ${changes.length}건 →`}
                </button>
              )
            }
          />
          <ol className="mt-2 flex flex-col">
            {visibleChanges.map((ch, i) => {
              const last = i === visibleChanges.length - 1;
              const open = changeOpen(ch);
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
                        <span className="font-bold text-foreground">{changeAfterText(ch)}</span>
                      </span>
                    )}
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{open ? "아직 확정 안 됨" : ch.sourceLabel}</span>
                      {ch.evidence && (
                        <Link href={evidenceRefHref(ch.evidence, fromShipper)!} className="font-semibold text-primary hover:underline">
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
        open={changeDialog.open}
        onOpenChange={(open) => setChangeDialog((d) => ({ ...d, open }))}
        title={changeDialog.change ? `변경 수정 · ${changeDialog.change.title}` : "변경 수정"}
        description={`${shipper.name} · 바뀐 값을 고치면 확정되고 수정 이력에 남아요`}
        initial={changeDialog.change ? (changeAfterText(changeDialog.change) ?? "") : ""}
        placeholder="예: 45일"
        onSave={(text) => changeDialog.change && confirmChange(changeDialog.change, text)}
      />

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

type Change = ShipperDetail["changes"][number];

function CheckRow({
  tag,
  mono,
  title,
  sub,
  actions,
}: {
  tag: string;
  mono?: boolean;
  title: string;
  sub?: string | null;
  actions: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-danger-border bg-danger-row px-3.5 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn("shrink-0 rounded-full bg-stat px-2.5 py-1 text-[11px] font-semibold text-ink-2", mono && "font-mono")}>
            {tag}
          </span>
          <span className="truncate text-[15px] font-semibold text-foreground">{title}</span>
        </div>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}

function EvidenceLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-[13px] font-semibold text-primary hover:underline">
      근거 ↗
    </Link>
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
