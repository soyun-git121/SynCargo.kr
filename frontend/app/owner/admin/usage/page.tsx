import { Card, CardHeader } from "@/components/app/card";
import { Page, PageTitle } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { getContract } from "@syncargo/backend/data";
import { AdminNotice } from "../admin-notice";

const num = (n: number) => n.toLocaleString("ko-KR");

/** R-12 관리 · 계약·사용량: 처리량을 막대로 · '만들지 않는 것' 원칙을 카드로 남김 */
export default async function AdminUsagePage() {
  const c = await getContract();
  const pct = Math.round((c.usedThisMonth / c.monthlyQuota) * 100);
  return (
    <Page owner crumbs={[{ label: "관리자 모드" }, { label: "계약·사용량" }]}>
      <AdminNotice />
      <PageTitle title="계약·사용량" description="포함 팀 · 처리량 · 보존 범위" />

      <div className="flex gap-3">
        <StatTile label="포함 팀 · 사서함" value={`${c.teams}팀 · 사서함 ${c.mailboxCount}개`} unit="" />
        <StatTile label="이번 달 처리량" value={num(c.usedThisMonth)} unit="통" tone="blue" />
        <StatTile label="보존 범위" value={c.retentionYears} unit="년" />
      </div>

      <Card className="flex flex-col gap-3">
        <CardHeader
          title="처리량"
          description="이번 달 계약 처리량"
          action={
            <span className="text-sm font-bold text-foreground">
              {num(c.usedThisMonth)} / {num(c.monthlyQuota)}통
            </span>
          }
        />
        <div
          className="h-2.5 overflow-hidden rounded-full bg-stat"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="이번 달 처리량"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold text-primary">{pct}% 사용</span>
          <span className="text-muted-foreground">남은 처리량 {num(c.monthlyQuota - c.usedThisMonth)}통</span>
        </div>
        <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-primary">이번 달 계약 처리량의 {pct}%를 썼어요.</p>
      </Card>

      <div className="flex items-start gap-5">
        <Card className="flex flex-1 flex-col gap-3">
          <CardHeader title="계약" />
          <dl className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">요금제</dt>
              <dd className="text-[15px] font-semibold text-foreground">
                {c.plan} · 좌석 {c.seats}개
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">다음 결제일</dt>
              <dd className="text-[15px] font-semibold text-foreground">{c.nextBillingDate}</dd>
            </div>
          </dl>
        </Card>
        <section className="flex flex-1 flex-col gap-3 rounded-[14px] border border-border bg-subtle px-[22px] py-5">
          <CardHeader title="만들지 않는 것" description="직원별 처리량 · 실수 집계" />
          <p className="text-sm text-ink-2">감시 도구가 되면 실무자가 기록을 밖으로 숨깁니다.</p>
          <p className="text-sm text-ink-2">대표 화면은 화주·건의 미결 업무와 확인 필요 상태를 중심으로 둡니다.</p>
        </section>
      </div>
    </Page>
  );
}
