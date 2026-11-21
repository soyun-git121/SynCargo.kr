"use client";

import { cn } from "cn";

/** Figma "dropdown": 흰 바탕, 1px #d5dae1 테두리, 높이 40, ▾ 표시 */
export function Dropdown<T extends string>({
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <label className={cn("relative flex h-10 items-center rounded-lg border border-field-border bg-background", className)}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full w-full cursor-pointer appearance-none bg-transparent pr-8 pl-3 text-sm font-medium text-ink-2 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-[13px] text-muted-foreground">▾</span>
    </label>
  );
}

/** Figma "checkbox": 20px, 선택 시 파란 바탕 + 흰 체크 */
export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-[5px] border peer-focus-visible:ring-3 peer-focus-visible:ring-primary/30",
          checked ? "border-primary bg-primary" : "border-field-border bg-background",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {checked && <img src="/figma/check-white.svg" alt="" width={14} height={14} className="size-3.5" />}
      </span>
      <span className="text-sm font-medium text-ink-2">{label}</span>
    </label>
  );
}

/** Figma 밑줄 탭 (검토함·업무 건 목록) */
export function UnderlineTabs<T extends string>({
  tabs,
  value,
  onChange,
  right,
}: {
  tabs: { value: T; label: string; badge?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end gap-7 border-b border-border" role="tablist">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-0.5 pt-2.5 pb-3 text-[15px]",
              active ? "border-primary font-bold text-foreground" : "border-transparent font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.badge}
          </button>
        );
      })}
      {right && <div className="ml-auto flex items-center gap-2.5 pb-2">{right}</div>}
    </div>
  );
}
