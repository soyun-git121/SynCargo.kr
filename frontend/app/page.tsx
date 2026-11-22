import Link from "next/link";
import { Button } from "@/components/ui/button";

const FACTS = [
  "메일은 읽기만 합니다. 보내거나 지우지 않습니다.",
  "회사가 허용한 사서함과 기간만 읽습니다.",
  "담당자가 바뀌어도 화주별 이력은 그대로 넘어갑니다.",
];

/** S-00 시작 화면: 앱을 처음 열면 보이는 첫 화면 · 시작하기 → W-00 로그인 (실무자·대표 공통) */
export default function StartPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <header className="relative z-10 mx-auto flex h-20 max-w-[1440px] items-center justify-between px-24">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/figma/start-logo.svg" alt="" width={17.6} height={17.6} className="size-[17.6px]" />
          </span>
          <span className="text-[19px] font-bold tracking-[-0.01em] text-foreground">SynCargo</span>
        </Link>
        <nav className="flex items-center gap-6">
          {/* 도입 문의 창구는 아직 없음 (데모) */}
          <span className="text-sm font-medium text-ink-2">도입 문의</span>
          <Button variant="outline" asChild>
            <Link href="/login">로그인</Link>
          </Button>
        </nav>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-[1440px] items-center px-24 pb-24">
        <section className="relative z-10 flex w-[540px] flex-col">
          <h1 className="text-[46px] leading-[1.28] font-bold tracking-[-0.02em] text-foreground">
            포워딩 업무가 정리되는 곳, SynCargo
          </h1>
          <p className="mt-5 text-[17px] leading-[1.65] text-muted-foreground">
            쓰던 Outlook을 연결하면 화주 메일에서 기한과 변경 사항을 찾아
            <br />
            업무 건마다 정리해 둡니다.
          </p>
          <div className="mt-9 flex items-center gap-4">
            <Button asChild className="h-auto px-8 py-3.5 text-base">
              <Link href="/login">시작하기</Link>
            </Button>
            <span className="text-[13px] font-medium text-muted-foreground">별도 가입 없이 회사 메일 계정으로</span>
          </div>
          <ul className="mt-14 flex flex-col gap-3.5">
            {FACTS.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[15px] text-ink-2">
                <span className="flex size-[22px] items-center justify-center rounded-full bg-brand-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/figma/start-check.svg" alt="" width={12} height={12} className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-24 text-xs whitespace-pre text-faint">© 2026 SynCargo   ·   이용약관   ·   개인정보 처리방침</p>
        </section>

        {/* 오른쪽: 실제 홈(W-01) 화면을 줄여서 보여 주는 미리보기 */}
        <div aria-hidden className="pointer-events-none absolute top-8 left-[704px] h-[860px] w-[800px] rounded-[24px] bg-brand-soft" />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[104px] left-[768px] h-[780px] w-[800px] overflow-hidden rounded-xl border border-field-border bg-page shadow-[0_8px_24px_rgba(15,26,64,0.08)]"
        >
          <iframe
            src="/home"
            title="SynCargo 홈 미리보기"
            tabIndex={-1}
            className="h-[1418px] w-[1440px] origin-top-left scale-[0.55] border-0"
          />
        </div>
      </main>
    </div>
  );
}
