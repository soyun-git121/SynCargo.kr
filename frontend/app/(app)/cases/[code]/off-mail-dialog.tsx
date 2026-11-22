"use client";

import { useRef, useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Dropdown } from "@/components/app/form-controls";
import { demoNow, useDemoState } from "@/lib/demo-state";
import { OFF_MAIL_SOURCE_LABEL } from "@/lib/labels";
import type { OffMailInfo, OffMailSource } from "@syncargo/backend/types";

const FIELDS = ["선사 서류 마감", "화물 반입 마감", "선적일", "도착일", "도착지 창고", "기타"];
const SOURCES = Object.keys(OFF_MAIL_SOURCE_LABEL) as OffMailSource[];

const toInput = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
const fromInput = (v: string) => {
  const m = v.trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})$/);
  return m ? `${m[1]}T${m[2]}:00+09:00` : null;
};

/** W-06 메일 밖 정보 입력 (추가·수정 겸용). 저장은 클라이언트 상태에만. */
export function OffMailDialog({
  open,
  onOpenChange,
  caseId,
  caseLabel,
  editing,
  userId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caseId: string;
  caseLabel: string;
  /** 수정할 항목 (없으면 새로 입력) */
  editing: OffMailInfo | null;
  userId: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] gap-0 rounded-2xl p-7 sm:max-w-[640px]" showCloseButton={false}>
        {open && (
          <OffMailForm
            key={editing?.id ?? "new"}
            caseId={caseId}
            caseLabel={caseLabel}
            editing={editing}
            userId={userId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OffMailForm({
  caseId,
  caseLabel,
  editing,
  userId,
  onDone,
}: {
  caseId: string;
  caseLabel: string;
  editing: OffMailInfo | null;
  userId: string;
  onDone: () => void;
}) {
  const { saveOffMail } = useDemoState();
  const [field, setField] = useState(editing?.field ?? FIELDS[0]);
  const [value, setValue] = useState(editing?.value ?? "");
  const [source, setSource] = useState<OffMailSource>(editing?.source ?? "carrier_site");
  const [confirmedAt, setConfirmedAt] = useState(toInput(editing?.confirmedAt ?? demoNow()));
  const [memo, setMemo] = useState(editing?.memo ?? "");
  const [files, setFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const confirmedIso = fromInput(confirmedAt);
  const valid = value.trim().length > 0 && confirmedIso !== null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    saveOffMail({
      id: editing?.id,
      createdAt: editing?.createdAt,
      caseId,
      field,
      value: value.trim(),
      source,
      memo: memo.trim(),
      confirmedAt: confirmedIso!,
      createdBy: userId,
    });
    onDone();
  };

  const label = "mb-1.5 block text-[13px] font-semibold text-ink-2";
  const input =
    "h-10 w-full rounded-lg border border-field-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-2 focus:border-primary focus:px-[11px]";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-xl font-bold text-foreground">메일 밖 정보 {editing ? "수정" : "입력"}</DialogTitle>
        <DialogDescription className="text-[13px] text-muted-foreground">
          메일·첨부에 없는 정보를 직접 남깁니다 · {caseLabel}
        </DialogDescription>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className={label}>항목</span>
          <Dropdown aria-label="항목" value={field} onChange={setField} options={FIELDS.map((f) => ({ value: f, label: f }))} />
        </div>
        <label>
          <span className={label}>값</span>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="예: 11/18 17:00"
            className={cn(input, touched && !value.trim() && "border-danger")}
          />
        </label>
      </div>

      <div>
        <span className={label}>출처</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="출처">
          {SOURCES.map((s) => {
            const on = s === source;
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSource(s)}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-medium",
                  on ? "border-[1.5px] border-primary bg-brand-soft font-semibold text-primary" : "border-field-border bg-background text-ink-2 hover:bg-subtle",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {on && <img src="/figma/check-blue.svg" alt="" width={14} height={14} className="size-3.5" />}
                {OFF_MAIL_SOURCE_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      <label>
        <span className={label}>확인 시점</span>
        <input
          value={confirmedAt}
          onChange={(e) => setConfirmedAt(e.target.value)}
          placeholder="2026-11-16 14:30"
          className={cn(input, touched && !confirmedIso && "border-danger")}
        />
        {touched && !confirmedIso && <span className="mt-1 block text-xs text-danger">YYYY-MM-DD HH:MM 형식으로 적어주세요</span>}
      </label>

      <label>
        <span className={label}>상세 메모</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={5}
          placeholder="통화 내용이나 메신저 대화를 그대로 붙여 넣어도 돼요"
          className="w-full resize-none rounded-lg border border-field-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-placeholder focus:border-primary"
        />
      </label>

      <div>
        <span className={label}>첨부</span>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const names = Array.from(e.dataTransfer.files).map((f) => f.name);
            if (names.length) setFiles((prev) => [...prev, ...names]);
          }}
          className={cn(
            "flex flex-col items-center gap-2.5 rounded-lg border border-dashed px-4 py-5 text-center",
            dragging ? "border-primary bg-brand-soft" : "border-field-border bg-subtle",
          )}
        >
          <p className="text-sm font-medium text-ink-2">캡처 이미지 · PDF · 문서 · 녹음 파일을 끌어다 놓으세요</p>
          {files.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-1.5">
              {files.map((f, i) => (
                <li key={`${f}-${i}`} className="flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs text-ink-2">
                  {f}
                  <button
                    type="button"
                    aria-label={`${f} 빼기`}
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-faint hover:text-foreground"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.hwp,audio/*"
            className="hidden"
            onChange={(e) => {
              const names = Array.from(e.target.files ?? []).map((f) => f.name);
              if (names.length) setFiles((prev) => [...prev, ...names]);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            파일 선택
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-divider pt-3">
        <p className="text-xs text-muted-foreground">출처와 확인 시점이 함께 기록됩니다.</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onDone}>
            취소
          </Button>
          <Button type="submit">저장</Button>
        </div>
      </div>
    </form>
  );
}
