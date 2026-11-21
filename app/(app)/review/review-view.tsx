"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown, UnderlineTabs } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import { EditedValueNote, ValueEditButton } from "@/components/app/value-edit";
import type { CorrectionLogDetail, ReviewItemDetail } from "@/lib/data";
import { useDemoState, type LocalCorrection } from "@/lib/demo-state";
import { formatDateTime, formatMD, TODAY, daysUntil } from "@/lib/date";
import { EXTRACTED_FIELD_LABEL, NO_CODE_LABEL } from "@/lib/labels";

export type ReviewTab = "links" | "unclassified" | "history";

type LinkOptions = {
  shippers: { id: string; name: string }[];
  cases: { id: string; code: string | null; shipperId: string; label: string; done: boolean }[];
};

type Props = {
  items: ReviewItemDetail[];
  linkOptions: LinkOptions;
  logs: CorrectionLogDetail[];
  users: { id: string; name: string }[];
  userName: string;
  initialTab: ReviewTab;
  initialItemId: string | null;
  evidenceHrefByMail: Record<string, string | null>;
};

export function ReviewView(props: Props) {
  const { items, initialTab } = props;
  const demo = useDemoState();
  const [tab, setTab] = useState<ReviewTab>(initialTab);
  const open = items.filter((r) => !demo.reviewDecisions[r.id]);
  const links = open.filter((r) => r.type === "link_check");
  const unclassified = open.filter((r) => r.type === "unclassified");

  const [person, setPerson] = useState("all");
  const [period, setPeriod] = useState<"7d" | "today" | "all">("7d");

  const right =
    tab === "links" ? (
      <span className="text-[13px] text-muted-foreground">틀린 연결을 발견하고 고치는 곳</span>
    ) : tab === "unclassified" ? (
      <span className="text-[13px] text-muted-foreground">어느 건에도 붙지 않은 메일</span>
    ) : (
      <>
        <Dropdown
          aria-label="사람"
          value={person}
          onChange={setPerson}
          className="w-[120px]"
          options={[{ value: "all", label: "사람: 전체" }, ...props.users.map((u) => ({ value: u.name, label: `사람: ${u.name}` }))]}
        />
        <Dropdown
          aria-label="기간"
          value={period}
          onChange={setPeriod}
          className="w-[120px]"
          options={[
            { value: "7d", label: "기간: 최근 7일" },
            { value: "today", label: "기간: 오늘" },
            { value: "all", label: "기간: 전체" },
          ]}
        />
      </>
    );

  return (
    <>
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        right={right}
        tabs={[
          { value: "links", label: "확인 필요한 연결", badge: <Pill tone={links.length ? "red" : "gray"}>{links.length}</Pill> },
          { value: "unclassified", label: "미분류 메일", badge: <Pill tone="gray">{unclassified.length}</Pill> },
          { value: "history", label: "수정 이력" },
        ]}
      />
      {tab === "links" && <LinksTab {...props} open={links} />}
      {tab === "unclassified" && <UnclassifiedTab {...props} open={unclassified} />}
      {tab === "history" && (
        <HistoryTab logs={props.logs} person={person} period={period} evidenceHrefByMail={props.evidenceHrefByMail} />
      )}
    </>
  );
}

/* ───────────── 공통 ───────────── */

function usePicked(open: ReviewItemDetail[], initialItemId: string | null) {
  const [picked, setPicked] = useState<string | null>(initialItemId);
  const current = open.find((r) => r.id === picked) ?? open[0] ?? null;
  return [current, setPicked] as const;
}

function QueueList({
  title,
  open,
  current,
  onPick,
  subtitle,
}: {
  title: string;
  open: ReviewItemDetail[];
  current: ReviewItemDetail | null;
  onPick: (id: string) => void;
  subtitle: (r: ReviewItemDetail) => string;
}) {
  return (
    <Card className="flex w-[400px] shrink-0 flex-col gap-2">
      <CardHeader title={title} count={open.length} />
      {open.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">모두 확인했어요.</p>}
      {open.map((r) => {
        const on = r.id === current?.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onPick(r.id)}
            aria-current={on ? "true" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[10px] border px-3.5 py-3 text-left transition-colors",
              on ? "border-primary bg-brand-soft" : "border-border hover:bg-subtle",
            )}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[15px] font-semibold text-foreground">{r.mail.subject}</span>
              <span className="truncate text-[13px] text-muted-foreground">{subtitle(r)}</span>
            </span>
            {on && <Pill tone="blue">보는 중</Pill>}
          </button>
        );
      })}
    </Card>
  );
}

/** 메일 머리 + "원문 전체 보기" (원문 보기 화면이 있으면 그리로, 없으면 펼침) */
function MailHead({ r, evidenceHref }: { r: ReviewItemDetail; evidenceHref: string | null }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate text-xl font-bold text-foreground">{r.mail.subject}</h2>
          <p className="text-[13px] text-muted-foreground">
            보낸 사람 {r.mail.from.name} · {formatDateTime(r.mail.receivedAt)}
          </p>
        </div>
        {evidenceHref ? (
          <Link href={evidenceHref} className="shrink-0 text-sm font-semibold text-primary hover:underline">
            원문 전체 보기 ↗
          </Link>
        ) : (
          <button onClick={() => setExpanded((v) => !v)} className="shrink-0 text-sm font-semibold text-primary hover:underline">
            {expanded ? "원문 접기" : "원문 전체 보기 ↓"}
          </button>
        )}
      </div>
      {expanded && (
        <p className="rounded-lg border border-border bg-subtle px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-ink-2">{r.mail.bodyText}</p>
      )}
    </>
  );
}

const fieldBox = "h-11 w-full appearance-none rounded-lg bg-background px-3.5 pr-8 text-[15px] text-foreground outline-none";

/* ───────────── W-10 확인 필요한 연결 ───────────── */

function LinksTab({ open, linkOptions, userName, initialItemId, evidenceHrefByMail }: Props & { open: ReviewItemDetail[] }) {
  const [current, setPicked] = usePicked(open, initialItemId);
  return (
    <div className="flex items-start gap-5">
      <QueueList title="확인 대기 목록" open={open} current={current} onPick={setPicked} subtitle={(r) => r.summary} />
      {current ? (
        <LinkDetail
          key={current.id}
          r={current}
          linkOptions={linkOptions}
          userName={userName}
          evidenceHref={evidenceHrefByMail[current.mail.id]}
        />
      ) : (
        <Card className="flex flex-1 flex-col items-center gap-1 py-16 text-center">
          <p className="text-base font-bold">확인할 연결이 없어요</p>
          <p className="text-sm text-muted-foreground">고친 내용은 수정 이력 탭에서 볼 수 있어요.</p>
        </Card>
      )}
    </div>
  );
}

function LinkDetail({
  r,
  linkOptions,
  userName,
  evidenceHref,
}: {
  r: ReviewItemDetail;
  linkOptions: LinkOptions;
  userName: string;
  evidenceHref: string | null;
}) {
  const { resolveReview } = useDemoState();
  const top = r.candidateDetails[0];
  const [shipperId, setShipperId] = useState(top?.shipper.id ?? linkOptions.shippers[0].id);
  const [caseId, setCaseId] = useState<string>(top?.case?.id ?? "");
  const caseRef = useRef<HTMLSelectElement>(null);

  const shipperName = (id: string) => linkOptions.shippers.find((s) => s.id === id)?.name ?? "";
  const caseCode = (id: string) => {
    const c = linkOptions.cases.find((x) => x.id === id);
    return c ? (c.code ?? NO_CODE_LABEL) : "건 없음";
  };
  const casesForShipper = linkOptions.cases.filter((c) => c.shipperId === shipperId);
  const changed = shipperId !== top?.shipper.id || caseId !== (top?.case?.id ?? "");

  const confirm = () => {
    const after = caseId ? caseCode(caseId) : shipperName(shipperId);
    const before = top ? (top.case ? (top.case.code ?? NO_CODE_LABEL) : top.shipper.name) : null;
    const correction: Omit<LocalCorrection, "id" | "correctedAt"> = changed
      ? {
          kind: shipperId !== top?.shipper.id ? "link_shipper" : "link_case",
          label: shipperId !== top?.shipper.id ? "화주 연결 변경" : "연결 변경",
          before: shipperId !== top?.shipper.id ? (top?.shipper.name ?? null) : before,
          after: shipperId !== top?.shipper.id ? shipperName(shipperId) : after,
          targetLabel: `${shipperName(shipperId)} · ${caseId ? caseCode(caseId) : "건 없음"}`,
          mailId: r.mail.id,
          correctedByName: userName,
        }
      : {
          kind: "link_case",
          label: "제안대로 연결 확정",
          before: null,
          after: null,
          targetLabel: `${shipperName(shipperId)} · ${caseId ? caseCode(caseId) : "건 없음"}`,
          mailId: r.mail.id,
          correctedByName: userName,
        };
    resolveReview(r.id, { kind: "link", shipperId, caseId: caseId || null }, correction);
  };

  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-[18px]">
      <MailHead r={r} evidenceHref={evidenceHref} />
      <p className="rounded-lg bg-warning-soft px-3 py-2.5 text-[13px] leading-normal font-medium text-warning">애매한 이유 · {r.reason}</p>

      <div className="flex flex-col gap-2.5">
        <h3 className="text-[15px] font-bold text-foreground">제안된 연결</h3>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-2">화주</span>
            <span className="relative">
              <select
                value={shipperId}
                onChange={(e) => {
                  setShipperId(e.target.value);
                  setCaseId(linkOptions.cases.find((c) => c.shipperId === e.target.value && !c.done)?.id ?? "");
                }}
                className={cn(fieldBox, "border border-field-border focus:border-2 focus:border-primary")}
              >
                {linkOptions.shippers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id === top?.shipper.id ? `제안: ${s.name}` : s.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">▾</span>
            </span>
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink-2">업무 건</span>
            <span className="relative">
              <select
                ref={caseRef}
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className={cn(fieldBox, "border-2 border-primary")}
              >
                <option value="">건 없음 (화주에만 연결)</option>
                {casesForShipper.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id === top?.case?.id ? `제안: ${c.code ?? NO_CODE_LABEL}` : c.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">▾</span>
            </span>
          </label>
        </div>
        {r.candidateDetails.length > 1 && (
          <p className="text-xs text-muted-foreground">
            다른 후보:{" "}
            {r.candidateDetails
              .slice(1)
              .map((c) => `${c.shipper.name}${c.case ? ` · ${c.case.code ?? NO_CODE_LABEL}` : ""} (${Math.round(c.confidence * 100)}%)`)
              .join(", ")}
          </p>
        )}
      </div>

      {r.extractedItems.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[15px] font-bold text-foreground">추출 항목</h3>
          {r.extractedItems.map((x) => {
            const warn = x.status === "needs_check";
            return (
              <div
                key={x.id}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] border px-3.5 py-3",
                  warn ? "border-danger-border bg-danger-row" : "border-border",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-medium text-muted-foreground">{EXTRACTED_FIELD_LABEL[x.field]}</span>
                    <span className="font-mono text-base font-semibold text-foreground">{x.value}</span>
                    {warn && <Pill tone="red">확인 필요</Pill>}
                    <EditedValueNote itemId={x.id} />
                  </div>
                  {warn && x.previousValue && (
                    <span className="text-[13px] text-muted-foreground">메일 본문과 첨부 금액이 다름 · 첨부 {x.previousValue}</span>
                  )}
                </div>
                <ValueEditButton
                  itemId={x.id}
                  title={EXTRACTED_FIELD_LABEL[x.field]}
                  value={x.value}
                  targetLabel={`${shipperName(shipperId)} · ${caseId ? caseCode(caseId) : "건 없음"}`}
                  mailId={r.mail.id}
                  userName={userName}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-divider pt-4">
        <Button variant="outline" onClick={() => caseRef.current?.focus()}>
          수정
        </Button>
        <Button onClick={confirm}>{changed ? "바꾼 대로 확정" : "이대로 확정"}</Button>
      </div>
    </Card>
  );
}

/* ───────────── W-13 미분류 메일 ───────────── */

function UnclassifiedTab({ open, linkOptions, userName, initialItemId, evidenceHrefByMail }: Props & { open: ReviewItemDetail[] }) {
  const [current, setPicked] = usePicked(open, initialItemId);
  return (
    <div className="flex items-start gap-5">
      <QueueList
        title="미분류 메일"
        open={open}
        current={current}
        onPick={setPicked}
        subtitle={(r) => `${r.summary} · ${formatMD(r.mail.receivedAt)}`}
      />
      {current ? (
        <UnclassifiedDetail
          key={current.id}
          r={current}
          linkOptions={linkOptions}
          userName={userName}
          evidenceHref={evidenceHrefByMail[current.mail.id]}
        />
      ) : (
        <Card className="flex flex-1 flex-col items-center gap-1 py-16 text-center">
          <p className="text-base font-bold">미분류 메일이 없어요</p>
          <p className="text-sm text-muted-foreground">모든 메일이 화주·건에 붙었어요.</p>
        </Card>
      )}
    </div>
  );
}

type Choice = "existing" | "new_case" | "exclude";

function UnclassifiedDetail({
  r,
  linkOptions,
  userName,
  evidenceHref,
}: {
  r: ReviewItemDetail;
  linkOptions: LinkOptions;
  userName: string;
  evidenceHref: string | null;
}) {
  const { resolveReview } = useDemoState();
  const [choice, setChoice] = useState<Choice>("new_case");
  const [target, setTarget] = useState("");
  const newName = r.suggestedShipperName ?? r.mail.from.name;
  const active = linkOptions.cases.filter((c) => !c.done);
  const shipperName = (id: string) => linkOptions.shippers.find((s) => s.id === id)?.name ?? "";
  const canConfirm = choice !== "existing" || target !== "";

  const confirm = () => {
    if (!canConfirm) return;
    if (choice === "existing") {
      const c = active.find((x) => x.id === target)!;
      resolveReview(r.id, { kind: "link", shipperId: c.shipperId, caseId: c.id }, {
        kind: "link_case",
        label: "미분류 메일을 기존 건에 연결",
        before: null,
        after: null,
        targetLabel: `${shipperName(c.shipperId)} · ${c.code ?? NO_CODE_LABEL}`,
        mailId: r.mail.id,
        correctedByName: userName,
      });
    } else if (choice === "new_case") {
      resolveReview(r.id, { kind: "new_case", shipperName: newName }, {
        kind: "new_case",
        label: "미분류 메일을 새 건으로 만듦",
        before: null,
        after: null,
        targetLabel: `${newName} · ${NO_CODE_LABEL}`,
        mailId: r.mail.id,
        correctedByName: userName,
      });
    } else {
      resolveReview(r.id, { kind: "exclude" }, {
        kind: "exclude",
        label: "업무와 무관으로 제외",
        before: null,
        after: null,
        targetLabel: null,
        mailId: r.mail.id,
        correctedByName: userName,
      });
    }
  };

  const option = (value: Choice, title: string, desc: string, extra?: React.ReactNode) => {
    const on = choice === value;
    return (
      <div
        role="radio"
        aria-checked={on}
        tabIndex={0}
        onClick={() => setChoice(value)}
        onKeyDown={(e) => (e.key === " " || e.key === "Enter") && setChoice(value)}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-[10px] bg-background px-3 py-3.5 outline-none",
          on ? "border-2 border-primary px-[11px] py-[13px]" : "border border-border hover:bg-subtle",
        )}
      >
        <span
          className={cn(
            "flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
            on ? "border-primary" : "border-field-border",
          )}
        >
          {on && <span className="size-2 rounded-full bg-primary" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted-foreground">{desc}</span>
        </span>
        {extra}
      </div>
    );
  };

  return (
    <Card className="flex min-w-0 flex-1 flex-col gap-[18px]">
      <MailHead r={r} evidenceHref={evidenceHref} />
      <p className="rounded-lg bg-subtle px-3 py-2.5 text-[13px] font-medium text-foreground">{r.reason}</p>
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="어디에 붙일까요?">
        <h3 className="text-[15px] font-bold text-foreground">어디에 붙일까요?</h3>
        {option(
          "existing",
          "기존 건에 연결",
          "화주와 건을 골라 붙입니다",
          <span className="relative w-[170px]" onClick={(e) => e.stopPropagation()}>
            <select
              aria-label="화주 · 건 선택"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setChoice("existing");
              }}
              className="h-10 w-full appearance-none rounded-lg border border-field-border bg-background pr-7 pl-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="">화주 · 건 선택</option>
              {active.map((c) => (
                <option key={c.id} value={c.id}>
                  {shipperName(c.shipperId)} · {c.code ?? NO_CODE_LABEL}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-muted-foreground">▾</span>
          </span>,
        )}
        {option("new_case", "새 건 만들기", `새 화주(${newName})·새 건으로 등록합니다`, <Pill tone="blue">추천</Pill>)}
        {option("exclude", "업무와 무관 (제외)", "목록에서 빼고 수정 이력에 기록만 남깁니다")}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-divider pt-4">
        {!canConfirm && <span className="text-xs text-danger">연결할 건을 골라 주세요</span>}
        <Button onClick={confirm} disabled={!canConfirm}>
          확정
        </Button>
      </div>
    </Card>
  );
}

/* ───────────── W-14 수정 이력 ───────────── */

function HistoryTab({
  logs,
  person,
  period,
  evidenceHrefByMail,
}: {
  logs: CorrectionLogDetail[];
  person: string;
  period: "7d" | "today" | "all";
  evidenceHrefByMail: Record<string, string | null>;
}) {
  const { localCorrections } = useDemoState();
  const rows = useMemo(() => {
    const all = [
      ...localCorrections.map((l) => ({
        ...l,
        evidenceHref: (l.mailId && evidenceHrefByMail[l.mailId]) || null,
        local: true,
      })),
      ...logs.map((l) => ({ ...l, local: false })),
    ];
    return all.filter((l) => {
      if (person !== "all" && l.correctedByName !== person) return false;
      const ago = -daysUntil(l.correctedAt);
      if (period === "today") return l.correctedAt.slice(0, 10) === TODAY;
      if (period === "7d") return ago <= 7;
      return true;
    });
  }, [logs, localCorrections, person, period, evidenceHrefByMail]);

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader title="수정 이력" description="누가 언제 무엇을 고쳤는지" />
      <div role="table" className="flex flex-col">
        <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
          <span className="w-[110px]">언제</span>
          <span className="w-[70px]">누가</span>
          <span className="flex-1">무엇을 고쳤는지</span>
          <span className="w-[190px]">대상</span>
          <span className="w-[60px]">근거</span>
        </div>
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">이 조건에 맞는 수정 이력이 없어요.</p>}
        {rows.map((l) => (
          <div
            key={l.id}
            role="row"
            className={cn("flex items-center gap-4 border-b border-divider px-4 py-3 text-sm", l.local && "bg-brand-soft/50")}
          >
            <span className="w-[110px] font-mono text-[13px] font-medium text-foreground">{formatDateTime(l.correctedAt)}</span>
            <span className="w-[70px] font-semibold text-foreground">{l.correctedByName}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2 text-foreground">
              <span className="truncate">{l.label}</span>
              {l.before && <span className="shrink-0 text-muted-foreground line-through">{l.before}</span>}
              {l.before && l.after && <span className="text-faint">→</span>}
              {l.after && <span className="truncate font-bold">{l.after}</span>}
              {l.local && <Pill tone="blue">방금</Pill>}
            </span>
            <span className="w-[190px] truncate text-ink-2">{l.targetLabel ?? "—"}</span>
            <span className="w-[60px]">
              {l.evidenceHref ? (
                <Link href={l.evidenceHref} className="text-[13px] font-semibold text-primary hover:underline">
                  원문 ↗
                </Link>
              ) : (
                <span className="text-faint">—</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
