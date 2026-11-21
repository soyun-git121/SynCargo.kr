import Link from "next/link";
import { Button } from "@/components/ui/button";

/** W-00 로그인 — 데모: 버튼을 누르면 김대리(실무자)로 홈에 들어간다. 실제 Azure 로그인은 Supabase Auth 연동 때 교체. */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="flex w-[520px] max-w-full flex-col items-center gap-6 rounded-[20px] border border-border bg-card p-10">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-[10px] bg-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/logo-mark-lg.svg" alt="" width={22} height={22} className="size-[22px]" />
          </span>
          <span className="text-2xl font-bold text-foreground">SynCargo</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-bold text-foreground">회사 메일 계정으로 시작하기</h1>
          <p className="text-[15px] text-muted-foreground">따로 입력할 것 없이, 쓰던 메일을 그대로 연결합니다</p>
        </div>

        <Button asChild className="w-full">
          <Link href="/home">Microsoft 계정으로 로그인</Link>
        </Button>

        <div className="flex w-full flex-col gap-2.5">
          <p className="text-[13px] font-medium text-muted-foreground">로그인하면 내 역할에 맞는 범위로 들어갑니다</p>
          <div className="flex gap-2">
            {[
              ["실무자", "내 화주"],
              ["팀장", "팀 전체"],
              ["대표", "회사 전체"],
            ].map(([role, scope]) => (
              <div key={role} className="flex flex-1 flex-col items-center gap-0.5 rounded-[10px] border border-border bg-subtle p-3">
                <span className="text-sm font-bold text-foreground">{role}</span>
                <span className="text-xs text-muted-foreground">{scope}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="w-full rounded-lg bg-subtle px-3 py-2.5 text-[13px] leading-normal font-medium text-ink-2">
          메일은 읽기만 합니다. 보내거나 지우지 않습니다.
        </p>
        <p className="-mt-3 text-xs text-faint">데모 버전 · 실제 로그인 없이 김대리(실무자) 화면으로 들어갑니다</p>
      </div>
    </main>
  );
}
