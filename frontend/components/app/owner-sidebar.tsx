"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { ROLE_LABEL } from "@/lib/labels";
import type { User } from "@syncargo/backend/types";
import { FigmaIcon } from "./icon";

const OWNER_NAV = [
  { href: "/owner", label: "홈", icon: "nav-home", exact: true },
  { href: "/owner/shippers", label: "화주", icon: "nav-shippers" },
  { href: "/owner/cases", label: "업무 건", icon: "nav-cases" },
  { href: "/owner/handover", label: "인계", icon: "nav-handover", also: ["/owner/assign"] },
];

const ADMIN_NAV = [
  { href: "/owner/admin/mail", label: "메일 연결 범위", icon: "nav-admin-mail" },
  { href: "/owner/admin/members", label: "구성원·권한", icon: "nav-admin-members" },
  { href: "/owner/admin/usage", label: "계약·사용량", icon: "nav-admin-usage" },
];

/** Figma "Sidebar / 대표" · "Sidebar / 관리자 모드" (어두운 메뉴 + 노란 안내). 아래 '화면 모드'로 전환. */
export function OwnerSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/owner/admin");
  const nav = admin ? ADMIN_NAV : OWNER_NAV;

  const isActive = (item: { href: string; exact?: boolean; also?: string[] }) =>
    item.exact
      ? pathname === item.href
      : [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex w-60 flex-col justify-between px-3.5 pt-[22px] pb-[18px]",
        admin ? "bg-logo" : "border-r border-border bg-sidebar",
      )}
    >
      <div className="flex flex-col gap-5">
        <Link href={admin ? "/owner/admin/mail" : "/owner"} className="flex items-center gap-2.5 px-2">
          <span className={cn("flex size-[30px] items-center justify-center rounded-lg", admin ? "bg-white" : "bg-logo")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={admin ? "/figma/logo-mark-dark.svg" : "/figma/logo-mark.svg"}
              alt=""
              width={18}
              height={18}
              className="size-[18px]"
            />
          </span>
          <span className={cn("text-lg font-bold", admin ? "text-white" : "text-foreground")}>SynCargo</span>
        </Link>

        {admin && (
          <p className="flex items-center gap-1.5 rounded-md bg-warning-soft px-2.5 py-1.5 text-xs whitespace-nowrap text-warning">
            <span className="font-bold">관리자 모드</span>
            <span className="font-medium">설정은 회사 전체에 적용</span>
          </p>
        )}

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-[11px] text-[15px] transition-colors",
                  admin
                    ? active
                      ? "bg-white/10 font-semibold text-white"
                      : "font-medium text-[#c9cdd6] hover:bg-white/5"
                    : active
                      ? "bg-sidebar-accent font-semibold text-primary"
                      : "font-medium text-ink-2 hover:bg-subtle",
                )}
              >
                <FigmaIcon name={item.icon} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "flex flex-col gap-2 rounded-[10px] border px-2.5 py-3",
            admin ? "border-[#2e3440] bg-[#20242d]" : "border-border bg-subtle",
          )}
        >
          <p className={cn("text-xs font-medium", admin ? "text-faint" : "text-muted-foreground")}>화면 모드</p>
          <div className={cn("flex gap-1 rounded-lg p-[3px]", admin ? "bg-logo" : "bg-stat")} role="tablist" aria-label="화면 모드">
            <ModeLink href="/owner" on={!admin} dark={admin} label="대표 화면" />
            <ModeLink href="/owner/admin/mail" on={admin} dark={admin} label="관리자 모드" />
          </div>
        </div>

        <div className={cn("flex items-center gap-2.5 border-t px-2 pt-3 pb-1", admin ? "border-[#2e3440]" : "border-border")}>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-[13px] font-bold",
              admin ? "bg-[#2a2f3a] text-white" : "bg-avatar text-primary",
            )}
          >
            {user.name.slice(0, 1)}
          </span>
          <div className="leading-tight">
            <p className={cn("text-sm font-semibold", admin ? "text-white" : "text-foreground")}>{user.name}</p>
            <p className={cn("text-xs", admin ? "text-faint" : "text-muted-foreground")}>{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ModeLink({ href, on, dark, label }: { href: string; on: boolean; dark: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={on}
      className={cn(
        "flex flex-1 items-center justify-center rounded-md px-2 py-[7px] text-[13px] whitespace-nowrap",
        on
          ? dark
            ? "bg-white font-semibold text-foreground"
            : "border border-border bg-background font-semibold text-foreground"
          : dark
            ? "font-medium text-faint hover:text-white"
            : "font-medium text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
