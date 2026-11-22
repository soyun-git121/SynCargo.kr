import { cn } from "cn";
import { TopBar, type Crumb } from "./top-bar";

/** 페이지 틀: 상단바 + 본문(좌우 32px, 위 24px, 아래 40px, 블록 간격 20px) */
export function Page({
  crumbs,
  children,
  className,
  owner = false,
}: {
  crumbs: Crumb[];
  children: React.ReactNode;
  className?: string;
  /** 대표 화면: 검색이 회사 전체 · 대표 화면으로 이동 */
  owner?: boolean;
}) {
  return (
    <>
      <TopBar crumbs={crumbs} owner={owner} />
      <div className={cn("flex flex-col gap-5 px-8 pt-6 pb-10", className)}>{children}</div>
    </>
  );
}

/** 페이지 제목: 26px Bold + 14px 보조 문구 */
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-[26px] font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
