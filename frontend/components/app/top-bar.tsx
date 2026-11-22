"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { searchAction } from "@/app/actions";
import { caseHref, ownerCaseHref, ownerShipperHref, shipperHref } from "@/lib/links";
import { NO_CODE_LABEL } from "@/lib/labels";
import { FigmaIcon } from "./icon";

type Results = Awaited<ReturnType<typeof searchAction>>;
export type Crumb = { label: string; href?: string };

/** 상단바: 왼쪽 위치(빵부스러기), 오른쪽 화주·건 번호 검색. owner: 대표 화면(회사 전체 검색, 대표 화면으로 이동) */
export function TopBar({ crumbs, owner = false }: { crumbs: Crumb[]; owner?: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b border-border bg-background px-8 py-3.5">
      <p className="text-[15px] font-medium whitespace-nowrap text-muted-foreground">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && " › "}
              {last ? (
                <span className="font-semibold text-foreground">{c.label}</span>
              ) : c.href ? (
                <Link href={c.href} className="hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                c.label
              )}
            </Fragment>
          );
        })}
      </p>
      <SearchBox owner={owner} />
    </header>
  );
}

function SearchBox({ owner }: { owner: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const t = setTimeout(() => startTransition(async () => setResults(await searchAction(term, owner ? "company" : "mine"))), 150);
    return () => clearTimeout(t);
  }, [q, owner]);

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
  const total = results ? results.cases.length + results.shippers.length : 0;

  return (
    <div ref={boxRef} className="relative w-[340px] shrink-0">
      <label className="flex h-10 items-center gap-2 rounded-lg border border-border bg-subtle px-3 focus-within:border-primary focus-within:bg-background">
        <FigmaIcon name="search" size={16} className="text-placeholder" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) setResults(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && close()}
          placeholder="화주·건 번호 검색"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
        />
      </label>
      {open && q.trim() && results && (
        <div className="absolute top-12 right-0 w-full overflow-hidden rounded-xl border border-border bg-popover py-2 shadow-lg">
          {total === 0 ? (
            <p className="px-4 py-5 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            <>
              {results.shippers.map((s) => (
                <Link key={s.id} href={owner ? ownerShipperHref(s.id) : shipperHref(s.id)} onClick={close} className="flex items-center gap-2 px-4 py-2 hover:bg-subtle">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">화주</span>
                </Link>
              ))}
              {results.cases.map((c) => (
                <Link key={c.id} href={owner ? ownerCaseHref(c) : caseHref(c)} onClick={close} className="flex items-center gap-3 px-4 py-2 hover:bg-subtle">
                  <span className={c.code ? "font-mono text-[13px] font-semibold" : "text-[13px] text-muted-foreground"}>
                    {c.code ?? NO_CODE_LABEL}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {c.shipperName} · {c.route}
                  </span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
