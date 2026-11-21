"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Building2, Mail, Search } from "lucide-react";
import { searchAction } from "@/app/actions";
import { formatMDW } from "@/lib/date";
import { TODAY } from "@/lib/date";

type Results = Awaited<ReturnType<typeof searchAction>>;

/** 상단바: 건 번호·화주·B/L·메일 제목 검색 */
export function TopBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const t = setTimeout(() => {
      startTransition(async () => setResults(await searchAction(term)));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const close = () => {
    setOpen(false);
    setQ("");
    setResults(null);
  };
  const hasQuery = q.trim().length > 0;
  const total = results ? results.cases.length + results.shippers.length + results.mails.length : 0;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-8 backdrop-blur">
      <div ref={boxRef} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) setResults(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && close()}
          placeholder="건 번호, 화주, B/L, 메일 제목 검색"
          className="h-10 w-full rounded-lg border border-border bg-subtle pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-3 focus:ring-primary/15"
        />
        {open && hasQuery && results && (
          <div className="absolute top-12 left-0 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            {total === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto py-2">
                {results.cases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.code}`}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted"
                  >
                    <span className="font-mono text-[13px] font-medium">{c.code}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {c.shipperName} · {c.title}
                    </span>
                  </Link>
                ))}
                {results.shippers.map((s) => (
                  <Link
                    key={s.id}
                    href={`/shippers/${s.id}`}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted"
                  >
                    <Building2 className="size-4 text-muted-foreground" />
                    <span className="text-sm">{s.name}</span>
                  </Link>
                ))}
                {results.mails.map((m) => (
                  <Link
                    key={m.id}
                    href={`/mails/${m.id}`}
                    onClick={close}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted"
                  >
                    <Mail className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{m.subject}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="shrink-0 text-sm text-muted-foreground">
        오늘 <span className="font-medium text-foreground">{formatMDW(TODAY)}</span>
      </p>
    </header>
  );
}
