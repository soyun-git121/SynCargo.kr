import Link from "next/link";
import { cn } from "cn";
import { Card, CardHeader, ListItem } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { Page } from "@/components/app/page-header";
import { Pill, StatusPill } from "@/components/app/status-pill";
import { getHome } from "@syncargo/backend/data";
import { TODAY, formatKoreanDate, formatMD } from "@/lib/date";
import { NO_CODE_LABEL } from "@/lib/labels";
import { caseHref } from "@/lib/links";
import { ReviewCard, ReviewStat } from "./review-widgets";
import { StatTile } from "./stat-tile";

/** W-01 홈 */
export default async function HomePage() {
  const { user, receivedHandover, tasks, movedCases } = await getHome();
  const urgentTasks = tasks.filter((t) => t.daysLeft <= 2).length;
  const movedNeedsCheck = movedCases.filter((c) => c.status === "needs_check").length;

  return (
    <Page crumbs={[{ label: "홈" }]}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{formatKoreanDate(TODAY)}</p>
        <h1 className="text-[26px] font-bold text-foreground">
          {user.name}님, 오늘 처리해야 할 일이 {tasks.length}건 있어요
        </h1>
      </div>

      {receivedHandover && (
        <div className="flex items-center justify-between rounded-xl bg-brand-soft px-[18px] py-3.5">
          <div className="flex items-center gap-2.5">
            <Pill tone="blue">받은 인계</Pill>
            <p className="text-[15px] font-medium text-foreground">
              {receivedHandover.fromName} → 나 · {receivedHandover.shipperSummary} ·{" "}
              {formatMD(receivedHandover.approvedAt)} 승인 완료
            </p>
          </div>
          <Link href="/handover" className="text-sm font-semibold text-primary hover:underline">
            받은 인계 보기 →
          </Link>
        </div>
      )}

      <div className="flex gap-3">
        <StatTile tone="red" label="처리해야 할 일" value={tasks.length} sub={`D-2 이내 ${urgentTasks}건`} />
        <StatTile label="오늘 움직인 건" value={movedCases.length} sub={`확인 필요 ${movedNeedsCheck}건`} href="/cases" />
        <ReviewStat />
      </div>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-3">
          <CardHeader
            title="오늘 움직인 건"
            description="메일에서 바뀐 내용이 있는 건 · 확인 필요가 먼저 보여요"
            action={
              <Link href="/cases" className="text-sm font-semibold text-primary hover:underline">
                전체 보기 →
              </Link>
            }
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
              <span className="w-[100px]">화주</span>
              <span className="w-[130px]">건 번호</span>
              <span className="flex-1">바뀐 내용</span>
              <span className="w-[90px]">상태</span>
            </div>
            {movedCases.map((c) => (
              <Link
                key={c.id}
                href={caseHref(c)}
                className={cn(
                  "flex items-center gap-4 border-b border-divider px-4 py-3.5 text-sm transition-colors hover:bg-subtle",
                  c.status === "needs_check" && "bg-danger-row hover:bg-danger-soft",
                )}
              >
                <span className="w-[100px] font-semibold text-foreground">{c.shipperName}</span>
                <span className="w-[130px]">
                  <CaseCode code={c.code} className="font-medium" />
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground">{c.latestChange?.text}</span>
                <span className="w-[90px]">
                  <StatusPill status={c.status} />
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="flex w-[400px] shrink-0 flex-col gap-5">
          <Card className="flex flex-col gap-1">
            <CardHeader title="처리해야 할 일" description="기한 가까운 순" />
            <div className="flex flex-col">
              {tasks.map((t) => (
                <Link key={t.id} href={caseHref(t.case)} className="block hover:bg-subtle/60">
                  <ListItem
                    title={t.title}
                    subtitle={`${t.case.shipperName} · ${t.case.code ?? NO_CODE_LABEL} · ${formatMD(t.dueDate)}`}
                    action={<DdayBadge date={t.dueDate} />}
                  />
                </Link>
              ))}
            </div>
          </Card>
          <ReviewCard />
        </div>
      </div>
    </Page>
  );
}
