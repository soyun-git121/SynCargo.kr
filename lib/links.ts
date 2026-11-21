/** 화면 간 링크. 번호 없는 건은 내부 id로 연결한다. */

export function caseHref(c: { id: string; code: string | null }): string {
  return `/cases/${encodeURIComponent(c.code ?? c.id)}`;
}

export function evidenceHref(c: { id: string; code: string | null }, itemId?: string | null): string {
  const base = `${caseHref(c)}/evidence`;
  return itemId ? `${base}?item=${encodeURIComponent(itemId)}` : base;
}

export function shipperHref(shipperId: string): string {
  return `/shippers/${encodeURIComponent(shipperId)}`;
}

export function reviewHref(tab?: "links" | "unclassified" | "history", itemId?: string): string {
  const q = new URLSearchParams();
  if (tab) q.set("tab", tab);
  if (itemId) q.set("item", itemId);
  const s = q.toString();
  return s ? `/review?${s}` : "/review";
}
