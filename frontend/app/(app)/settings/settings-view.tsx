"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown, UnderlineTabs } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { MailScope, Member } from "@syncargo/backend/data";
import { useDemoState } from "@/lib/demo-state";
import { TODAY, formatDateTime } from "@/lib/date";
import { ROLE_LABEL } from "@/lib/labels";
import type { MailboxConnection, Role } from "@syncargo/backend/types";

export type SettingsTab = "mail" | "scope" | "members";

const STEPS = [
  { title: "환경 확인", desc: "회사 메일 환경 자동 확인" },
  { title: "연결 방식 선택", desc: "환경에 맞는 방식 안내" },
  { title: "읽을 범위 정하기", desc: "사서함과 기간 선택" },
];

const STATUS: Record<MailboxConnection["status"], { label: string; tone: "green" | "blue" | "red" | "gray" }> = {
  connected: { label: "연결됨", tone: "green" },
  syncing: { label: "동기화 중", tone: "blue" },
  error: { label: "연결 오류", tone: "red" },
  disconnected: { label: "연결 안 됨", tone: "gray" },
};

/** W-11 설정 · 메일 연결 (연결 상태 표시만. 실제 연결·해제는 Graph 연동 때) + W-15 · W-16 */
export function SettingsView({
  tab,
  mailbox,
  scope,
  members,
}: {
  tab: SettingsTab;
  mailbox: MailboxConnection | null;
  scope: MailScope;
  members: Member[];
}) {
  const router = useRouter();
  const { mailSetupDone } = useDemoState();
  const setTab = (t: SettingsTab) => router.replace(t === "mail" ? "/settings" : `/settings?tab=${t}`, { scroll: false });
  const [notice, setNotice] = useState<string | null>(null);
  const demoOnly = (what: string) => setNotice(`${what}는 실제 메일 연동(Microsoft Graph) 후에 동작합니다. 지금은 데모라 상태만 보여요.`);

  const lastSync = mailbox?.lastSyncAt
    ? `${mailbox.lastSyncAt.slice(0, 10) === TODAY ? `오늘 ${mailbox.lastSyncAt.slice(11, 16)}` : formatDateTime(mailbox.lastSyncAt)} · 실패 ${mailbox.lastSyncFailedCount}건`
    : "아직 없음";
  const done = mailSetupDone ? 3 : (mailbox?.setupStepsDone ?? 0);
  const status = STATUS[mailbox?.status ?? "disconnected"];

  return (
    <>
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "mail", label: "메일 연결" },
          { value: "scope", label: "사서함·기간 범위" },
          { value: "members", label: "구성원·권한" },
        ]}
      />

      {tab === "scope" ? (
        <ScopeTab scope={scope} />
      ) : tab === "members" ? (
        <MembersTab members={members} meId={mailbox?.userId ?? null} />
      ) : (
        <>
          {notice && (
            <p role="status" className="rounded-lg bg-brand-soft px-3.5 py-2.5 text-[13px] font-medium text-primary">
              {notice}
            </p>
          )}
          <div className="flex items-start gap-5">
            <Card className="flex min-w-0 flex-1 flex-col gap-[18px]">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">메일 연결 (Outlook)</h2>
                <Pill tone={status.tone}>{status.label}</Pill>
              </div>
              <dl className="flex gap-4">
                {[
                  ["계정", mailbox ? `${mailbox.email} · 회사 메일` : "—"],
                  ["연결 방식", "회사 환경을 확인한 뒤 맞는 방식으로 연결"],
                  ["마지막 동기화", lastSync],
                ].map(([k, v]) => (
                  <div key={k} className="flex min-w-0 flex-1 flex-col gap-1">
                    <dt className="text-xs font-medium text-muted-foreground">{k}</dt>
                    <dd className="text-[15px] font-semibold break-words text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => demoOnly("다시 연결")}>
                  다시 연결
                </Button>
                <Button variant="ghost" onClick={() => demoOnly("연결 해제")}>
                  연결 해제
                </Button>
              </div>
            </Card>

            <Card className="flex w-[460px] shrink-0 flex-col gap-1">
              <CardHeader title="연결 순서" description={`${STEPS.length}단계 중 ${done}단계 완료`} />
              {STEPS.map((s, i) => {
                const isDone = i < done;
                const isNow = i === done;
                return (
                  <div key={s.title} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
                    {isDone ? (
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success-soft">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/figma/check-green.svg" alt="" width={14} height={14} className="size-3.5" />
                      </span>
                    ) : (
                      <span
                        className={
                          isNow
                            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground"
                            : "flex size-7 shrink-0 items-center justify-center rounded-full bg-stat text-[13px] font-bold text-muted-foreground"
                        }
                      >
                        {i + 1}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-[15px] font-semibold text-foreground">{s.title}</span>
                      <span className="text-[13px] text-muted-foreground">{s.desc}</span>
                    </div>
                    {isDone ? <Pill tone="green">완료</Pill> : isNow ? <Pill tone="blue">지금 할 차례</Pill> : null}
                  </div>
                );
              })}
              {done < STEPS.length && (
                <Button className="mt-1 w-full" onClick={() => setTab("scope")}>
                  다음: {STEPS[done].title} →
                </Button>
              )}
            </Card>
          </div>

          <Card className="flex flex-col gap-2">
            <CardHeader title="안내" />
            {["메일은 읽기만 합니다. 보내거나 지우지 않습니다.", "회사가 허용한 사서함과 기간만 읽습니다."].map((t) => (
              <p key={t} className="rounded-lg bg-subtle px-3 py-2.5 text-[13px] leading-normal font-medium text-ink-2">
                {t}
              </p>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

/** W-15 사서함·기간 범위: 허용된 사서함과 아닌 사서함을 체크 상태로 구분 */
function ScopeTab({ scope }: { scope: MailScope }) {
  const router = useRouter();
  const demo = useDemoState();
  const allowedOf = (id: string, base: boolean) => demo.mailboxAllowed[id] ?? base;
  const [reading, setReading] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(scope.mailboxes.map((m) => [m.id, allowedOf(m.id, m.allowed)])),
  );
  const syncFrom = demo.companySyncFrom ?? scope.settings.syncFrom;
  const [from, setFrom] = useState(syncFrom);
  const fromOptions = Array.from(new Set([syncFrom, "2026-01-01", "2026-07-01", "2026-08-16"])).sort();

  return (
    <>
      <div className="flex items-start gap-5">
        <Card className="flex min-w-0 flex-1 flex-col gap-1">
          <CardHeader title="읽는 사서함" action={<Pill tone="gray">회사가 허용한 범위만</Pill>} />
          {scope.mailboxes.map((m) => {
            const allowed = allowedOf(m.id, m.allowed);
            const on = allowed && reading[m.id];
            return (
              <label
                key={m.id}
                className={cn(
                  "flex items-center gap-3 border-b border-divider py-4 last:border-b-0",
                  allowed ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                <input
                  type="checkbox"
                  checked={!!on}
                  disabled={!allowed}
                  onChange={(e) => setReading((prev) => ({ ...prev, [m.id]: e.target.checked }))}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30",
                    on ? "border-primary bg-primary" : allowed ? "border-field-border bg-background" : "border-border bg-stat",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {on && <img src="/figma/check-white.svg" alt="" width={14} height={14} className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn("text-[15px] font-semibold", allowed ? "text-foreground" : "text-faint")}>{m.label}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {m.email}
                    {m.kind === "shared" && (allowed ? " · 회사가 허용" : " · 허용되지 않음")}
                  </span>
                </span>
                {allowed ? (
                  <Pill tone={on ? "green" : "gray"}>{on ? "읽는 중" : "읽지 않음"}</Pill>
                ) : (
                  <Pill tone="gray">허용 안 됨</Pill>
                )}
              </label>
            );
          })}
        </Card>

        <Card className="flex w-[460px] shrink-0 flex-col gap-4">
          <CardHeader title="기간 범위" />
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">언제부터 읽을지</span>
            <Dropdown
              aria-label="언제부터 읽을지"
              value={from}
              onChange={setFrom}
              options={fromOptions.map((d) => ({ value: d, label: `${d}부터` }))}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">보존 기간</span>
            <div className="flex h-10 items-center rounded-lg border border-field-border bg-stat px-3 text-sm text-ink-2">
              회사 정책 · {scope.settings.retentionYears}년
            </div>
          </div>
        </Card>
      </div>

      <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-primary">
        범위를 넓히려면 대표(관리자)에게 요청하세요. 허용된 범위 밖의 메일은 읽지 않습니다.
      </p>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            demo.finishMailSetup();
            router.push("/home");
          }}
        >
          저장하고 홈으로 →
        </Button>
      </div>
    </>
  );
}

const SCOPE_LABEL: Record<Role, string> = { staff: "내 화주", lead: "팀 전체", ceo: "회사 전체" };
const ROLE_TONE: Record<Role, "gray" | "blue"> = { staff: "gray", lead: "blue", ceo: "blue" };

/** W-16 구성원·권한: 나를 강조, 권한 변경은 대표 화면에서 한다는 안내를 위로 */
function MembersTab({ members, meId }: { members: Member[]; meId: string | null }) {
  return (
    <>
      <p className="rounded-lg bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-primary">
        보기 전용 화면이에요. 권한은 대표만 바꿀 수 있습니다.
      </p>
      <Card className="flex flex-col gap-2">
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              구성원·권한 <Pill tone="gray">보기 전용</Pill>
            </span>
          }
          description="누가 어디까지 보는지"
        />
        <div className="flex flex-col" role="table">
          <div role="row" className="flex items-center gap-4 rounded-lg bg-subtle px-4 py-2.5 text-xs font-semibold text-muted-foreground">
            <span className="w-[260px]">이름</span>
            <span className="w-[200px]">역할</span>
            <span className="flex-1">조회 범위</span>
          </div>
          {members.map((m) => {
            const me = m.id === meId;
            return (
              <div
                key={m.id}
                role="row"
                className={cn("flex items-center gap-4 border-b border-divider px-4 py-3 text-sm", me && "bg-brand-soft")}
              >
                <span className="flex w-[260px] items-center gap-2.5">
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
                <span className="w-[200px]">
                  <Pill tone={ROLE_TONE[m.role]}>{ROLE_LABEL[m.role]}</Pill>
                </span>
                <span className="flex-1 text-foreground">{SCOPE_LABEL[m.role]}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
