"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { useDemoState } from "@/lib/demo-state";
import { ROLE_LABEL } from "@/lib/labels";
import type { User } from "@/lib/types";
import { FigmaIcon } from "./icon";

const NAV = [
  { href: "/home", label: "홈", icon: "nav-home" },
  { href: "/shippers", label: "화주", icon: "nav-shippers" },
  { href: "/cases", label: "업무 건", icon: "nav-cases" },
  { href: "/handover", label: "인계", icon: "nav-handover" },
  { href: "/review", label: "검토함", icon: "nav-review", badge: true },
  { href: "/settings", label: "설정", icon: "nav-settings" },
];

/** 실무자 사이드바 (Figma "Sidebar / 실무자", 240px) */
export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { openReviewCount } = useDemoState();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col justify-between border-r border-border bg-sidebar px-3.5 pt-[22px] pb-[18px]">
      <div className="flex flex-col gap-6">
        <Link href="/home" className="flex items-center gap-2.5 px-2">
          <span className="flex size-[30px] items-center justify-center rounded-lg bg-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/logo-mark.svg" alt="" width={18} height={18} className="size-[18px]" />
          </span>
          <span className="text-lg font-bold text-foreground">SynCargo</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-[11px] text-[15px] transition-colors",
                  active ? "bg-sidebar-accent font-semibold text-primary" : "font-medium text-ink-2 hover:bg-subtle",
                )}
              >
                <FigmaIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
                {item.badge && openReviewCount > 0 && (
                  <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger tabular-nums">
                    {openReviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2.5 border-t border-border px-2 pt-3 pb-1">
        <span className="flex size-8 items-center justify-center rounded-full bg-avatar text-[13px] font-bold text-primary">
          {user.name.slice(0, 1)}
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
        </div>
      </div>
    </aside>
  );
}
