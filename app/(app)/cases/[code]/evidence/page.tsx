import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardHeader } from "@/components/app/card";
import { Page } from "@/components/app/page-header";
import { Pill } from "@/components/app/status-pill";
import { getCaseEvidence, getCurrentUser } from "@/lib/data";
import { formatDateTime, formatMD } from "@/lib/date";
import { NO_CODE_LABEL } from "@/lib/labels";
import { caseHref, evidenceHref, reviewHref } from "@/lib/links";
import { EditedValueNote, ValueEditButton } from "@/components/app/value-edit";

/** W-07 원문 보기: 추출된 항목 ↔ 근거 문장이 강조된 원문 메일 */
export default async function EvidencePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ item?: string }>;
}) {
  const [{ code }, { item: itemParam }] = await Promise.all([params, searchParams]);
  const [data, user] = await Promise.all([getCaseEvidence(code), getCurrentUser()]);
  if (!data) notFound();

  const { case: c, items } = data;
  const selected = items.find((x) => x.id === itemParam) ?? items[0];
  const codeLabel = c.code ?? NO_CODE_LABEL;

  return (
    <Page
      crumbs={[
        { label: "업무 건", href: "/cases" },
        { label: codeLabel, href: caseHref(c) },
        { label: "원문 보기" },
      ]}
    >
      <Link href={caseHref(c)} className="w-fit text-sm font-semibold text-primary hover:underline">
        ← 건 상세로
      </Link>

      <div className="flex items-start gap-5">
        <Card className="flex w-[420px] shrink-0 flex-col gap-2">
          <CardHeader title="추출된 항목" description="항목마다 근거 메일이 연결돼 있어요" />
          {items.length === 0 && <p className="py-4 text-sm text-muted-foreground">아직 추출된 항목이 없어요.</p>}
          {items.map((x) => {
            const on = x.id === selected?.id;
            return (
              <Link
                key={x.id}
                href={evidenceHref(c, x.id)}
                scroll={false}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border px-3.5 py-3 transition-colors",
                  on ? "border-primary bg-brand-soft" : "border-border hover:bg-subtle",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-semibold text-foreground">{x.title}</span>
                    {x.status === "needs_check" && <Pill tone="red">확인 필요</Pill>}
                  </div>
                  <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                    {formatMD(x.mail.receivedAt)} {x.sourceLabel}
                    <EditedValueNote itemId={x.id} />
                  </span>
                </div>
                {on ? <Pill tone="blue">보는 중</Pill> : <span className="text-[13px] font-semibold text-primary">보기</span>}
              </Link>
            );
          })}
        </Card>

        {selected && (
          <Card className="flex min-w-0 flex-1 flex-col gap-4">
            <CardHeader
              title="원문 메일"
              action={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Outlook에서 이 메일 열기 ↗</Button>
                  </TooltipTrigger>
                  <TooltipContent>메일 연동 후 Outlook 웹에서 이 메일이 열립니다 (데모에서는 비활성)</TooltipContent>
                </Tooltip>
              }
            />

            <div className="flex flex-col gap-1 border-b border-divider pb-3.5">
              <p className="text-xl font-bold text-foreground">{selected.mail.subject}</p>
              <p className="text-[13px] text-muted-foreground">
                보낸 사람 {selected.mail.from.name} · 받는 사람 {selected.mail.to.map((t) => t.name).join(", ")} ·{" "}
                {formatDateTime(selected.mail.receivedAt)}
              </p>
            </div>

            <MailBody
              body={selected.mail.bodyText}
              start={selected.evidence.start}
              end={selected.evidence.end}
              itemTitle={selected.title}
            />

            {selected.mail.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.mail.attachments.map((a, i) => (
                  <span key={a.id} className="rounded-lg border border-border bg-subtle px-3 py-2 text-[13px] font-medium text-ink-2">
                    첨부 {i + 1} · {a.fileName}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-divider pt-4">
              <p className="text-[13px] text-muted-foreground">추출 값이나 연결이 틀렸나요?</p>
              <div className="flex gap-2">
                <ValueEditButton
                  itemId={selected.id}
                  title={selected.title}
                  value={selected.value}
                  targetLabel={`${c.shipperName} · ${codeLabel}`}
                  mailId={selected.mail.id}
                  userName={user.name}
                />
                <Button variant="ghost" asChild>
                  <Link href={reviewHref("links", data.reviewItemIdByMail[selected.mail.id])}>연결 수정 (검토함)</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}

/** 메일 본문. 근거 문장은 노란 블록으로 꺼내 보여준다. */
function MailBody({ body, start, end, itemTitle }: { body: string; start: number; end: number; itemTitle: string }) {
  const before = body.slice(0, start).replace(/[ \t]+$/, "");
  const quote = body.slice(start, end);
  const after = body.slice(end).replace(/^[ \t]+/, "");
  const text = "text-[15px] leading-7 whitespace-pre-wrap text-ink-2";
  return (
    <div className="flex flex-col gap-3">
      {before.trim() && <p className={text}>{before.replace(/\n+$/, "")}</p>}
      <div className="flex flex-col gap-1.5 rounded-lg border-l-4 border-warning-border bg-warning-soft px-4 py-3.5">
        <p className="text-[17px] leading-normal font-medium text-foreground">“…{quote}”</p>
        <p className="text-xs font-semibold text-warning">이 문장이 ‘{itemTitle}’의 근거입니다</p>
      </div>
      {after.trim() && <p className={text}>{after.replace(/^\n+/, "")}</p>}
    </div>
  );
}
