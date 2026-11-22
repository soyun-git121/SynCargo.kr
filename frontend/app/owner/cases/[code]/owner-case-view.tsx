"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ListItem } from "@/components/app/card";
import { FlowArrow, FlowTile } from "@/components/app/flow-tile";
import { ProgressSteps } from "@/components/app/progress-steps";
import { Pill, StatusPill, type PillTone } from "@/components/app/status-pill";
import type { CaseDetail } from "@syncargo/backend/data";
import type { CaseEventKind } from "@syncargo/backend/types";
import { daysUntil, ddayLabel, formatMD, formatMDW } from "@/lib/date";
import { CASE_KIND_LABEL, EVENT_KIND_LABEL, NO_CODE_LABEL, OFF_MAIL_SOURCE_LABEL, STAGES, TRADE_TYPE_LABEL } from "@/lib/labels";
import { ownerShipperHref } from "@/lib/links";

const TONE: Record<CaseEventKind, PillTone> = { request: "blue", reply: "gray", confirm: "green", issue: "red", off_mail: "yellow" };
const DOT: Record<CaseEventKind, string> = {
  request: "dot-blue",
  reply: "dot-gray",
  confirm: "dot-green",
  issue: "dot-red",
  off_mail: "dot-yellow",
};

/** R-06 건 상세 (열람): 맨 위에 현재 상황 → 왜 막혔나 → 지금 누가 무엇을 해야 하나 */
export function OwnerCaseView({ detail }: { detail: CaseDetail }) {
  const { case: c, owner, events, attachments, offMailInfos, extractedItems } = detail;
  const [openQuote, setOpenQuote] = useState<string | null>(null);
  const [shareRequested, setShareRequested] = useState(false);

  const deadline = c.nextDeadline;
  const urgent = deadline ? daysUntil(deadline.date) <= 2 : false;
  const stageNo = STAGES.findIndex((s) => s.key === c.stage) + 1;
  const issue = events.find((e) => e.kind === "issue");
  const stopped = c.blocked ? -daysUntil(c.blocked.since) : null;
  const hour = deadline?.detail?.match(/(\d{1,2}시)/)?.[1];
  const itemById = new Map(extractedItems.map((x) => [x.id, x]));
  const why = c.blocked?.reason ?? issue?.title ?? c.need?.title ?? "막힌 일 없음";

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
          {deadline && (
            <span
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold",
                urgent ? "bg-danger-soft text-danger" : "bg-neutral-soft text-neutral",
              )}
            >
              <span className="font-mono">{ddayLabel(deadline.date)}</span>
              {formatMDW(deadline.date)} {deadline.label}
            </span>
          )}
          <Link href={ownerShipperHref(c.shipperId)} className="text-base font-semibold text-primary hover:underline">
            {c.shipperName} ↗
          </Link>
          <StatusPill status={c.status} />
          <Pill tone="gray">열람 전용</Pill>
        </div>
        <Button variant="outline" disabled={shareRequested} onClick={() => setShareRequested(true)}>
          {shareRequested ? `${owner.name}에게 요청함` : "원문 공유 요청"}
        </Button>
      </div>

      <div className="flex items-stretch gap-2">
        <FlowTile no={1} label="현재 상황" value={c.stateSummary} sub={c.stateNote} />
        <FlowArrow />
        <FlowTile
          no={2}
          label="왜 막혔나"
          value={why}
          sub={[
            issue ? `${formatMD(issue.at)} 자동 발견` : c.blocked ? `${formatMD(c.blocked.since)}부터` : null,
            stopped !== null ? `${stopped}일째 멈춤` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "—"}
          tone={c.blocked || c.status === "needs_check" ? "red" : "white"}
        />
        <FlowArrow />
        <FlowTile
          no={3}
          label="지금 누가 무엇을"
          value={
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-avatar text-[10px] font-bold text-primary">
                  {owner.name.slice(0, 1)}
                </span>
                {owner.name} (담당)
              </span>
              <span className="truncate">{c.nextAction ?? "—"}</span>
            </span>
          }
          sub={deadline ? `${formatMD(deadline.date)}${hour ? ` ${hour}` : ""} ${deadline.label} 전까지` : "—"}
          tone="blue"
        />
      </div>

      <div className="flex items-center gap-3.5 rounded-xl bg-brand-soft px-[18px] py-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/figma/lock.svg" alt="" width={22} height={22} className="size-[22px]" />
        <div className="flex flex-col gap-0.5">
          <p className="text-[15px] font-bold text-primary">메일 원문은 담당자만 봐요</p>
          <p className="text-[13px] leading-normal text-ink-2">
            대표 화면에서는 AI가 정리한 요약과 근거가 된 문장만 보여요. 원문이 꼭 필요하면 담당자({owner.name})에게 공유를 요청하세요.
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-[18px]">
        <CardHeader title="진행 단계" description={`${TRADE_TYPE_LABEL[c.tradeType]} · ${c.route} · 5단계 중 ${stageNo}단계`} />
        <ProgressSteps stage={c.stage} alert={c.status === "needs_check"} done={c.status === "done"} />
      </Card>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-1">
          <CardHeader title="변경 타임라인" description="요약과 근거 문장 · 오래된 순" />
          <ol className="flex flex-col">
            {events.map((e, i) => {
              const last = i === events.length - 1;
              const isIssue = e.kind === "issue";
              const item = e.extractedItemId ? itemById.get(e.extractedItemId) : undefined;
              const off = e.offMailInfoId ? offMailInfos.find((o) => o.id === e.offMailInfoId) : undefined;
              const open = openQuote === e.id;
              return (
                <li key={e.id} className="flex gap-3.5">
                  <div className="flex w-3.5 shrink-0 flex-col items-center gap-1.5 pt-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/figma/${DOT[e.kind]}.svg`} alt="" width={12} height={12} className="size-3 shrink-0" />
                    {!last && <span className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className={cn("flex min-w-0 flex-1 flex-col gap-2 py-3", isIssue && "my-1 rounded-[10px] bg-danger-soft px-3")}>
                    <div className="flex items-start gap-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Pill tone={TONE[e.kind]}>{EVENT_KIND_LABEL[e.kind]}</Pill>
                          <p className="truncate text-[15px] font-semibold text-foreground">{off ? `${off.field} ${off.value}` : e.title}</p>
                        </div>
                        <p className={cn("text-[13px]", isIssue ? "text-danger-ink" : "text-muted-foreground")}>
                          {formatMD(e.at)} ·{" "}
                          {off
                            ? `${OFF_MAIL_SOURCE_LABEL[off.source]} · 직접 입력`
                            : isIssue
                              ? `${e.actorLabel} · 담당자 확인 중`
                              : e.actorLabel}
                        </p>
                      </div>
                      {item && (
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenQuote(open ? null : e.id)}
                          className="shrink-0 text-[13px] font-semibold text-primary hover:underline"
                        >
                          {open ? "근거 문장 접기" : "근거 문장 ▾"}
                        </button>
                      )}
                    </div>
                    {open && item && (
                      <div className="flex flex-col gap-1 rounded-lg border-l-4 border-warning-border bg-warning-soft px-3.5 py-3">
                        <p className="text-[15px] leading-normal font-medium text-foreground">“…{item.evidence.text}”</p>
                        <p className="text-xs font-semibold text-warning">
                          근거 문장 · {formatMD(item.extractedAt)} {e.actorLabel} 메일
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="flex w-[400px] shrink-0 flex-col gap-5">
          <Card className="flex flex-col gap-2">
            <CardHeader title="첨부" count={attachments.length} description="담당자가 공유하면 열 수 있어요" />
            {attachments.length === 0 && <p className="py-3 text-sm text-muted-foreground">첨부가 없어요.</p>}
            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm font-semibold text-foreground">{a.docType}</span>
                <span className="text-xs text-muted-foreground">공유 전</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-1">
            <CardHeader title="메일 밖 정보" description="담당자가 출처와 함께 남긴 정보" />
            {offMailInfos.length === 0 && <p className="py-3 text-sm text-muted-foreground">남긴 정보가 없어요.</p>}
            {offMailInfos.map((o) => (
              <ListItem
                key={o.id}
                title={`${o.source === "phone" ? "전화: " : ""}${o.field} ${o.value}`}
                subtitle={`출처 ${OFF_MAIL_SOURCE_LABEL[o.source]} · ${formatMD(o.confirmedAt)} 확인`}
              />
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
