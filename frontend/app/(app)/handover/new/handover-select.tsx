"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { HandoverCandidate } from "@syncargo/backend/data";
import type { HandoverReason } from "@syncargo/backend/types";
import { HANDOVER_REASON_LABEL } from "@/lib/labels";
import { handoverPreviewHref } from "@/lib/links";

/** 화주별 건 선택: "all" = 진행 중인 건 모두, 아니면 고른 건 하나 */
type Pick = Record<string, "all" | string>;

const REASONS = Object.keys(HANDOVER_REASON_LABEL) as HandoverReason[];

/** W-08 인계 대상 고르기 (리디자인 v2): 3단계 진행 표시 · 선택한 화주·건 수를 아래 바에서 바로 확인 */
export function HandoverSelect({
  me,
  candidates,
  receivers,
  preselected,
  fromShipperCard,
  initial,
}: {
  me: string;
  candidates: HandoverCandidate[];
  receivers: { id: string; name: string }[];
  preselected: string[];
  fromShipperCard: boolean;
  initial: { to?: string; reason?: string; period?: string; cases?: string[] };
}) {
  const [to, setTo] = useState(receivers.some((r) => r.id === initial.to) ? initial.to! : (receivers[0]?.id ?? ""));
  const [reason, setReason] = useState<HandoverReason>(
    REASONS.includes(initial.reason as HandoverReason) ? (initial.reason as HandoverReason) : "vacation",
  );
  const [period, setPeriod] = useState(initial.period ?? "11/23 ~ 11/27");
  const [picked, setPicked] = useState<Pick>(() => {
    const p: Pick = {};
    for (const id of preselected) {
      const c = candidates.find((x) => x.shipper.id === id)!;
      const one = initial.cases?.filter((cid) => c.activeCases.some((a) => a.id === cid)) ?? [];
      p[id] = one.length === 1 && c.activeCases.length > 1 ? one[0] : "all";
    }
    return p;
  });

  // 미리 선택된 화주를 맨 위로
  const rows = useMemo(
    () => [...candidates].sort((a, b) => Number(preselected.includes(b.shipper.id)) - Number(preselected.includes(a.shipper.id))),
    [candidates, preselected],
  );

  const selectedIds = rows.map((r) => r.shipper.id).filter((id) => picked[id]);
  const selectedCases = selectedIds.flatMap((id) => {
    const c = candidates.find((x) => x.shipper.id === id)!;
    return picked[id] === "all" ? c.activeCases.map((a) => a.id) : [picked[id]];
  });
  const allPicked = selectedIds.length === rows.length;
  const firstName = candidates.find((c) => c.shipper.id === preselected[0])?.shipper.name;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "all";
      return next;
    });

  const href = handoverPreviewHref({
    shippers: selectedIds,
    to,
    reason,
    period: reason === "vacation" ? period : undefined,
    cases: selectedIds.some((id) => picked[id] !== "all") ? selectedCases : undefined,
  });

  const label = "mb-1.5 block text-[13px] font-semibold text-ink-2";

  return (
    <>
      {fromShipperCard && firstName && (
        <div className="flex items-center gap-5 rounded-xl bg-brand-soft px-6 py-4">
          <span className="text-xs font-bold text-primary">{firstName} 화주 카드에서 시작</span>
          <span className="text-sm font-medium text-primary">
            {firstName}가 미리 선택돼 있어요. 함께 넘길 화주를 더 고를 수 있어요.
          </span>
        </div>
      )}

      <Card className="flex flex-col gap-4">
        <CardHeader title="누구에게 · 언제" />
        <div className="grid grid-cols-4 gap-3">
          <div>
            <span className={label}>넘기는 사람</span>
            <div className="flex h-10 items-center rounded-lg border border-field-border bg-stat px-3 text-sm text-ink-2">{me} (나)</div>
          </div>
          <div>
            <span className={label}>받는 사람</span>
            <Dropdown aria-label="받는 사람" value={to} onChange={setTo} options={receivers.map((r) => ({ value: r.id, label: r.name }))} />
          </div>
          <div>
            <span className={label}>사유</span>
            <Dropdown
              aria-label="사유"
              value={reason}
              onChange={setReason}
              options={REASONS.map((r) => ({ value: r, label: HANDOVER_REASON_LABEL[r] }))}
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">휴가 · 담당 변경 · 퇴사</span>
          </div>
          <label>
            <span className={label}>기간</span>
            <input
              value={reason === "vacation" ? period : "끝나는 날 없음"}
              disabled={reason !== "vacation"}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="11/23 ~ 11/27"
              className="h-10 w-full rounded-lg border border-field-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-primary disabled:bg-stat disabled:text-muted-foreground"
            />
          </label>
        </div>
      </Card>

      <Card className="flex flex-col gap-1">
        <CardHeader
          title="넘길 화주 · 건 선택"
          description="화주·건 단위로 범위 지정"
          action={
            <button
              type="button"
              onClick={() =>
                setPicked(allPicked ? {} : Object.fromEntries(rows.map((r) => [r.shipper.id, picked[r.shipper.id] ?? "all"])))
              }
              className="text-sm font-semibold text-primary hover:underline"
            >
              {allPicked ? "선택 해제" : "전체 선택"}
            </button>
          }
        />
        {rows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">진행 중인 건이 있는 화주가 없어요.</p>}
        {rows.map((r) => {
          const id = r.shipper.id;
          const on = !!picked[id];
          const pre = preselected.includes(id) && fromShipperCard;
          return (
            <div
              key={id}
              className={cn(
                "flex items-center gap-3 border-b border-divider py-4 last:border-b-0",
                pre && on && "my-1 rounded-xl border border-primary bg-brand-soft px-3",
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" checked={on} onChange={() => toggle(id)} className="peer sr-only" />
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30",
                    on ? "border-primary bg-primary" : "border-field-border bg-background",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {on && <img src="/figma/check-white.svg" alt="" width={14} height={14} className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px] font-bold text-foreground">{r.shipper.name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    진행 중 {r.activeCases.length}건 ·{" "}
                    {r.needsCheckCount > 0 ? (
                      <span className="font-semibold text-danger">확인 필요 {r.needsCheckCount}</span>
                    ) : (
                      "확인 필요 0"
                    )}
                    건
                  </span>
                </span>
              </label>
              {pre && on && <span className="text-xs font-semibold text-primary">미리 선택됨</span>}
              <Dropdown
                aria-label={`${r.shipper.name} 건 선택`}
                value={on ? picked[id] : "none"}
                onChange={(v) => setPicked((prev) => ({ ...prev, [id]: v }))}
                className={cn("w-[180px]", !on && "pointer-events-none opacity-70")}
                options={
                  on
                    ? [
                        { value: "all", label: `건 선택: ${r.activeCases.length}건 모두` },
                        ...r.activeCases.map((c) => ({ value: c.id, label: c.label })),
                      ]
                    : [{ value: "none", label: "건 선택" }]
                }
              />
            </div>
          );
        })}
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-[14px] border border-border bg-card px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Pill tone="blue">선택됨</Pill>
          <span className="text-base font-bold text-foreground">
            화주 {selectedIds.length}곳 · 건 {selectedCases.length}개
          </span>
        </div>
        {selectedIds.length > 0 && to ? (
          <Button asChild>
            <Link href={href}>인계 미리보기 만들기 →</Link>
          </Button>
        ) : (
          <Button disabled>인계 미리보기 만들기 →</Button>
        )}
      </div>
    </>
  );
}
