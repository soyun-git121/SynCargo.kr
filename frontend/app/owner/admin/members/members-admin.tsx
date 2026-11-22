"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import { PageTitle } from "@/components/app/page-header";
import { Pill } from "@/components/app/status-pill";
import type { Member } from "@syncargo/backend/data";
import type { CompanyMailSettings, Role } from "@syncargo/backend/types";
import { formatMD } from "@/lib/date";
import { ROLE_LABEL } from "@/lib/labels";
import { ownerAssignHref } from "@/lib/links";

type Scope = "mine" | "team" | "company";
const SCOPE_LABEL: Record<Scope, string> = { mine: "내 화주", team: "팀 전체", company: "회사 전체" };
const DEFAULT_SCOPE: Record<Role, Scope> = { staff: "mine", lead: "team", ceo: "company" };

const MAIL_ACCESS: { value: CompanyMailSettings["ceoMailAccess"]; title: string; desc: string }[] = [
  { value: "evidence_only", title: "요약과 근거 문장만 (기본)", desc: "AI가 정리한 내용과 근거가 된 문장만 보여요" },
  { value: "shared_only", title: "담당자가 공유한 메일은 원문까지", desc: "담당자가 ‘원문 공유’를 누른 메일만 열려요" },
  { value: "full", title: "항상 원문까지", desc: "대표·팀장이 모든 메일 원문을 볼 수 있어요" },
];

/** R-11 구성원·권한 (관리자 모드) */
export function MembersAdmin({
  members,
  meId,
  initialMailAccess,
}: {
  members: Member[];
  meId: string;
  initialMailAccess: CompanyMailSettings["ceoMailAccess"];
}) {
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [scopes, setScopes] = useState<Record<string, Scope>>({});
  const [inactive, setInactive] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState(members.find((m) => m.leavingAt)?.id ?? members[0]?.id);
  // 기본값은 요약 + 근거 문장 (R-06 댓글 기준)
  const [mailAccess, setMailAccess] = useState(initialMailAccess === "full" ? "full" : "evidence_only");
  const [notice, setNotice] = useState<string | null>(null);

  const selected = members.find((m) => m.id === selectedId);
  const roleOf = (m: Member) => roles[m.id] ?? m.role;

  return (
    <>
      <PageTitle
        title="구성원·권한"
        description="실무자 · 팀장 · 대표의 조회 범위"
        actions={<Button onClick={() => setNotice("초대 메일은 회사 메일 연동 후 보낼 수 있어요.")}>+ 구성원 초대</Button>}
      />
      {notice && <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-primary">{notice}</p>}

      <div className="flex items-start gap-5">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Card className="flex flex-col gap-2">
            <CardHeader title="구성원" count={members.length} />
            <div className="flex flex-col" role="table">
              <div role="row" className="flex items-center gap-3 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <span className="w-[150px]">이름</span>
                <span className="w-[120px]">역할</span>
                <span className="w-[120px]">조회 범위</span>
                <span className="flex-1">상태</span>
                <span className="w-9" />
              </div>
              {members.map((m) => {
                const me = m.id === meId;
                const on = m.id === selectedId;
                const off = inactive[m.id];
                return (
                  <div key={m.id} role="row" className={cn("flex items-center gap-3 border-b border-divider px-4 py-3 text-sm", on && !me && "bg-brand-soft")}>
                    <span className="flex w-[150px] items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full text-[13px] font-bold",
                          me ? "bg-avatar text-primary" : "bg-stat text-ink-2",
                        )}
                      >
                        {m.name.slice(0, 1)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {m.name}
                        {me && " (나)"}
                      </span>
                    </span>
                    {me ? (
                      <>
                        <span className="w-[120px] text-foreground">{ROLE_LABEL[m.role]}</span>
                        <span className="w-[120px] text-foreground">{SCOPE_LABEL.company}</span>
                      </>
                    ) : (
                      <>
                        <Dropdown
                          aria-label={`${m.name} 역할`}
                          value={roleOf(m)}
                          onChange={(r) => {
                            setRoles((p) => ({ ...p, [m.id]: r }));
                            setScopes((p) => ({ ...p, [m.id]: DEFAULT_SCOPE[r] }));
                          }}
                          className="w-[120px]"
                          options={(["staff", "lead"] as const).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                        />
                        <Dropdown
                          aria-label={`${m.name} 조회 범위`}
                          value={scopes[m.id] ?? DEFAULT_SCOPE[roleOf(m)]}
                          onChange={(s) => setScopes((p) => ({ ...p, [m.id]: s }))}
                          className="w-[120px]"
                          options={(["mine", "team"] as const).map((s) => ({ value: s, label: SCOPE_LABEL[s] }))}
                        />
                      </>
                    )}
                    <span className="flex-1">
                      {off ? (
                        <Pill tone="gray">비활성</Pill>
                      ) : m.leavingAt ? (
                        <Pill tone="yellow">{formatMD(m.leavingAt)} 퇴사 예정</Pill>
                      ) : (
                        <Pill tone="green">사용 중</Pill>
                      )}
                    </span>
                    {me ? (
                      <span className="w-9 text-center text-faint">—</span>
                    ) : (
                      <button
                        type="button"
                        aria-label={`${m.name} 관리`}
                        aria-pressed={on}
                        onClick={() => setSelectedId(m.id)}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg border text-base leading-none font-bold text-ink-2",
                          on ? "border-[1.5px] border-primary text-primary" : "border-button-border bg-background hover:bg-subtle",
                        )}
                      >
                        ···
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <CardHeader title="메일 원문 열람 기준" description="대표·팀장이 실무자의 메일을 어디까지 볼지 정해요" />
            <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="메일 원문 열람 기준">
              {MAIL_ACCESS.map((o) => {
                const on = mailAccess === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMailAccess(o.value)}
                    className={cn(
                      "flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left",
                      on ? "border-2 border-primary bg-brand-soft/40 px-[15px] py-[13px]" : "border-border hover:bg-subtle",
                    )}
                  >
                    <span className={cn("flex size-5 items-center justify-center rounded-full border-2", on ? "border-primary" : "border-field-border")}>
                      {on && <span className="size-2.5 rounded-full bg-primary" />}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-foreground">{o.title}</span>
                      <span className="text-[13px] text-muted-foreground">{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">바꾼 기준은 누가 언제 바꿨는지 기록이 남아요.</p>
          </Card>
        </div>

        {selected && selected.id !== meId && (
          <Card className="flex w-[380px] shrink-0 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                {selected.leavingAt && <Pill tone="yellow">{formatMD(selected.leavingAt)} 퇴사 예정</Pill>}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {ROLE_LABEL[roleOf(selected)]} · {SCOPE_LABEL[scopes[selected.id] ?? DEFAULT_SCOPE[roleOf(selected)]]} · 담당 화주{" "}
                {selected.shipperCount}곳
              </p>
            </div>
            {selected.shipperCount > 0 && (
              <>
                {selected.leavingAt && (
                  <p className="rounded-lg bg-danger-soft px-3 py-2.5 text-[13px] font-medium text-danger-ink">
                    담당 화주 {selected.shipperCount}곳 · 건 {selected.activeCaseCount}개의 다음 담당자가 아직 없어요
                  </p>
                )}
                <Button asChild className="w-full">
                  <Link href={ownerAssignHref({ from: selected.id })}>담당 화주 인계하기 →</Link>
                </Button>
              </>
            )}

            <p className="pt-1 text-[15px] font-bold text-foreground">계정 처리</p>
            <div className="flex flex-col gap-2 rounded-xl border-2 border-primary px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-foreground">비활성화</span>
                <Pill tone="blue">추천</Pill>
              </div>
              <p className="text-[13px] leading-normal text-ink-2">로그인만 막고 기록은 그대로 남겨요. 화주 이력에 이름도 유지돼요.</p>
              <Button
                variant="outline"
                className="w-fit"
                disabled={inactive[selected.id]}
                onClick={() => setInactive((p) => ({ ...p, [selected.id]: true }))}
              >
                {inactive[selected.id] ? "비활성화됨" : "비활성화"}
              </Button>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border px-4 py-3.5">
              <span className="text-[15px] font-semibold text-danger">구성원 삭제</span>
              <p className="text-[13px] leading-normal text-ink-2">계정을 지워요. 담당 화주 인계가 끝나야 삭제할 수 있어요.</p>
              <Button variant="secondary" className="w-fit" disabled={selected.shipperCount > 0}>
                {selected.shipperCount > 0 ? "인계 후 삭제 가능" : "삭제"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
