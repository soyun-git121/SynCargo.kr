"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDemoState } from "@/lib/demo-state";

/** 원문 보기 > 값 수정: 추출 값을 고치고 수정 이력에 남긴다 (클라이언트 상태). */
export function ValueEditButton({
  itemId,
  title,
  value,
  targetLabel,
  mailId,
  userName,
}: {
  itemId: string;
  title: string;
  value: string | null;
  targetLabel: string;
  mailId: string;
  userName: string;
}) {
  const { editedValues, editValue } = useDemoState();
  const current = editedValues[itemId] ?? value ?? "";
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(current);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const next = draft.trim();
    if (!next || next === current) return setOpen(false);
    editValue(itemId, next, {
      kind: "value",
      label: `값 수정: ${title}`,
      before: current || null,
      after: next,
      targetLabel,
      mailId,
      correctedByName: userName,
    });
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          setDraft(current);
          setOpen(true);
        }}
      >
        값 수정
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px] gap-4 rounded-2xl p-5 sm:max-w-[400px]" showCloseButton={false}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-lg font-bold">값 수정</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">
                {title} · 고친 내용은 검토함 &gt; 수정 이력에 남아요
              </DialogDescription>
            </div>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-10 w-full rounded-lg border-2 border-primary bg-background px-3 text-sm outline-none"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 고친 값이 있으면 보여준다 */
export function EditedValueNote({ itemId }: { itemId: string }) {
  const { editedValues } = useDemoState();
  const v = editedValues[itemId];
  if (!v) return null;
  return <span className="text-xs font-semibold text-success">수정됨: {v}</span>;
}
