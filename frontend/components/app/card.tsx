import { cn } from "cn";

/** 흰 배경 + 얇은 테두리 + 14px 라운드 카드 */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-[14px] border border-border bg-card px-[22px] py-5 text-card-foreground", className)}
      {...props}
    />
  );
}

/** 카드 머리: 18px Bold 제목 + 13px 보조 문구 + 오른쪽 액션 */
export function CardHeader({
  title,
  count,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  /** 제목 옆 회색 숫자 */
  count?: number;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          {count !== undefined && <span className="text-sm font-semibold text-muted-foreground">{count}</span>}
        </div>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2.5">{action}</div>}
    </div>
  );
}

/** 카드 안 목록 한 줄 (제목 15px + 보조 13px, 아래 구분선) */
export function ListItem({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-divider py-3.5 last:border-b-0", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-[15px] font-semibold text-foreground">{title}</div>
        {subtitle && <div className="text-[13px] text-muted-foreground">{subtitle}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
