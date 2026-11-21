import Link from "next/link";
import { ArrowRightLeft, Flag, Mail, Phone, Sparkles, StickyNote } from "lucide-react";
import { cn } from "cn";
import { formatDateTime } from "@/lib/date";
import type { CaseEventType } from "@/lib/types";

export interface TimelineEntry {
  id: string;
  type: CaseEventType;
  title: string;
  description?: string;
  at: string;
  /** 원문 보기 링크 등 */
  href?: string;
  hrefLabel?: string;
}

const ICON: Record<CaseEventType, React.ComponentType<{ className?: string }>> = {
  mail: Mail,
  extracted: Sparkles,
  changed: ArrowRightLeft,
  stage: Flag,
  off_mail: Phone,
  note: StickyNote,
};

const TONE: Record<CaseEventType, string> = {
  mail: "bg-neutral-soft text-neutral",
  extracted: "bg-brand-soft text-primary",
  changed: "bg-warning-soft text-warning",
  stage: "bg-success-soft text-success",
  off_mail: "bg-neutral-soft text-neutral",
  note: "bg-neutral-soft text-neutral",
};

/** 건 상세 타임라인 (최신순) */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">기록이 없습니다.</p>;
  }
  return (
    <ol className={cn("relative", className)}>
      {entries.map((e, i) => {
        const Icon = ICON[e.type];
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < entries.length - 1 && (
              <span className="absolute top-8 bottom-0 left-[13px] w-px bg-border" aria-hidden />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                TONE[e.type],
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                <time className="shrink-0 font-mono text-xs text-muted-foreground">{formatDateTime(e.at)}</time>
              </div>
              {e.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{e.description}</p>}
              {e.href && (
                <Link href={e.href} className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                  {e.hrefLabel ?? "원문 보기"} →
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
