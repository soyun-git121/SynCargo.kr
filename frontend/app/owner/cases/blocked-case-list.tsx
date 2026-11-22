"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { BLOCKED_KIND_LABEL, BLOCKED_KIND_TONE } from "@/components/app/blocked-pill";
import { Card } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { Dropdown, UnderlineTabs } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { BlockedCase } from "@syncargo/backend/data";
import { formatMD } from "@/lib/date";
import { ownerAssignHref, ownerCaseHref } from "@/lib/links";

type Tab = "all" | "reply" | "approval" | "check";
type Sort = "stopped" | "deadline";

const TAB_TONE = { all: "blue", reply: "yellow", approval: "yellow", check: "red" } as const;
/** 5일 이상 멈춘 건은 빨간 막대 */
const LONG_STOP = 5;

export function BlockedCaseList({ cases }: { cases: BlockedCase[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState<Sort>("stopped");

  const rows = useMemo(() => {
    const list = cases.filter((c) => tab === "all" || c.blocked.kind === tab);
    return sort === "stopped"
      ? list
      : [...list].sort((a, b) => (a.nextDeadline?.date ?? "9999") < (b.nextDeadline?.date ?? "9999") ? -1 : 1);
  }, [cases, tab, sort]);

  const count = (t: Tab) => cases.filter((c) => t === "all" || c.blocked.kind === t).length;
  const maxDays = Math.max(6, ...cases.map((c) => c.stoppedDays));
  // 퇴사 예정자가 맡은 막힌 건 → 맨 위 경고
  const leaving = cases.find((c) => c.ownerLeavingAt);

  return (
    <>
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        tabs={(
          [
            ["all", "전체"],
            ["reply", "답변 대기"],
            ["approval", "승인 대기"],
            ["check", "확인 필요"],
          ] as const
        ).map(([value, label]) => ({ value, label, badge: <Pill tone={TAB_TONE[value]}>{count(value)}</Pill> }))}
        right={
          <>
            <span className="text-[13px] font-semibold text-muted-foreground">정렬</span>
            <Dropdown
              aria-label="정렬"
              value={sort}
              onChange={setSort}
              className="w-[150px]"
              options={[
                { value: "stopped", label: "오래 멈춘 순" },
                { value: "deadline", label: "기한 가까운 순" },
              ]}
            />
          </>
        }
      />

      {leaving && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-danger-soft px-[18px] py-4">
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-bold text-danger">
              {leaving.shipperName} 건 담당자 {leaving.ownerName}이 {formatMD(leaving.ownerLeavingAt!)} 퇴사 예정이에요
            </p>
            <p className="text-[13px] text-danger-ink">{leaving.stoppedDays}일째 멈춰 있어요 · 다음 담당자를 먼저 정하면 좋아요</p>
          </div>
          <Button asChild>
            <Link href={ownerAssignHref({ from: leaving.ownerId })}>담당자 지정 →</Link>
          </Button>
        </div>
      )}

      <Card className="flex flex-col gap-2">
        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[130px]">건 번호</span>
            <span className="w-[100px]">화주</span>
            <span className="w-[80px]">담당자</span>
            <span className="flex-1">막힌 이유</span>
            <span className="w-[110px]">멈춘 지</span>
            <span className="w-[170px]">다음 기한</span>
          </div>
          {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">막혀 있는 건이 없어요.</p>}
          {rows.map((c) => {
            const long = c.stoppedDays >= LONG_STOP;
            const mid = c.stoppedDays >= 3;
            return (
              <div
                key={c.id}
                role="row"
                tabIndex={0}
                onClick={() => router.push(ownerCaseHref(c))}
                onKeyDown={(e) => e.key === "Enter" && router.push(ownerCaseHref(c))}
                className={cn(
                  "flex cursor-pointer items-center gap-4 border-b border-divider px-4 py-3.5 text-sm outline-none hover:bg-subtle focus-visible:bg-subtle",
                  c.ownerLeavingAt && "bg-danger-row",
                )}
              >
                <span className="w-[130px]">
                  <CaseCode code={c.code} />
                </span>
                <span className="w-[100px] font-semibold text-foreground">{c.shipperName}</span>
                <span className="w-[80px] text-foreground">{c.ownerName}</span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Pill tone={BLOCKED_KIND_TONE[c.blocked.kind]}>{BLOCKED_KIND_LABEL[c.blocked.kind]}</Pill>
                  <span className="truncate text-foreground">{c.blocked.reason}</span>
                </span>
                <span className="flex w-[110px] items-center gap-2">
                  <span className="h-1.5 w-[60px] overflow-hidden rounded-full bg-border">
                    <span
                      className={cn("block h-full rounded-full", long ? "bg-danger-strong" : mid ? "bg-warning-border" : "bg-faint")}
                      style={{ width: `${Math.max(8, (c.stoppedDays / maxDays) * 100)}%` }}
                    />
                  </span>
                  <span className={cn("font-bold", long ? "text-danger" : "text-foreground")}>{c.stoppedDays}일</span>
                </span>
                <span className="flex w-[170px] items-center gap-2">
                  {c.nextDeadline ? (
                    <>
                      <DdayBadge date={c.nextDeadline.date} />
                      <span className="text-foreground">
                        {formatMD(c.nextDeadline.date)} {c.nextDeadline.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <p className="flex gap-1.5 pt-1 text-[13px]">
          <span className="font-semibold text-ink-2">정렬 기준</span>
          <span className="text-muted-foreground">
            {sort === "stopped" ? `멈춘 기간이 긴 순 · ${LONG_STOP}일 이상은 빨간 막대` : "다음 기한이 가까운 순"}
          </span>
        </p>
      </Card>
    </>
  );
}
