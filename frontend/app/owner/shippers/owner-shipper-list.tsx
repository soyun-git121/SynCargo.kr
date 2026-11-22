"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { BlockedPills } from "@/components/app/blocked-pill";
import { Card, CardHeader } from "@/components/app/card";
import { Pill } from "@/components/app/status-pill";
import type { CompanyShipperRow } from "@syncargo/backend/data";
import { formatMMDD } from "@/lib/date";
import { TRADE_TYPE_LABEL } from "@/lib/labels";
import { ownerShipperHref } from "@/lib/links";

type View = "group" | "all" | "blocked";
const PER_GROUP = 3;

/** R-02 화주 목록 (대표) */
export function OwnerShipperList({ shippers }: { shippers: CompanyShipperRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>("group");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return shippers.filter(
      (s) =>
        (!term || s.name.toLowerCase().includes(term)) && (view !== "blocked" || s.blockedCheck + s.blockedWait > 0),
    );
  }, [shippers, q, view]);

  // 담당자별 묶음: 막힌 건이 있는 화주 먼저
  const groups = useMemo(() => {
    const map = new Map<string, { ownerName: string; rows: CompanyShipperRow[] }>();
    for (const s of filtered) {
      const g = map.get(s.ownerId) ?? { ownerName: s.ownerName, rows: [] };
      g.rows.push(s);
      map.set(s.ownerId, g);
    }
    for (const g of map.values())
      g.rows.sort((a, b) => b.blockedCheck + b.blockedWait - (a.blockedCheck + a.blockedWait) || (a.lastChangedAt < b.lastChangedAt ? 1 : -1));
    return [...map.entries()];
  }, [filtered]);

  const row = (s: CompanyShipperRow) => (
    <div
      key={s.id}
      role="row"
      tabIndex={0}
      onClick={() => router.push(ownerShipperHref(s.id))}
      onKeyDown={(e) => e.key === "Enter" && router.push(ownerShipperHref(s.id))}
      className="flex cursor-pointer items-center gap-4 border-b border-divider px-4 py-3.5 text-sm outline-none hover:bg-subtle focus-visible:bg-subtle"
    >
      <span className="w-[150px] font-semibold text-foreground">{s.name}</span>
      <span className="flex flex-1 items-center gap-2">
        <span className="rounded-md bg-stat px-2 py-[3px] text-xs font-medium text-ink-2">{TRADE_TYPE_LABEL[s.tradeType]}</span>
        <span className="text-ink-2">{s.route}</span>
      </span>
      {view !== "group" && <span className="w-[80px] text-foreground">{s.ownerName}</span>}
      <span className="w-[110px] text-foreground">{s.activeCaseCount}건</span>
      <span className="w-[110px]">
        <BlockedPills check={s.blockedCheck} wait={s.blockedWait} />
      </span>
      <span className="w-[90px] font-mono font-medium text-foreground">{formatMMDD(s.lastChangedAt)}</span>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="화주 이름 검색"
          aria-label="화주 이름 검색"
          className="h-10 w-[280px] rounded-lg border border-field-border bg-background px-3 text-sm outline-none placeholder:text-placeholder focus:border-primary"
        />
        <div className="flex h-10 items-center rounded-lg bg-stat p-1" role="radiogroup" aria-label="보기">
          {(
            [
              ["group", "담당자별 묶어 보기"],
              ["all", "전체 목록"],
              ["blocked", "막힌 건 있음"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-8 rounded-md px-3 text-sm",
                view === v ? "bg-background font-semibold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[13px] text-muted-foreground">담당자가 바뀌어도 회사에 남는 화주 기록</span>
      </div>

      <Card className="flex flex-col gap-2">
        <CardHeader title="화주 목록" count={view === "group" ? undefined : filtered.length} />
        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[150px]">화주</span>
            <span className="flex-1">거래 유형 · 주요 구간</span>
            {view !== "group" && <span className="w-[80px]">담당</span>}
            <span className="w-[110px]">진행 중인 건</span>
            <span className="w-[110px]">막혀 있는 건</span>
            <span className="w-[90px]">최근 변경</span>
          </div>
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 화주가 없어요.</p>}

          {view !== "group"
            ? filtered.map(row)
            : groups.map(([ownerId, g]) => {
                const blocked = g.rows.reduce((n, s) => n + s.blockedCheck + s.blockedWait, 0);
                const isCollapsed = collapsed[ownerId];
                const visible = expanded[ownerId] ? g.rows : g.rows.slice(0, PER_GROUP);
                const rest = g.rows.length - visible.length;
                return (
                  <Fragment key={ownerId}>
                    <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-subtle px-4 py-2.5">
                      <span className="flex size-6 items-center justify-center rounded-full bg-background text-xs font-bold text-ink-2">
                        {g.ownerName.slice(0, 1)}
                      </span>
                      <span className="text-[15px] font-bold text-foreground">{g.ownerName}</span>
                      <span className="text-[13px] text-muted-foreground">화주 {g.rows.length}곳</span>
                      {blocked > 0 ? <Pill tone="yellow">막힌 건 {blocked}</Pill> : <span className="text-[13px] text-muted-foreground">막힌 건 0</span>}
                      <button
                        type="button"
                        onClick={() => setCollapsed((p) => ({ ...p, [ownerId]: !p[ownerId] }))}
                        className="ml-auto text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isCollapsed ? "펼치기 ▾" : "접기 ▴"}
                      </button>
                    </div>
                    {!isCollapsed && (
                      <>
                        {visible.map(row)}
                        {rest > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpanded((p) => ({ ...p, [ownerId]: true }))}
                            className="w-fit px-4 py-3 text-[13px] font-semibold text-primary hover:underline"
                          >
                            외 {rest}곳 더 보기
                          </button>
                        )}
                      </>
                    )}
                  </Fragment>
                );
              })}
        </div>
      </Card>
    </>
  );
}
