"use client";

import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/app/card";
import { Dropdown } from "@/components/app/form-controls";
import { Pill } from "@/components/app/status-pill";
import type { MailScope } from "@syncargo/backend/data";
import { useDemoState } from "@/lib/demo-state";

const FROM_OPTIONS = ["2026-01-01", "2026-03-01", "2026-07-01", "2026-08-16"];

const PRINCIPLES = [
  ["읽기만 합니다", "발송·삭제는 하지 않음"],
  ["허용한 범위만 읽습니다", "범위 밖 메일은 읽지 않음"],
  ["범위 변경은 기록됩니다", "누가 언제 바꿨는지 남음"],
];

type Group = { key: string; title: string; sub: string; ids: string[]; readOnly?: boolean };

/** R-10 사서함 허용 범위 편집 */
export function MailScopeEditor({ scope }: { scope: MailScope }) {
  const demo = useDemoState();
  const allowedOf = (id: string, base: boolean) => demo.mailboxAllowed[id] ?? base;

  // 공용 사서함은 하나씩, 구성원 개인 사서함은 묶어서, 대표 사서함은 따로
  const shared = scope.mailboxes.filter((m) => m.kind === "shared");
  const personal = scope.mailboxes.filter((m) => m.kind === "personal" && m.label !== "대표 사서함");
  const ceo = scope.mailboxes.find((m) => m.label === "대표 사서함");
  const groups: Group[] = [
    ...shared.map((m) => ({
      key: m.id,
      title: `${m.label} · ${m.email.split("@")[0]}@`,
      sub: m.email.startsWith("ops") ? "업무팀이 읽어요" : "영업팀이 읽어요",
      ids: [m.id],
    })),
    { key: "personal", title: `개인 사서함 · 구성원 ${personal.length}명`, sub: "구성원 각자의 사서함", ids: personal.map((m) => m.id) },
    ...(ceo ? [{ key: ceo.id, title: "대표 사서함", sub: "읽지 않음", ids: [ceo.id], readOnly: true }] : []),
  ];

  const [on, setOn] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      groups.map((g) => [g.key, g.ids.every((id) => allowedOf(id, scope.mailboxes.find((m) => m.id === id)!.allowed))]),
    ),
  );
  const syncFrom = demo.companySyncFrom ?? scope.settings.syncFrom;
  const [from, setFrom] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, g.key.startsWith("cmb3") ? "2026-03-01" : syncFrom])),
  );
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const save = () => {
    const allowed: Record<string, boolean> = {};
    for (const g of groups) for (const id of g.ids) allowed[id] = !!on[g.key];
    const earliest = groups.filter((g) => on[g.key]).map((g) => from[g.key]).sort()[0] ?? syncFrom;
    demo.saveCompanyMailScope(allowed, earliest);
    setSaved(true);
  };

  return (
    <div className="flex items-start gap-5">
      <Card className="flex min-w-0 flex-1 flex-col gap-1">
        <CardHeader
          title="사서함"
          action={
            <Button variant="outline" onClick={() => setNotice("사서함 추가는 메일 연동(Microsoft Graph) 후에 할 수 있어요.")}>
              + 사서함 추가
            </Button>
          }
        />
        {notice && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] text-primary">{notice}</p>}
        {groups.map((g) => {
          const checked = !!on[g.key];
          return (
            <div key={g.key} className="flex items-center gap-3 border-b border-divider py-4">
              <label className={cn("flex min-w-0 flex-1 items-center gap-3", g.readOnly ? "cursor-not-allowed" : "cursor-pointer")}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={g.readOnly}
                  onChange={(e) => {
                    setOn((p) => ({ ...p, [g.key]: e.target.checked }));
                    setSaved(false);
                  }}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-[5px] border peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30",
                    checked ? "border-primary bg-primary" : "border-field-border bg-background",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {checked && <img src="/figma/check-white.svg" alt="" width={14} height={14} className="size-3.5" />}
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className={cn("text-[15px] font-semibold", g.readOnly ? "text-muted-foreground" : "text-foreground")}>{g.title}</span>
                  <span className="text-[13px] text-muted-foreground">{g.sub}</span>
                </span>
              </label>
              {g.readOnly ? (
                <Pill tone="gray">읽지 않음</Pill>
              ) : (
                <Dropdown
                  aria-label={`${g.title} 읽기 시작일`}
                  value={from[g.key]}
                  onChange={(v) => {
                    setFrom((p) => ({ ...p, [g.key]: v }));
                    setSaved(false);
                  }}
                  className={cn("w-[170px]", !checked && "opacity-60")}
                  options={Array.from(new Set([from[g.key], ...FROM_OPTIONS]))
                    .sort()
                    .map((d) => ({ value: d, label: `${d}부터` }))}
                />
              )}
            </div>
          );
        })}
        <div className="flex items-center justify-between pt-3">
          <p className="text-[13px] text-muted-foreground">
            {saved ? "저장했어요 · 실무자 설정(사서함·기간 범위)에 반영됐어요" : "저장하면 실무자 설정(사서함·기간 범위)에 바로 반영돼요"}
          </p>
          <Button onClick={save}>범위 저장</Button>
        </div>
      </Card>

      <Card className="flex w-[380px] shrink-0 flex-col gap-1">
        <CardHeader title="원칙" />
        {PRINCIPLES.map(([t, d]) => (
          <div key={t} className="flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0">
            <span className="flex size-7 items-center justify-center rounded-full bg-success-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/check-green.svg" alt="" width={14} height={14} className="size-3.5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold text-foreground">{t}</span>
              <span className="text-[13px] text-muted-foreground">{d}</span>
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
