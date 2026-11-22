import Link from "next/link";
import { cn } from "cn";
import { Card, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { Page } from "@/components/app/page-header";
import { Pill, StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { getHome, type HomeTask } from "@syncargo/backend/data";
import { TODAY, ddayLabel, formatKoreanDate, formatMD, formatMDW } from "@/lib/date";
import { NO_CODE_LABEL } from "@/lib/labels";
import { caseHref, handoverHref, shipperHref } from "@/lib/links";
import { ReviewCard } from "./review-widgets";

/** W-01 홈 (리디자인 v2): 처리해야 할 일이 맨 위, 급함(D-2 이내) / 이번 주로 나눠 급한 순 */
export default async function HomePage() {
  const { user, receivedHandover, tasks, movedCases } = await getHome();
  const urgent = tasks.filter((t) => t.daysLeft <= 2);
  const later = tasks.filter((t) => t.daysLeft > 2);

  return (
    <Page crumbs={[{ label: "홈" }]}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{formatKoreanDate(TODAY)} · 오늘 할 일</p>
        <h1 className="text-[26px] font-bold text-foreground">
          {user.name}님, 오늘 처리해야 할 일이 {tasks.length}건 있어요
        </h1>
      </div>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-2 border-[1.5px] border-danger-border">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                처리해야 할 일 <Pill tone={tasks.length > 0 ? "red" : "gray"}>{tasks.length}</Pill>
              </span>
            }
            description="급한 순 · 기한이 가까운 일이 맨 위에 있어요"
            action={
              <Link href="/cases" className="text-sm font-semibold text-primary hover:underline">
                업무 건 전체 →
              </Link>
            }
          />
          {tasks.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">처리해야 할 일이 없어요.</p>}
          {urgent.length > 0 && <TaskGroup label="급함 · D-2 이내" urgent />}
          {urgent.map((t) => (
            <TaskRow key={t.id} task={t} urgent />
          ))}
          {later.length > 0 && <TaskGroup label="이번 주" />}
          {later.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </Card>

        <div className="flex w-[380px] shrink-0 flex-col gap-5">
          {receivedHandover && (
            <Card className="flex flex-col gap-2.5">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    받은 인계 <Pill tone="blue">1</Pill>
                  </span>
                }
              />
              <div className="flex flex-col gap-1 rounded-[10px] bg-brand-soft px-3.5 py-3">
                <p className="text-[15px] font-bold text-foreground">{receivedHandover.fromName} → 나</p>
                <p className="text-[13px] text-ink-2">
                  {receivedHandover.shipperSummary} · {formatMD(receivedHandover.approvedAt)} 승인 완료
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={handoverHref("received")}>받은 인계 보기 →</Link>
              </Button>
              <p className="text-xs text-muted-foreground">누르면 인계·미결 현황의 ‘받은 인계’ 탭으로 바로 가요</p>
            </Card>
          )}
          <ReviewCard />
        </div>
      </div>

      <Card className="flex flex-col gap-3">
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
            <span className="w-[110px]">화주</span>
            <span className="w-[130px]">건 번호</span>
            <span className="flex-1">바뀐 내용</span>
            <span className="w-[90px]">상태</span>
            <span className="w-5" />
          </div>
          {movedCases.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">오늘 메일에서 바뀐 건이 없어요.</p>
          )}
          {movedCases.map((c) => (
            <div
              key={c.id}
              className={cn(
                "relative flex items-center gap-4 border-b border-divider px-4 py-3.5 text-sm transition-colors hover:bg-subtle",
                c.status === "needs_check" && "bg-danger-row hover:bg-danger-soft",
              )}
            >
              <span className="w-[110px]">
                <Link
                  href={shipperHref(c.shipperId)}
                  className="relative z-10 font-semibold text-primary underline underline-offset-2"
                >
                  {c.shipperName}
                </Link>
              </span>
              <span className="w-[130px]">
                <CaseCode code={c.code} className="font-medium" />
              </span>
              {/* 행 전체가 건 상세로 가는 링크 (화주 이름은 위에 따로 링크) */}
              <Link href={caseHref(c)} className="min-w-0 flex-1 truncate text-foreground after:absolute after:inset-0">
                {c.latestChange?.text}
              </Link>
              <span className="w-[90px]">
                <StatusPill status={c.status} />
              </span>
              <span className="w-5 text-right text-lg text-faint">›</span>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}

function TaskGroup({ label, urgent }: { label: string; urgent?: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urgent ? "/figma/dot-urgent.svg" : "/figma/dot-week.svg"} alt="" width={8} height={8} className="size-2" />
      <p className={cn("text-[13px] font-bold", urgent ? "text-danger" : "text-ink-2")}>{label}</p>
    </div>
  );
}

function TaskRow({ task: t, urgent }: { task: HomeTask; urgent?: boolean }) {
  return (
    <Link
      href={caseHref(t.case)}
      className={cn(
        "group flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors",
        urgent ? "border-danger-border bg-danger-row hover:bg-danger-soft" : "border-border bg-card hover:bg-subtle",
      )}
    >
      <span
        className={cn(
          "flex h-[52px] w-16 shrink-0 items-center justify-center rounded-[10px] font-mono text-lg font-semibold",
          urgent ? "bg-danger-soft text-danger" : "bg-neutral-soft text-neutral",
        )}
      >
        {ddayLabel(t.dueDate)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-base font-bold text-foreground">{t.title}</span>
        <span className="text-[13px] text-muted-foreground">
          {t.case.shipperName} · {t.case.code ?? NO_CODE_LABEL} · {formatMDW(t.dueDate)}
        </span>
      </span>
      <span className="text-[13px] font-semibold text-primary group-hover:underline">건 상세 →</span>
      <span className="text-xl text-faint">›</span>
    </Link>
  );
}
