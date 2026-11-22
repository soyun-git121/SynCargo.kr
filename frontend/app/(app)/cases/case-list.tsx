"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Card, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { Checkbox, Dropdown, UnderlineTabs } from "@/components/app/form-controls";
import { Pill, StatusPill } from "@/components/app/status-pill";
import type { CaseSummary } from "@syncargo/backend/data";
import { formatMD, formatMMDD } from "@/lib/date";
import { CASE_KIND_LABEL } from "@/lib/labels";
import { caseHref, shipperHref } from "@/lib/links";
import type { CaseStatus } from "@syncargo/backend/types";

export type Tab = "all" | CaseStatus;
type Sort = "deadline" | "recent";

const TAB_TONE = { all: "blue", in_progress: "gray", needs_check: "red", awaiting_reply: "yellow", done: "green" } as const;
const DONE_PAGE = 5;

/** W-04 업무 건 목록 (리디자인 v2): 행 끝 ›, 마우스를 올린 행 강조, 화주 이름은 밑줄 링크, 아래 범례 */
export function CaseList({
  cases,
  shippers,
  initialTab = "all",
  initialShipperId = "all",
  fromShipperCard = false,
}: {
  cases: CaseSummary[];
  shippers: { id: string; name: string }[];
  initialTab?: Tab;
  initialShipperId?: string;
  /** 화주 카드의 '지난 건 보기'로 들어옴 → 안내 띠 표시 */
  fromShipperCard?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [shipperId, setShipperId] = useState(initialShipperId);
  const [includeNoBl, setIncludeNoBl] = useState(true);
  const [sort, setSort] = useState<Sort>("deadline");
  const [doneShown, setDoneShown] = useState(DONE_PAGE);
  const [banner, setBanner] = useState(fromShipperCard);

  const shipperName = shippers.find((s) => s.id === shipperId)?.name;

  // 화주·B/L 필터는 탭 숫자에도 반영
  const filtered = useMemo(
    () =>
      cases.filter(
        (c) => (shipperId === "all" || c.shipperId === shipperId) && (includeNoBl || c.kind === "shipment"),
      ),
    [cases, shipperId, includeNoBl],
  );

  const count = (t: Tab) => filtered.filter((c) => (t === "all" ? c.status !== "done" : c.status === t)).length;

  const rows = useMemo(() => {
    const list = filtered.filter((c) => (tab === "all" ? c.status !== "done" : c.status === tab));
    if (tab === "done") return list; // 서버에서 완료일 최근 순
    if (sort === "recent") return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    return list; // 서버에서 "다음 기한 가까운 순 · 같으면 확인 필요 먼저"로 정렬됨
  }, [filtered, tab, sort]);

  const done = tab === "done";
  const visible = done ? rows.slice(0, doneShown) : rows;

  const tabs = (
    [
      ["all", "전체"],
      ["in_progress", "진행 중"],
      ["needs_check", "확인 필요"],
      ["awaiting_reply", "답변 대기"],
      ["done", "완료"],
    ] as const
  ).map(([value, label]) => ({
    value: value as Tab,
    label,
    // 완료 탭은 선택했을 때만 숫자를 보여 준다
    badge: value !== "done" || tab === "done" ? <Pill tone={TAB_TONE[value]}>{count(value)}</Pill> : undefined,
  }));

  const clearShipper = () => {
    setShipperId("all");
    setBanner(false);
  };

  return (
    <>
      {banner && shipperName && (
        <p className="rounded-[10px] bg-brand-soft px-3.5 py-3 text-[13px] font-medium text-primary">
          {shipperName} 화주 카드의 ‘지난 건 보기’에서 들어왔어요 · 화주({shipperName})와 {done ? "완료" : "상태"}가 미리
          선택돼 있어요
        </p>
      )}

      <UnderlineTabs
        tabs={tabs}
        value={tab}
        onChange={(t) => {
          setTab(t);
          setDoneShown(DONE_PAGE);
        }}
        right={
          banner && shipperId !== "all" ? (
            <button
              type="button"
              onClick={clearShipper}
              className="flex h-10 items-center gap-2 rounded-full border-[1.5px] border-primary bg-brand-soft px-3.5 text-[13px] font-semibold text-primary"
            >
              화주: {shipperName} <span aria-label="화주 거르기 해제">×</span>
            </button>
          ) : (
            <>
              <Dropdown
                aria-label="화주"
                value={shipperId}
                onChange={setShipperId}
                className="w-[140px]"
                options={[
                  { value: "all", label: "화주: 전체" },
                  ...shippers.map((s) => ({ value: s.id, label: `화주: ${s.name}` })),
                ]}
              />
              <Checkbox checked={includeNoBl} onChange={setIncludeNoBl} label="B/L 없는 건 포함" />
            </>
          )
        }
      />

      <Card className="flex flex-col gap-2">
        <CardHeader
          title={done && shipperName ? `완료된 건 · ${shipperName}` : done ? "완료된 건" : "건 목록"}
          count={rows.length}
          action={
            <>
              <span className="text-[13px] font-semibold text-muted-foreground">정렬</span>
              {done ? (
                <Dropdown
                  aria-label="정렬"
                  value="closed"
                  onChange={() => {}}
                  className="w-[170px]"
                  options={[{ value: "closed", label: "완료일 최근 순" }]}
                />
              ) : (
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
              )}
            </>
          }
        />

        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[140px]">건 번호</span>
            <span className="w-[90px]">유형</span>
            <span className="w-[110px]">화주</span>
            <span className="w-[100px]">상태</span>
            <span className="w-[200px]">{done ? "완료일" : "다음 기한"}</span>
            <span className="flex-1">{done ? "마지막 처리" : "다음 행동"}</span>
            <span className="w-[88px]" />
          </div>
          {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 건이 없어요.</p>}
          {visible.map((c) => (
            <div
              key={c.id}
              role="row"
              tabIndex={0}
              onClick={() => router.push(caseHref(c))}
              onKeyDown={(e) => e.key === "Enter" && router.push(caseHref(c))}
              className={cn(
                "group relative flex cursor-pointer items-center gap-4 border-b border-divider px-4 py-3.5 text-sm outline-none",
                "hover:z-10 hover:rounded-lg hover:border-transparent hover:bg-brand-soft/60 hover:ring-1 hover:ring-brand-muted",
                "focus-visible:z-10 focus-visible:rounded-lg focus-visible:bg-brand-soft/60 focus-visible:ring-1 focus-visible:ring-brand-muted",
                c.status === "needs_check" && "bg-danger-row",
              )}
            >
              <span className="w-[140px]">
                <CaseCode code={c.code} className={c.code ? undefined : "font-normal"} />
              </span>
              <span className="w-[90px]">
                <span className="rounded-md bg-stat px-2 py-[3px] text-xs font-medium text-ink-2">{CASE_KIND_LABEL[c.kind]}</span>
              </span>
              <span className="w-[110px]">
                <Link
                  href={shipperHref(c.shipperId)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-primary underline underline-offset-2"
                >
                  {c.shipperName}
                </Link>
              </span>
              <span className="w-[100px]">
                <StatusPill status={c.status} />
              </span>
              <span className="flex w-[200px] items-center gap-2">
                {done ? (
                  <span className="font-mono text-foreground">{c.closedAt ? formatMMDD(c.closedAt) : "—"}</span>
                ) : c.nextDeadline ? (
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
              <span className="min-w-0 flex-1 truncate text-foreground">
                {done ? c.stateSummary : (c.nextAction ?? c.stateSummary)}
              </span>
              <span className="flex w-[88px] justify-end">
                <span className="hidden text-[13px] font-semibold text-primary group-hover:inline group-focus-visible:inline">
                  건 상세 →
                </span>
                <span className="text-lg text-faint group-hover:hidden group-focus-visible:hidden">›</span>
              </span>
            </div>
          ))}
        </div>

        {done ? (
          <div className="flex items-center justify-between pt-1 text-[13px]">
            <span className="text-muted-foreground">
              완료일 최근 순 · {rows.length}건 중 {visible.length}건 표시
            </span>
            {visible.length < rows.length && (
              <button
                type="button"
                onClick={() => setDoneShown((n) => n + DONE_PAGE)}
                className="font-semibold text-primary hover:underline"
              >
                더 보기
              </button>
            )}
          </div>
        ) : (
          <p className="flex gap-1.5 pt-1 text-[13px]">
            <span className="font-semibold text-ink-2">정렬 기준</span>
            <span className="text-muted-foreground">
              {sort === "deadline" ? "다음 기한이 가까운 순 · 기한이 같으면 확인 필요가 먼저" : "최근에 바뀐 건이 먼저"}
            </span>
          </p>
        )}
        <div className="flex items-center gap-5 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-base text-faint">›</span> 행 전체를 누르면 건 상세
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-primary underline underline-offset-2">A전자</span> 밑줄 친 화주 이름을 누르면 화주 카드
          </span>
        </div>
      </Card>
    </>
  );
}
