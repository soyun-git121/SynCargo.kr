"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { UnderlineTabs } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import { TODAY, formatDateTime } from "@/lib/date";
import type { MailboxConnection } from "@/lib/types";

type Tab = "mail" | "scope" | "members";

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

/** W-11 설정 · 메일 연결 (연결 상태 표시만. 실제 연결·해제는 Graph 연동 때) */
export function SettingsView({ mailbox }: { mailbox: MailboxConnection | null }) {
  const [tab, setTab] = useState<Tab>("mail");
  const [notice, setNotice] = useState<string | null>(null);
  const demoOnly = (what: string) => setNotice(`${what}는 실제 메일 연동(Microsoft Graph) 후에 동작합니다. 지금은 데모라 상태만 보여요.`);

  const lastSync = mailbox?.lastSyncAt
    ? `${mailbox.lastSyncAt.slice(0, 10) === TODAY ? `오늘 ${mailbox.lastSyncAt.slice(11, 16)}` : formatDateTime(mailbox.lastSyncAt)} · 실패 ${mailbox.lastSyncFailedCount}건`
    : "아직 없음";
  const done = mailbox?.setupStepsDone ?? 0;
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

      {tab !== "mail" ? (
        <Card className="flex flex-col items-center gap-2 py-20 text-center">
          <p className="text-base font-bold">준비 중입니다</p>
          <p className="text-sm text-muted-foreground">
            {tab === "scope" ? "사서함·기간 범위 설정" : "구성원·권한 관리"}은 다음 단계에서 제공됩니다.
          </p>
        </Card>
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
