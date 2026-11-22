"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { ShipperSummary } from "@syncargo/backend/data";
import { formatMMDD } from "@/lib/date";
import { TRADE_TYPE_LABEL } from "@/lib/labels";
import { shipperHref } from "@/lib/links";
import type { TradeType } from "@syncargo/backend/types";

type Scope = "mine" | "all" | "needs_check";
type Sort = "attention" | "name";

/** W-02 화주 목록 */
export function ShipperList({ shippers, userId }: { shippers: ShipperSummary[]; userId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("mine");
  const [trade, setTrade] = useState<"all" | TradeType>("all");
  const [sort, setSort] = useState<Sort>("attention");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = shippers.filter(
      (s) =>
        (!term || s.name.toLowerCase().includes(term)) &&
        (scope === "all" || (scope === "mine" ? s.ownerId === userId : s.needsCheck)) &&
        (trade === "all" || s.tradeType === trade),
    );
    return [...list].sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "ko")
        : Number(b.needsCheck) - Number(a.needsCheck) || (a.lastChangedAt < b.lastChangedAt ? 1 : -1),
    );
  }, [shippers, q, scope, trade, sort, userId]);

  const tradeTypes = Array.from(new Set(shippers.map((s) => s.tradeType)));

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
        <div className="flex h-10 items-center rounded-lg bg-stat p-1" role="radiogroup" aria-label="보기 범위">
          {(
            [
              ["mine", "내 화주"],
              ["all", "전체"],
              ["needs_check", "확인 필요 있음"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={scope === v}
              onClick={() => setScope(v)}
              className={cn(
                "h-8 rounded-md px-3 text-sm",
                scope === v ? "bg-background font-semibold text-foreground shadow-sm" : "font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Dropdown
          aria-label="거래 유형"
          value={trade}
          onChange={setTrade}
          className="w-[170px]"
          options={[
            { value: "all", label: "거래 유형: 전체" },
            ...tradeTypes.map((t) => ({ value: t, label: TRADE_TYPE_LABEL[t] })),
          ]}
        />
        <div className="ml-auto flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-muted-foreground">정렬</span>
          <Dropdown
            aria-label="정렬"
            value={sort}
            onChange={setSort}
            className="w-[270px]"
            options={[
              { value: "attention", label: "확인 필요 먼저 · 최근 변경 순" },
              { value: "name", label: "이름 순" },
            ]}
          />
        </div>
      </div>

      <Card className="flex flex-col gap-2">
        <CardHeader title="화주 목록" count={rows.length} />
        <div role="table" className="flex flex-col">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[150px]">화주</span>
            <span className="flex-1">거래 유형 · 주요 구간</span>
            <span className="w-[80px]">담당</span>
            <span className="w-[100px]">진행 중인 건</span>
            <span className="w-[100px]">확인 필요</span>
            <span className="w-[90px]">최근 변경</span>
            <span className="w-4" />
          </div>
          {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">조건에 맞는 화주가 없어요.</p>}
          {rows.map((s) => (
            <div
              key={s.id}
              role="row"
              tabIndex={0}
              onClick={() => router.push(shipperHref(s.id))}
              onKeyDown={(e) => e.key === "Enter" && router.push(shipperHref(s.id))}
              className="flex cursor-pointer items-center gap-4 border-b border-divider px-4 py-3.5 text-sm outline-none hover:bg-subtle focus-visible:bg-subtle"
            >
              <span className="w-[150px] font-semibold text-foreground">{s.name}</span>
              <span className="flex flex-1 items-center gap-2">
                <span className="rounded-md bg-stat px-2 py-[3px] text-xs font-medium text-ink-2">{TRADE_TYPE_LABEL[s.tradeType]}</span>
                <span className="text-ink-2">{s.route}</span>
              </span>
              <span className="w-[80px] text-foreground">{s.ownerName}</span>
              <span className="w-[100px] text-foreground">{s.activeCaseCount}건</span>
              <span className="w-[100px]">
                {s.needsCheck ? (
                  // 배지를 누르면 화주 카드가 확인 항목을 펼친 상태로 열린다
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(shipperHref(s.id, { focus: "check" }));
                    }}
                    className="rounded-full hover:ring-2 hover:ring-danger-border"
                  >
                    <Pill tone="red">확인 필요</Pill>
                  </button>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </span>
              <span className="w-[90px] font-mono font-medium text-foreground">{formatMMDD(s.lastChangedAt)}</span>
              <span className="w-4 text-base text-faint">›</span>
            </div>
          ))}
        </div>
        <p className="flex gap-1.5 pt-1 text-[13px]">
          <span className="font-semibold text-ink-2">정렬 기준</span>
          <span className="text-muted-foreground">
            {sort === "attention" ? "확인 필요가 있는 화주 → 최근 변경이 가까운 화주 순" : "화주 이름 가나다 순"}
          </span>
        </p>
      </Card>
    </>
  );
}
