"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Card, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { Checkbox, Dropdown, UnderlineTabs } from "@/components/app/form-controls";
import { Pill, StatusPill } from "@/components/app/status-pill";
import type { CaseSummary } from "@syncargo/backend/data";
import { formatMD } from "@/lib/date";
import { CASE_KIND_LABEL } from "@/lib/labels";
import { caseHref } from "@/lib/links";
import type { CaseStatus } from "@syncargo/backend/types";

export type Tab = "all" | CaseStatus;
type Sort = "deadline" | "recent";

const TAB_TONE = { all: "blue", in_progress: "gray", needs_check: "red", awaiting_reply: "yellow" } as const;

export function CaseList({
  cases,
  shippers,
  initialTab = "all",
  initialShipperId = "all",
}: {
  cases: CaseSummary[];
  shippers: { id: string; name: string }[];
  initialTab?: Tab;
  initialShipperId?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [shipperId, setShipperId] = useState(initialShipperId);
  const [includeNoBl, setIncludeNoBl] = useState(true);
  const [sort, setSort] = useState<Sort>("deadline");

  // 화주·B/L 필터는 탭 숫자에도 반영
  const filtered = useMemo(
    () =>
      cases.filter(
        (c) => (shipperId === "all" || c.shipperId === shipperId) && (includeNoBl || c.kind === "shipment"),
      ),
    [cases, shipperId, includeNoBl],
  );

  const count = (t: Tab) =>
    filtered.filter((c) => (t === "all" ? c.status !== "done" : c.status === t)).length;

  const rows = useMemo(() => {
    const list = filtered.filter((c) => (tab === "all" ? c.status !== "done" : c.status === tab));
    if (sort === "recent") return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return list; // 서버에서 "다음 기한 가까운 순 · 같으면 확인 필요 먼저"로 정렬됨
  }, [filtered, tab, sort]);

  const tabs: { value: Tab; label: string; badge?: React.ReactNode }[] = (
    [
      ["all", "전체"],
      ["in_progress", "진행 중"],
      ["needs_check", "확인 필요"],
      ["awaiting_reply", "답변 대기"],
    ] as const
  ).map(([value, label]) => ({ value, label, badge: <Pill tone={TAB_TONE[value]}>{count(value)}</Pill> }));
  tabs.push({ value: "done", label: "완료" });

  return (
    <>
      <UnderlineTabs
        tabs={tabs}
        value={tab}
        onChange={setTab}
        right={
          <>
            <Dropdown
              aria-label="화주"
              value={shipperId}
              onChange={setShipperId}
              className="w-[140px]"
              options={[{ value: "all", label: "화주: 전체" }, ...shippers.map((s) => ({ value: s.id, label: `화주: ${s.name}` }))]}
            />
            <Checkbox checked={includeNoBl} onChange={setIncludeNoBl} label="B/L 없는 건 포함" />
          </>
        }
      />

      <Card className="flex flex-col gap-2">
        <CardHeader
          title="건 목록"
          count={rows.length}
          action={
            <>
              <span className="text-[13px] font-semibold text-muted-foreground">정렬</span>
              <Dropdown
                aria-label="정렬"
                value={sort}
                onChange={setSort}
                className="w-[210px]"
                options={[
                  { value: "deadline", label: "다음 기한 가까운 순" },
                  { value: "recent", label: "최근 변경 순" },
                ]}
              />
            </>
          }
        />

        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[140px]">건 번호</span>
            <span className="w-[90px]">유형</span>
            <span className="w-[110px]">화주</span>
            <span className="w-[100px]">상태</span>
            <span className="w-[200px]">다음 기한</span>
            <span className="flex-1">다음 행동</span>
          </div>
          {rows.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 건이 없어요.</p>
          )}
          {rows.map((c) => (
            <div
              key={c.id}
              role="row"
              tabIndex={0}
              onClick={() => router.push(caseHref(c))}
              onKeyDown={(e) => e.key === "Enter" && router.push(caseHref(c))}
              className={cn(
                "flex cursor-pointer items-center gap-4 border-b border-divider px-4 py-3.5 text-sm outline-none hover:bg-subtle focus-visible:bg-subtle",
                c.status === "needs_check" && "bg-danger-row hover:bg-danger-soft",
              )}
            >
              <span className="w-[140px]">
                <CaseCode code={c.code} />
              </span>
              <span className="w-[90px]">
                <span className="rounded-md bg-stat px-2 py-[3px] text-xs font-medium text-ink-2">{CASE_KIND_LABEL[c.kind]}</span>
              </span>
              <span className="w-[110px] font-semibold text-foreground">{c.shipperName}</span>
              <span className="w-[100px]">
                <StatusPill status={c.status} />
              </span>
              <span className="flex w-[200px] items-center gap-2">
                {c.nextDeadline ? (
                  <>
                    <DdayBadge date={c.nextDeadline.date} />
                    <span className="text-foreground">
                      {formatMD(c.nextDeadline.date)} {c.nextDeadline.label}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-foreground">{c.nextAction ?? c.stateSummary}</span>
            </div>
          ))}
        </div>

        <p className="flex gap-1.5 pt-1 text-[13px]">
          <span className="font-semibold text-ink-2">정렬 기준</span>
          <span className="text-muted-foreground">
            {sort === "deadline" ? "다음 기한이 가까운 순 · 기한이 같으면 확인 필요가 먼저" : "최근에 바뀐 건이 먼저"}
          </span>
        </p>
      </Card>
    </>
  );
}

