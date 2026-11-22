/** 화면 간 링크. 번호 없는 건은 내부 id로 연결한다. */

export function caseHref(c: { id: string; code: string | null }): string {
  return `/cases/${encodeURIComponent(c.code ?? c.id)}`;
}

/** 원문 보기로 들어온 화면 ('← 돌아가기'가 그 화면으로 돌아감) */
export type EvidenceFrom = { kind: "case" } | { kind: "shipper"; id: string } | { kind: "review" };

export function evidenceHref(c: { id: string; code: string | null }, itemId?: string | null, from?: EvidenceFrom): string {
  const base = `${caseHref(c)}/evidence`;
  const q = new URLSearchParams();
  if (itemId) q.set("item", itemId);
  if (from && from.kind !== "case") q.set("from", from.kind === "shipper" ? `shipper:${from.id}` : "review");
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

export function parseEvidenceFrom(v: string | undefined): EvidenceFrom {
  if (v === "review") return { kind: "review" };
  if (v?.startsWith("shipper:")) return { kind: "shipper", id: v.slice("shipper:".length) };
  return { kind: "case" };
}

/** 화주 카드. focus=check: 확인 항목을 맨 위에 펼친 상태로 (W-02 '확인 필요' 배지) */
export function shipperHref(shipperId: string, opts?: { focus?: "check" }): string {
  const base = `/shippers/${encodeURIComponent(shipperId)}`;
  return opts?.focus ? `${base}?focus=${opts.focus}` : base;
}

/** 업무 건 목록 (화주·상태로 미리 거르기) */
export function casesHref(filter?: { shipper?: string; status?: "active" | "done" }): string {
  const q = new URLSearchParams();
  if (filter?.shipper) q.set("shipper", filter.shipper);
  if (filter?.status) q.set("status", filter.status);
  const s = q.toString();
  return s ? `/cases?${s}` : "/cases";
}

export function reviewHref(tab?: "links" | "unclassified" | "history", itemId?: string): string {
  const q = new URLSearchParams();
  if (tab) q.set("tab", tab);
  if (itemId) q.set("item", itemId);
  const s = q.toString();
  return s ? `/review?${s}` : "/review";
}

/** backend가 준 원문 위치(EvidenceRef) → 원문 보기 주소 */
export function evidenceRefHref(
  ref: { caseId: string; caseCode: string | null; itemId: string } | null,
  from?: EvidenceFrom,
): string | null {
  return ref ? evidenceHref({ id: ref.caseId, code: ref.caseCode }, ref.itemId, from) : null;
}

export type HandoverTab = "sent" | "received";

/** W-12 인계·미결 현황 (탭 지정 가능) */
export function handoverHref(tab?: HandoverTab): string {
  return tab ? `/handover?tab=${tab}` : "/handover";
}

/** W-08 인계 대상 고르기 (화주 미리 선택 가능) */
export function handoverNewHref(shipperIds?: string[]): string {
  return shipperIds?.length ? `/handover/new?shippers=${shipperIds.map(encodeURIComponent).join(",")}` : "/handover/new";
}

export interface HandoverDraft {
  shippers: string[];
  to?: string;
  reason?: string;
  /** "11/23 ~ 11/27" */
  period?: string;
  /** 일부 건만 고른 경우 */
  cases?: string[];
}

/** W-09 인계 미리보기 (W-08에서 고른 값을 그대로 넘김) */
export function handoverPreviewHref(d: HandoverDraft): string {
  const q = new URLSearchParams({ shippers: d.shippers.join(",") });
  if (d.to) q.set("to", d.to);
  if (d.reason) q.set("reason", d.reason);
  if (d.period) q.set("period", d.period);
  if (d.cases?.length) q.set("cases", d.cases.join(","));
  return `/handover/new/preview?${q.toString()}`;
}

/** W-08로 돌아가 대상 수정 (고른 값 유지) */
export function handoverEditHref(d: HandoverDraft): string {
  return handoverPreviewHref(d).replace("/handover/new/preview?", "/handover/new?");
}

/** 이미 요청된 인계의 요약 (W-12 '인계 요약 보기', 대표 R-08) */
export function handoverSummaryHref(id: string): string {
  return `/handover/${encodeURIComponent(id)}`;
}

/* ───────────── 대표 화면 (/owner) ───────────── */

export function ownerShipperHref(shipperId: string): string {
  return `/owner/shippers/${encodeURIComponent(shipperId)}`;
}

export function ownerShipperHistoryHref(shipperId: string): string {
  return `${ownerShipperHref(shipperId)}/history`;
}

export function ownerCaseHref(c: { id: string; code: string | null }): string {
  return `/owner/cases/${encodeURIComponent(c.code ?? c.id)}`;
}

export function ownerHandoverHref(id?: string): string {
  return id ? `/owner/handover/${encodeURIComponent(id)}` : "/owner/handover";
}

/** R-09 담당자 지정. from: 현재 담당자, shipper: 화주 카드에서 들어온 경우 그 화주만 */
export function ownerAssignHref(opts?: { from?: string; shipper?: string }): string {
  const q = new URLSearchParams();
  if (opts?.from) q.set("from", opts.from);
  if (opts?.shipper) q.set("shipper", opts.shipper);
  const s = q.toString();
  return s ? `/owner/assign?${s}` : "/owner/assign";
}
