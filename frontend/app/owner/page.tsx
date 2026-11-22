import Link from "next/link";
import { Card, CardHeader } from "@/components/app/card";
import { DdayBadge } from "@/components/app/dday-badge";
import { Page } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { getCompanyOverview } from "@syncargo/backend/data";
import { TODAY, formatKoreanDate } from "@/lib/date";
import { NO_CODE_LABEL } from "@/lib/labels";
import { ownerCaseHref, ownerHandoverHref } from "@/lib/links";
import { HandoverRow } from "./handover-row";
import { ShipperStatusTable } from "./shipper-status-table";

/** R-01 대표 홈 · 회사 현황: 막힌 건 · 확인 필요를 숫자로 먼저 */
export default async function OwnerHomePage() {
  const o = await getCompanyOverview();
  return (
    <Page owner crumbs={[{ label: "홈" }]}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{formatKoreanDate(TODAY)}</p>
        <h1 className="text-[26px] font-bold text-foreground">회사 현황</h1>
        <p className="text-sm text-muted-foreground">누구를 감시하는 화면이 아니라, 막힌 일을 먼저 풀기 위한 화면이에요</p>
      </div>

      <div className="flex gap-3">
        <StatTile label="화주" value={o.shipperCount} unit="곳" href="/owner/shippers" />
        <StatTile label="진행 중인 건" value={o.activeCaseCount} />
        <StatTile
          label="막혀 있는 건"
          value={o.blocked.total}
          tone="yellow"
          sub={`답변·승인 대기 ${o.blocked.wait} · 확인 필요 ${o.blocked.check}`}
          href="/owner/cases"
        />
        <StatTile label="확인 필요" value={o.needsCheckCount} tone="red" />
      </div>

      <div className="flex items-start gap-5">
        <ShipperStatusTable shippers={o.shippers} />

        <div className="flex w-[420px] shrink-0 flex-col gap-5">
          <Card className="flex flex-col gap-1">
            <CardHeader title="기한 임박 · 미결 건" description="기한 가까운 순" />
            {o.urgentCases.map((c) => (
              <Link
                key={c.id}
                href={ownerCaseHref(c)}
                className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0 hover:bg-subtle/60"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-semibold text-foreground">
                    {c.code ?? NO_CODE_LABEL} · {c.nextDeadline?.label}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {c.shipperName} · {c.ownerName}
                  </span>
                </span>
                {c.nextDeadline && <DdayBadge date={c.nextDeadline.date} />}
              </Link>
            ))}
          </Card>

          <Card className="flex flex-col gap-1">
            <CardHeader
              title="인계 현황"
              action={
                <Link href={ownerHandoverHref()} className="text-sm font-semibold text-primary hover:underline">
                  전체 보기 →
                </Link>
              }
            />
            {o.handovers.map((h) => (
              <HandoverRow key={h.id} handover={h} />
            ))}
          </Card>
        </div>
      </div>
    </Page>
  );
}
