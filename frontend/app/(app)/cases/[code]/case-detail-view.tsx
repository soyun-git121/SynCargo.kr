"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ListItem } from "@/components/app/card";
import { DdayBadge } from "@/components/app/dday-badge";
import { ProgressSteps } from "@/components/app/progress-steps";
import { StatusPill } from "@/components/app/status-pill";
import { Timeline, type TimelineEntry } from "@/components/app/timeline";
import type { CaseDetail } from "@syncargo/backend/data";
import { useDemoState } from "@/lib/demo-state";
import { daysUntil, formatMD, formatMDW } from "@/lib/date";
import { CASE_KIND_LABEL, NO_CODE_LABEL, OFF_MAIL_SOURCE_LABEL, STAGES, TRADE_TYPE_LABEL } from "@/lib/labels";
import { evidenceHref, reviewHref, shipperHref } from "@/lib/links";
import type { OffMailInfo } from "@syncargo/backend/types";
import { OffMailDialog } from "./off-mail-dialog";

const offMailTitle = (o: OffMailInfo) => `${o.field} ${o.value}`.trim();

/** W-05 건 상세 (+ W-06 메일 밖 정보 입력 모달) */
export function CaseDetailView({
  detail,
  itemIdByMail,
  userId,
}: {
  detail: CaseDetail;
  /** 첨부 "열기"가 원문 보기의 어떤 항목으로 갈지 */
  itemIdByMail: Record<string, string>;
  userId: string;
}) {
  const { case: c, events, attachments } = detail;
  const { savedOffMail, openReviews } = useDemoState();
  const [dialog, setDialog] = useState<{ open: boolean; editing: OffMailInfo | null }>({ open: false, editing: null });

  // 메일 밖 정보: 서버 값 + 이번 세션에서 입력·수정한 값
  const offMail = [
    ...Object.values(savedOffMail).filter((o) => o.caseId === c.id && !detail.offMailInfos.some((s) => s.id === o.id)),
    ...detail.offMailInfos.map((o) => savedOffMail[o.id] ?? o),
  ].sort((a, b) => (a.confirmedAt < b.confirmedAt ? 1 : -1));
  const offMailById = new Map(offMail.map((o) => [o.id, o]));

  const openReviewIds = new Set(openReviews.map((r) => r.id));
  const caseLabel = c.code ?? `${c.shipperName} ${CASE_KIND_LABEL[c.kind]}`;
  const stageNo = STAGES.findIndex((s) => s.key === c.stage) + 1;
  const deadline = c.nextDeadline;
  const urgent = deadline ? daysUntil(deadline.date) <= 2 : false;

  const edit = (o: OffMailInfo) => setDialog({ open: true, editing: o });
  const editButton = (o: OffMailInfo) => (
    <Button variant="outline" onClick={() => edit(o)}>
      수정
    </Button>
  );

  // 타임라인: 서버 이벤트 + 세션에서 새로 입력한 메일 밖 정보, 오래된 순
  const entries: (TimelineEntry & { at: string })[] = events.map((e) => {
    const off = e.offMailInfoId ? offMailById.get(e.offMailInfoId) : undefined;
    let action: React.ReactNode = null;
    if (e.kind === "issue" && e.reviewItemId) {
      action = openReviewIds.has(e.reviewItemId) ? (
        <Button variant="outline" asChild>
          <Link href={reviewHref("links", e.reviewItemId)}>검토함에서 확인 →</Link>
        </Button>
      ) : (
        <span className="text-[13px] font-semibold text-success">검토 완료</span>
      );
    } else if (off) {
      action = editButton(off);
    } else if (e.extractedItemId) {
      action = (
        <Link href={evidenceHref(c, e.extractedItemId)} className="text-[13px] font-semibold text-primary hover:underline">
          원문 ↗
        </Link>
      );
    }
    return {
      id: e.id,
      at: e.at,
      kind: e.kind,
      title: off ? offMailTitle(off) : e.title,
      meta: `${formatMD(e.at)} · ${off ? `${OFF_MAIL_SOURCE_LABEL[off.source]} · 직접 입력` : e.actorLabel}`,
      action,
    };
  });
  // 이번 세션에서 새로 입력한 메일 밖 정보는 타임라인에도 바로 보이게
  for (const o of offMail) {
    if (detail.offMailInfos.some((s) => s.id === o.id)) continue;
    entries.push({
      id: o.id,
      at: o.createdAt,
      kind: "off_mail",
      title: offMailTitle(o),
      meta: `${formatMD(o.createdAt)} · ${OFF_MAIL_SOURCE_LABEL[o.source]} · 직접 입력`,
      action: editButton(o),
    });
  }
  entries.sort((a, b) => (a.at < b.at ? -1 : 1));

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {c.code ? (
            <h1 className="font-mono text-[28px] font-semibold text-foreground">{c.code}</h1>
          ) : (
            <h1 className="text-[26px] font-bold text-foreground">
              {NO_CODE_LABEL} <span className="text-muted-foreground">· {CASE_KIND_LABEL[c.kind]}</span>
            </h1>
          )}
          <Link href={shipperHref(c.shipperId)} className="text-base font-semibold text-primary hover:underline">
            {c.shipperName} ↗
          </Link>
          <StatusPill status={c.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={evidenceHref(c)}>원문 보기</Link>
          </Button>
          <Button onClick={() => setDialog({ open: true, editing: null })}>+ 메일 밖 정보 입력</Button>
        </div>
      </div>

      <Card className="flex flex-col gap-[18px]">
        <CardHeader
          title="진행 단계"
          description={`${TRADE_TYPE_LABEL[c.tradeType]} · ${c.route} · 5단계 중 ${stageNo}단계`}
          action={
            deadline && (
              <>
                <span className="text-sm font-medium text-ink-2">{deadline.label}까지</span>
                <DdayBadge date={deadline.date} />
              </>
            )
          }
        />
        <ProgressSteps stage={c.stage} alert={c.status === "needs_check"} done={c.status === "done"} />
      </Card>

      <div className="flex gap-3">
        <SummaryTile label="현재 상태" value={c.stateSummary} sub={c.stateNote} />
        <SummaryTile
          label="다음 기한"
          value={deadline ? `${formatMDW(deadline.date)} ${deadline.label}` : "없음"}
          sub={deadline?.detail ?? "—"}
          tone={urgent ? "red" : "white"}
        />
        <SummaryTile label="다음 행동" value={c.nextAction ?? "—"} sub="자동 정리 · 고칠 수 있어요" />
      </div>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-1">
          <CardHeader title="변경 타임라인" description="메일과 직접 입력에서 모은 변화 · 오래된 순" />
          <Timeline entries={entries} />
        </Card>

        <div className="flex w-[400px] shrink-0 flex-col gap-5">
          <Card className="flex flex-col gap-2">
            <CardHeader title="첨부" count={attachments.length} />
            {attachments.length === 0 && <p className="py-3 text-sm text-muted-foreground">첨부가 없어요.</p>}
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{a.docType}</span>
                  {a.note && (
                    <span className={cn("truncate text-xs", a.note.tone === "danger" ? "text-danger" : "text-muted-foreground")}>
                      {a.note.text}
                    </span>
                  )}
                </div>
                <Link
                  href={evidenceHref(c, itemIdByMail[a.mailId])}
                  title={a.fileName}
                  className="shrink-0 text-[13px] font-semibold text-primary hover:underline"
                >
                  열기 ↗
                </Link>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-1">
            <CardHeader
              title="메일 밖 정보"
              description="메일에 없는 정보 · 출처와 함께"
              action={
                <Button variant="outline" onClick={() => setDialog({ open: true, editing: null })}>
                  + 입력
                </Button>
              }
            />
            {offMail.length === 0 && <p className="py-3 text-sm text-muted-foreground">아직 입력한 정보가 없어요.</p>}
            {offMail.map((o) => (
              <ListItem
                key={o.id}
                title={offMailTitle(o)}
                subtitle={`출처 ${OFF_MAIL_SOURCE_LABEL[o.source]} · ${formatMD(o.confirmedAt)} 확인`}
                action={
                  <button onClick={() => edit(o)} className="text-[13px] font-semibold text-primary hover:underline">
                    수정
                  </button>
                }
              />
            ))}
          </Card>
        </div>
      </div>

      <OffMailDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        caseId={c.id}
        caseLabel={caseLabel}
        editing={dialog.editing}
        userId={userId}
      />
    </>
  );
}

function SummaryTile({
  label,
  value,
  sub,
  tone = "white",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "white" | "red";
}) {
  const red = tone === "red";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1 rounded-xl border px-4 py-3.5",
        red ? "border-danger-border bg-danger-soft" : "border-border bg-card",
      )}
    >
      <p className={cn("text-xs font-medium", red ? "text-danger-ink" : "text-muted-foreground")}>{label}</p>
      <p className={cn("truncate text-[17px] font-bold", red ? "text-danger" : "text-foreground")}>{value}</p>
      <p className={cn("truncate text-xs", red ? "text-danger-ink" : "text-muted-foreground")}>{sub}</p>
    </div>
  );
}
