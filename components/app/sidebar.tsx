"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Building2, Home, Inbox, Settings, Users } from "lucide-react";
import { cn } from "cn";
import { useDemoState } from "@/lib/demo-state";
import { ROLE_LABEL } from "@/lib/labels";
import type { User } from "@/lib/types";

const NAV = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/shippers", label: "화주", icon: Building2 },
  { href: "/cases", label: "업무 건", icon: Briefcase },
  { href: "/review", label: "검토함", icon: Inbox, badge: "review" as const },
  { href: "/handover", label: "인계", icon: Users, soon: true },
];

export function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { openReviewCount } = useDemoState();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      <Link href="/home" className="flex h-16 items-center gap-2 px-5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          S
        </span>
        <span className="text-[17px] font-bold tracking-tight text-foreground">SynCargo</span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {NAV.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge === "review" && openReviewCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-white tabular-nums">
                  {openReviewCount}
                </span>
              )}
              {item.soon && <span className="text-[11px] font-normal text-muted-foreground">준비 중</span>}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
            isActive("/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-muted",
          )}
        >
          <Settings className="size-[18px]" />
          설정
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-primary">
            {user.name.slice(0, 1)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
