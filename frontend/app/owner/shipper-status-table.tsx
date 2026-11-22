"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BlockedPills } from "@/components/app/blocked-pill";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import type { CompanyShipperRow } from "@syncargo/backend/data";
import { formatMD } from "@/lib/date";
import { ownerShipperHref } from "@/lib/links";

type View = "owner" | "blocked";

/** R-01 화주별 현황: 최근 움직임이 있는 화주 · 담당자별 / 막힌 건 먼저 */
export function ShipperStatusTable({ shippers }: { shippers: CompanyShipperRow[] }) {
  const [view, setView] = useState<View>("owner");
  const rows = useMemo(
    () =>
      view === "owner"
        ? shippers
        : [...shippers].sort((a, b) => b.blockedCheck + b.blockedWait - (a.blockedCheck + a.blockedWait)),
    [shippers, view],
  );
  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-3">
      <CardHeader
        title="화주별 현황"
        description="최근 움직임이 있는 화주"
        action={
          <Dropdown
            aria-label="보기"
            value={view}
            onChange={setView}
            className="w-[150px]"
            options={[
              { value: "owner", label: "담당자별 보기" },
              { value: "blocked", label: "막힌 건 먼저" },
            ]}
          />
        }
      />
      <div className="flex flex-col" role="table">
        <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
          <span className="w-[110px]">화주</span>
          <span className="w-[80px]">담당자</span>
          <span className="flex-1">최근 움직임</span>
          <span className="w-[100px]">막혀 있는 건</span>
        </div>
        {rows.map((s) => (
          <Link
            key={s.id}
            role="row"
            href={ownerShipperHref(s.id)}
            className="flex items-center gap-4 border-b border-divider px-4 py-3.5 text-sm hover:bg-subtle"
          >
            <span className="w-[110px] font-semibold text-foreground">{s.name}</span>
            <span className="w-[80px] text-foreground">{s.ownerName}</span>
            <span className="min-w-0 flex-1 truncate text-foreground">
              {s.lastActivity ? `${s.lastActivity.text} (${formatMD(s.lastActivity.at)})` : "—"}
            </span>
            <span className="w-[100px]">
              <BlockedPills check={s.blockedCheck} wait={s.blockedWait} />
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
