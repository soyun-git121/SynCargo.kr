import Link from "next/link";
import { cn } from "cn";

/** 건 번호 (고정폭 글꼴). href를 주면 링크. */
export function CaseCode({
  code,
  href,
  className,
}: {
  code: string;
  href?: string;
  className?: string;
}) {
  const cls = cn("font-mono text-[13px] font-medium tracking-tight text-foreground", className);
  if (href) {
    return (
      <Link href={href} className={cn(cls, "underline-offset-2 hover:text-primary hover:underline")}>
        {code}
      </Link>
    );
  }
  return <span className={cls}>{code}</span>;
}
