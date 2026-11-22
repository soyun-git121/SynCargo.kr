import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ActiveCaseCard } from "@/components/app/active-case-card";
import { Card, CardHeader } from "@/components/app/card";
import { EvidenceSentence } from "@/components/app/evidence-sentence";
import { Page } from "@/components/app/page-header";
import { Pill } from "@/components/app/status-pill";
import { StatTile } from "@/components/app/stat-tile";
import { getShipper } from "@syncargo/backend/data";
import { formatMD, formatMMDD } from "@/lib/date";
import { TRADE_TYPE_LABEL } from "@/lib/labels";
import { ownerAssignHref, ownerCaseHref, ownerShipperHistoryHref } from "@/lib/links";

/**
 * R-03 화주 카드 (대표 · 열람 전용): 실무자 화주 카드와 같은 모양
 * · 근거는 원문 대신 근거 문장 · '담당자 지정'은 이 화주와 현재 담당자가 미리 선택된 R-09로
 */
export default async function OwnerShipperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getShipper(decodeURIComponent(id));
  if (!d) notFound();
  const { shipper, owner, activeCases, doneCaseCount, patterns, changes } = d;

  return (
    <Page owner crumbs={[{ label: "화주", href: "/owner/shippers" }, { label: shipper.name }]}>
      <Card className="flex gap-6 p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[30px] font-bold text-foreground">{shipper.name}</h1>
              <Pill tone="gray">열람 전용</Pill>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={ownerShipperHistoryHref(shipper.id)}>화주 이력</Link>
              </Button>
              <Button asChild>
                <Link href={ownerAssignHref({ from: owner.id, shipper: shipper.id })}>담당자 지정</Link>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              `${TRADE_TYPE_LABEL[shipper.tradeType]} · ${shipper.route}`,
              `담당 ${owner.name}`,
              shipper.lastReviewedAt ? `최종 확인 ${shipper.lastReviewedAt}` : null,
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={t} className="rounded-full bg-stat px-3 py-1.5 text-[13px] text-ink-2">
                  {t}
                </span>
              ))}
          </div>
          <div className="flex gap-2.5">
            <StatTile label="지금 챙길 것" value={d.attentionCount} tone="red" />
            <StatTile label="진행 중" value={activeCases.length} />
            <StatTile label="완료" value={doneCaseCount} tone="green" />
          </div>
        </div>

        <div className="flex w-[400px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-subtle p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">담당자 메모</span>
            <span className="text-xs text-muted-foreground">
              {shipper.memoUpdatedAt ? `${d.memoUpdatedByName} · ${formatMD(shipper.memoUpdatedAt)}` : "메모 없음"}
            </span>
          </div>
          <p className="min-h-16 rounded-lg border border-field-border bg-background px-3 py-2.5 text-sm leading-[1.6] whitespace-pre-wrap text-foreground">
            {shipper.memo || "—"}
          </p>
          <span className="text-xs text-muted-foreground">보기 전용 · 담당자가 적는 메모예요</span>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">진행 중인 건</h2>
            <span className="text-sm font-semibold text-muted-foreground">{activeCases.length}</span>
          </div>
          <span className="text-sm font-semibold text-primary">지난 건 · 완료 {doneCaseCount}건</span>
        </div>
        {activeCases.length === 0 ? (
          <Card className="py-8 text-center text-sm text-muted-foreground">진행 중인 건이 없어요.</Card>
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {activeCases.map((c) => (
              <ActiveCaseCard key={c.id} c={c} href={ownerCaseHref(c)} />
            ))}
          </div>
        )}
      </section>

      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-1">
          <CardHeader title="반복 조건 · 주의사항" description="팀이 확인한 내용 · 열람 전용" />
          {patterns.length === 0 && <p className="py-4 text-sm text-muted-foreground">아직 정리된 조건이 없어요.</p>}
          {patterns.map((p) =>
            p.status === "suggested" ? (
              <div key={p.id} className="my-1 flex items-center gap-3 rounded-[10px] bg-danger-soft p-3.5">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground">{p.text}</span>
                    <Pill tone="red">확인 필요</Pill>
                  </div>
                  <span className="text-[13px] text-danger-ink">
                    {(p.note ?? "").split(" · ")[0]} · 담당자 확인 대기
                  </span>
                </div>
                <EvidenceSentence text={p.evidenceText} tone="red" />
              </div>
            ) : (
              <div key={p.id} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-medium text-foreground">{p.text}</span>
                  <span className="text-[13px] text-muted-foreground">
                    <span className="font-semibold text-success">확인됨</span> · {formatMD(p.confirmedAt!)} · {p.confirmedByName}
                  </span>
                </div>
                <EvidenceSentence text={p.evidenceText} />
              </div>
            ),
          )}
        </Card>

        <Card className="flex w-[440px] shrink-0 flex-col gap-1">
          <CardHeader
            title="변경 이력"
            description="조건이 바뀐 날짜와 근거"
            action={
              <Link href={ownerShipperHistoryHref(shipper.id)} className="text-sm font-semibold text-primary hover:underline">
                화주 이력 전체 →
              </Link>
            }
          />
          <ol className="mt-2 flex flex-col">
            {changes.slice(0, 3).map((ch, i, arr) => {
              const last = i === arr.length - 1;
              const open = ch.status === "needs_check";
              return (
                <li key={ch.id} className="flex gap-3.5">
                  <div className="flex w-3.5 shrink-0 flex-col items-center gap-1.5 pt-[5px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={open ? "/figma/dot-red.svg" : "/figma/dot-hollow.svg"} alt="" width={12} height={12} className="size-3" />
                    {!last && <span className="w-0.5 flex-1 bg-border" />}
                  </div>
                  <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", last ? "pb-1" : "pb-[18px]")}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[13px] font-medium text-muted-foreground">{formatMMDD(ch.at)}</span>
                      {open && <Pill tone="red">확인 필요</Pill>}
                    </div>
                    <span className="text-[15px] font-semibold text-foreground">{ch.title}</span>
                    {ch.before && ch.after && (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">{ch.before}</span>
                        <span className="text-faint">→</span>
                        <span className="font-bold text-foreground">{ch.after}</span>
                      </span>
                    )}
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{open ? "아직 확정 안 됨" : ch.sourceLabel}</span>
                      <EvidenceSentence text={ch.evidenceText} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </Page>
  );
}
