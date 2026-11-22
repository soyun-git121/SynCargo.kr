"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/** 한 줄 문구를 입력·수정하는 작은 모달 (반복 조건 수정·추가 등) */
export function TextEditDialog({
  open,
  onOpenChange,
  title,
  description,
  initial,
  placeholder,
  multiline,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  initial: string;
  placeholder?: string;
  /** 여러 줄 입력 (요약 수정 등) */
  multiline?: boolean;
  onSave: (text: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] gap-4 rounded-2xl p-5 sm:max-w-[440px]" showCloseButton={false}>
        {open && (
          <Form
            title={title}
            description={description}
            initial={initial}
            placeholder={placeholder}
            multiline={multiline}
            onCancel={() => onOpenChange(false)}
            onSave={(t) => {
              onSave(t);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Form({
  title,
  description,
  initial,
  placeholder,
  multiline,
  onCancel,
  onSave,
}: {
  title: string;
  description?: string;
  initial: string;
  placeholder?: string;
  multiline?: boolean;
  onCancel: () => void;
  onSave: (t: string) => void;
}) {
  const [text, setText] = useState(initial);
  const valid = text.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave(text.trim());
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        <DialogDescription className="text-[13px] text-muted-foreground">{description}</DialogDescription>
      </div>
      {multiline ? (
        <textarea
          autoFocus
          value={text}
          rows={6}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none rounded-lg border-2 border-primary bg-background px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-placeholder"
        />
      ) : (
        <input
          autoFocus
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          className="h-10 w-full rounded-lg border-2 border-primary bg-background px-3 text-sm outline-none placeholder:text-placeholder"
        />
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={!valid}>
          저장
        </Button>
      </div>
    </form>
  );
}
