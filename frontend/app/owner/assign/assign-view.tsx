"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { AssignContext } from "@syncargo/backend/data";
import type { HandoverReason } from "@syncargo/backend/types";
import { useDemoState } from "@/lib/demo-state";
import { formatMD } from "@/lib/date";
import { HANDOVER_REASON_LABEL } from "@/lib/labels";
import { ownerAssignHref, ownerHandoverHref } from "@/lib/links";

const REASONS = Object.keys(HANDOVER_REASON_LABEL) as HandoverReason[];

/** R-09 화주 · 건을 다음 담당자에게 배정 */
export function AssignView({
  ctx,
  owners,
  focusShipperId,
  handoverId,
}: {
  ctx: AssignContext;
  owners: { id: string; name: string; leavingAt: string | null; shipperCount: number }[];
  /** 화주 카드에서 들어온 경우 그 화주만 넘김 */
  focusShipperId: string | null;
  /** 이 사람의 담당자 없는 인계 (퇴사) */
  handoverId: string | null;
}) {
  const router = useRouter();
  const demo = useDemoState();
  const leaving = !!ctx.from.leavingAt;
  const [reason, setReason] = useState<HandoverReason>(leaving ? "resign" : "reassign");
  const [applyAt, setApplyAt] = useState(ctx.from.leavingAt ?? "2026-11-23");
  const [picked, setPicked] = useState<Record<string, string>>({});

  // 화주 카드에서 들어오면 그 화주만, 아니면 이 사람의 화주 전부
  const rows = focusShipperId ? ctx.shippers.filter((s) => s.id === focusShipperId) : ctx.shippers;
  const assignedCount = rows.filter((s) => picked[s.id]).length;
  const left = rows.length - assignedCount;
  const leftNames = rows.filter((s) => !picked[s.id]).map((s) => s.name);

  const added = (userId: string) => rows.filter((s) => picked[s.id] === userId).length;

  const submit = () => {
    for (const s of rows) demo.assignOwner(`shipper:${s.id}`, picked[s.id]);
    if (handoverId) {
      // 가장 많이 받은 사람을 인계 받는 사람으로 표시
      const top = Object.entries(
        rows.reduce<Record<string, number>>((m, s) => ({ ...m, [picked[s.id]]: (m[picked[s.id]] ?? 0) + 1 }), {}),
      ).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (top) demo.assignOwner(`handover:${handoverId}`, top);
      router.push(ownerHandoverHref(handoverId));
    } else {
      router.push(ownerHandoverHref());
    }
  };

  const label = "mb-1.5 block text-[13px] font-semibold text-ink-2";

  return (
    <>
      <Card className="flex flex-col gap-4">
        <CardHeader title="누구의 화주 · 건을" />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <span className={label}>현재 담당자</span>
            <Dropdown
              aria-label="현재 담당자"
              value={ctx.from.id}
              onChange={(v) => router.push(ownerAssignHref({ from: v }))}
              options={owners.map((o) => ({
                value: o.id,
                label: `${o.name}${o.leavingAt ? ` (${formatMD(o.leavingAt)} 퇴사)` : ""}`,
              }))}
            />
          </div>
          <div>
            <span className={label}>사유</span>
            <Dropdown
              aria-label="사유"
              value={reason}
              onChange={setReason}
              options={REASONS.map((r) => ({ value: r, label: HANDOVER_REASON_LABEL[r] }))}
            />
          </div>
          <label>
            <span className={label}>적용 시점</span>
            <input
              value={applyAt}
              onChange={(e) => setApplyAt(e.target.value)}
              className="h-10 w-full rounded-lg border border-field-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>
        {focusShipperId && (
          <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-primary">
            화주 카드에서 들어왔어요 · {rows[0]?.name}와 현재 담당자({ctx.from.name})가 미리 선택돼 있어요.{" "}
            <button type="button" className="font-semibold underline" onClick={() => router.push(ownerAssignHref({ from: ctx.from.id }))}>
              {ctx.from.name}의 화주 전체 보기
            </button>
          </p>
        )}
      </Card>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-2">
          <CardHeader
            title="화주 · 건을 다음 담당자에게 배정"
            action={left > 0 ? <Pill tone="red">{left}곳 남음</Pill> : <Pill tone="green">모두 배정됨</Pill>}
          />
          <div className="flex flex-col" role="table">
            <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <span className="w-[110px]">화주</span>
              <span className="w-[80px]">진행 중인 건</span>
              <span className="w-[50px]">미결</span>
              <span className="flex-1">최근 움직임</span>
              <span className="w-[150px]">다음 담당자</span>
            </div>
            {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">맡은 화주가 없어요.</p>}
            {rows.map((s) => {
              const empty = !picked[s.id];
              return (
                <div key={s.id} role="row" className={cn("flex items-center gap-4 border-b border-divider px-4 py-3.5 text-sm", empty && "bg-danger-row")}>
                  <span className="w-[110px] font-semibold text-foreground">{s.name}</span>
                  <span className="w-[80px] text-foreground">{s.activeCaseCount}건</span>
                  <span className={cn("w-[50px]", s.openCount > 0 ? "font-bold text-danger" : "text-foreground")}>{s.openCount}건</span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {s.lastActivity ? `${s.lastActivity.text} (${formatMD(s.lastActivity.at)})` : "—"}
                  </span>
                  <Dropdown
                    aria-label={`${s.name} 다음 담당자`}
                    value={picked[s.id] ?? ""}
                    onChange={(v) => setPicked((p) => ({ ...p, [s.id]: v }))}
                    className={cn("w-[150px]", empty && "border-[1.5px] border-danger")}
                    options={[{ value: "", label: "선택" }, ...ctx.receivers.map((r) => ({ value: r.id, label: r.name }))]}
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex w-[320px] shrink-0 flex-col gap-1">
          <CardHeader title="배정 후 담당 화주 수" description="한쪽으로 쏠리지 않게 미리 확인" />
          {ctx.receivers.map((r) => {
            const plus = added(r.id);
            return (
              <div key={r.id} className="flex items-center gap-2 border-b border-divider py-3.5 last:border-b-0">
                <span className="flex-1 text-[15px] font-semibold text-foreground">{r.name}</span>
                {r.shipperCount > 0 ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{r.shipperCount}곳</span>
                    <span className="text-faint">→</span>
                    <span className="font-bold text-foreground">{r.shipperCount + plus}곳</span>
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">담당 화주에</span>
                )}
                <Pill tone={plus > 0 ? "blue" : "gray"}>+{plus}</Pill>
              </div>
            );
          })}
          {left > 0 && (
            <p className="mt-2 rounded-lg bg-subtle px-3 py-2.5 text-[13px] leading-normal text-ink-2">
              남은 {left}곳({leftNames.join(" · ")})을 배정하면 인계 요약을 만들 수 있어요.
            </p>
          )}
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex items-center justify-between rounded-[14px] border border-border bg-card px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold text-foreground">
            화주 {rows.length}곳 중 {assignedCount}곳 배정됨
          </span>
          {left > 0 && <Pill tone="red">{left}곳 남음</Pill>}
        </div>
        <Button disabled={left > 0 || rows.length === 0} onClick={submit}>
          지정하고 인계 요약 만들기 →
        </Button>
      </div>
    </>
  );
}
