"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Card, CardHeader } from "@/components/app/card";
import { EvidenceSentence } from "@/components/app/evidence-sentence";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { ShipperHistoryRow } from "@syncargo/backend/data";
import type { Shipper } from "@syncargo/backend/types";
import { formatYMD } from "@/lib/date";
import { ownerShipperHref } from "@/lib/links";

type Filter = "all" | "confirmed" | "needs_check" | "handover";

const STATUS = {
  confirmed: { label: "확정", tone: "green" },
  needs_check: { label: "확인 필요", tone: "red" },
  handover: { label: "인계", tone: "blue" },
} as const;

const statusOf = (r: ShipperHistoryRow) => (r.kind === "handover" ? "handover" : r.status);

/** R-04 화주 이력 표 */
export function ShipperHistory({ shipper, rows, startedAt }: { shipper: Shipper; rows: ShipperHistoryRow[]; startedAt: string | null }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = rows.filter((r) => filter === "all" || statusOf(r) === filter);

  return (
    <>
      <Link href={ownerShipperHref(shipper.id)} className="w-fit text-sm font-semibold text-primary hover:underline">
        ← 화주 카드로
      </Link>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[26px] font-bold text-foreground">{shipper.name} · 화주 이력</h1>
        <p className="text-sm text-muted-foreground">
          담당자가 바뀌어도 회사에 남는 기록{startedAt ? ` · ${formatYMD(startedAt)} 거래 시작부터` : ""}
        </p>
      </div>

      <Card className="flex flex-col gap-2">
        <CardHeader
          title="조건이 바뀐 날짜와 근거"
          action={
            <Dropdown
              aria-label="상태"
              value={filter}
              onChange={setFilter}
              className="w-[140px]"
              options={[
                { value: "all", label: "상태: 전체" },
                { value: "confirmed", label: "상태: 확정" },
                { value: "needs_check", label: "상태: 확인 필요" },
                { value: "handover", label: "상태: 인계" },
              ]}
            />
          }
        />
        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[120px]">날짜</span>
            <span className="flex-1">바뀐 조건</span>
            <span className="w-[100px]">당시 담당</span>
            <span className="w-[100px]">상태</span>
            <span className="w-[110px]">근거</span>
          </div>
          {visible.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">해당하는 이력이 없어요.</p>}
          {visible.map((r) => {
            const st = STATUS[statusOf(r)];
            return (
              <div
                key={r.id}
                role="row"
                className={cn("flex items-center gap-4 border-b border-divider px-4 py-4 text-sm", r.status === "needs_check" && "bg-danger-row")}
              >
                <span className="w-[120px] font-mono font-medium text-foreground">{r.at.slice(0, 10)}</span>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate text-foreground">{r.title}</span>
                  {r.before && r.after && (
                    <>
                      <span className="text-muted-foreground line-through">{r.before}</span>
                      <span className="text-faint">→</span>
                      <span className="font-bold text-foreground">
                        {r.after}
                        {r.status === "needs_check" ? " 요청" : ""}
                      </span>
                    </>
                  )}
                </span>
                <span className="w-[100px] text-foreground">{r.ownerNameAtTime ?? <span className="text-faint">—</span>}</span>
                <span className="w-[100px]">
                  <Pill tone={st.tone}>{st.label}</Pill>
                </span>
                <span className="w-[110px]">
                  <EvidenceSentence text={r.evidenceText} />
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <p className="rounded-lg bg-subtle px-3 py-2.5 text-[13px] text-ink-2">
        근거는 메일 원문 대신 그 내용이 나온 문장만 보여 줘요. 원문 열람 기준은 관리자 모드 › 구성원·권한에서 정해요.
      </p>
    </>
  );
}
