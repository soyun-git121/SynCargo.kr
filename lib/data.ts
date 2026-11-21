/**
 * 데이터 접근 계층. 화면은 반드시 이 파일의 async 함수로만 데이터를 가져온다.
 * 지금은 lib/mock 을 읽고, 나중에 이 파일의 내부만 Supabase / Microsoft Graph 로 교체한다.
 */
import * as db from "./mock";
import { daysUntil } from "./date";
import { STAGES, STATUS_RANK } from "./labels";
import { evidenceHref } from "./links";
import type {
  Attachment,
  Case,
  CaseEvent,
  CorrectionLog,
  ExtractedItem,
  Mail,
  MailboxConnection,
  OffMailInfo,
  ReviewItem,
  Shipper,
  ShipperChange,
  ShipperPattern,
  User,
} from "./types";

/* ───────────── 반환 타입 ───────────── */

export interface CaseSummary extends Case {
  shipperName: string;
  ownerName: string;
}

export interface MailWithAttachments extends Mail {
  attachments: Attachment[];
}

export interface HomeTask {
  id: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  case: CaseSummary;
}

export interface HomeData {
  user: User;
  receivedHandover: { fromName: string; shipperSummary: string; approvedAt: string } | null;
  tasks: HomeTask[];
  /** 오늘 움직인 건 — 확인 필요가 먼저 */
  movedCases: CaseSummary[];
}

export interface CaseDetail {
  case: CaseSummary;
  shipper: Shipper;
  owner: User;
  /** 오래된 순 */
  events: CaseEvent[];
  attachments: Attachment[];
  offMailInfos: OffMailInfo[];
  extractedItems: ExtractedItem[];
}

export interface EvidenceItem extends ExtractedItem {
  mail: MailWithAttachments;
}

export interface CaseEvidence {
  case: CaseSummary;
  items: EvidenceItem[];
  /** 이 메일과 연결된 검토 항목(있으면 "연결 수정"이 그 항목으로 감) */
  reviewItemIdByMail: Record<string, string>;
}

export interface ShipperSummary extends Shipper {
  ownerName: string;
  activeCaseCount: number;
  /** 확인 필요: 확인 필요 건 + 이 화주로 제안된 애매한 연결 + 확인 안 된 조건 변경 */
  needsCheck: boolean;
}

export interface ShipperDetail {
  shipper: Shipper;
  owner: User;
  activeCases: (CaseSummary & { issue: string | null })[];
  doneCaseCount: number;
  /** "지금 챙길 것" — 확인 필요·답변 대기 건 + 확인 필요 반복 조건 */
  attentionCount: number;
  patterns: (ShipperPattern & { confirmedByName: string | null; evidenceHref: string | null })[];
  changes: (ShipperChange & { evidenceHref: string | null })[];
  memoUpdatedByName: string | null;
}

export interface ReviewCandidateDetail {
  shipper: Shipper;
  case: CaseSummary | null;
  confidence: number;
}

export interface ReviewItemDetail extends ReviewItem {
  mail: MailWithAttachments;
  candidateDetails: ReviewCandidateDetail[];
  extractedItems: ExtractedItem[];
}

export interface CorrectionLogDetail extends CorrectionLog {
  correctedByName: string;
  evidenceHref: string | null;
}

/* ───────────── 내부 헬퍼 ───────────── */

const clone = <T>(v: T): T => structuredClone(v);
const byDesc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);
const byAsc = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function userName(id: string | null): string | null {
  if (!id) return null;
  return db.users.find((u) => u.id === id)?.name ?? null;
}

function findShipper(id: string): Shipper {
  const s = db.shippers.find((x) => x.id === id);
  if (!s) throw new Error(`shipper ${id} not found`);
  return s;
}

function summarize(c: Case): CaseSummary {
  return { ...clone(c), shipperName: findShipper(c.shipperId).name, ownerName: userName(c.ownerId) ?? "" };
}

function withAttachments(m: Mail): MailWithAttachments {
  return { ...clone(m), attachments: clone(db.attachments.filter((a) => a.mailId === m.id)) };
}

function findCase(idOrCode: string): Case | undefined {
  const key = decodeURIComponent(idOrCode);
  return db.cases.find((c) => c.id === key || c.code === key);
}

/** 다음 기한 가까운 순, 같으면 확인 필요 먼저 */
function byDeadline(a: Case, b: Case): number {
  const da = a.nextDeadline?.date ?? "9999-12-31";
  const dbb = b.nextDeadline?.date ?? "9999-12-31";
  if (da !== dbb) return byAsc(da, dbb);
  return STATUS_RANK[a.status] - STATUS_RANK[b.status];
}

const DOC_ORDER = ["B/L", "Invoice", "Packing List"];

/** 메일 → 원문 보기(W-07) 링크. 그 메일에서 뽑은 항목이 있는 건으로 연결 */
function evidenceHrefForMail(mailId: string | null): string | null {
  if (!mailId) return null;
  const item = db.extractedItems.find((x) => x.evidence.mailId === mailId);
  if (!item) return null;
  return evidenceHref(findCase(item.caseId)!, item.id);
}

const stageIndex = (c: Case) => STAGES.findIndex((s) => s.key === c.stage);

/* ───────────── 사용자 · 회사 ───────────── */

export async function getCurrentUser(): Promise<User> {
  return clone(db.users.find((u) => u.id === db.CURRENT_USER_ID)!);
}

export async function getUsers(): Promise<User[]> {
  return clone(db.users);
}

export async function getMailboxConnection(): Promise<MailboxConnection | null> {
  return clone(db.mailboxConnections.find((m) => m.userId === db.CURRENT_USER_ID) ?? null);
}

/* ───────────── 홈 (W-01) ───────────── */

export async function getHome(): Promise<HomeData> {
  const user = await getCurrentUser();

  const h = db.handovers.find((x) => x.toUserId === user.id && x.status === "approved");
  const receivedHandover = h
    ? {
        fromName: userName(h.fromUserId) ?? "",
        shipperSummary:
          h.shipperIds.length > 1
            ? `${findShipper(h.shipperIds[0]).name} 외 ${h.shipperIds.length - 1}곳`
            : findShipper(h.shipperIds[0]).name,
        approvedAt: h.approvedAt!,
      }
    : null;

  const tasks = db.caseTasks
    .filter((t) => t.ownerId === user.id && !t.done)
    .sort((a, b) => byAsc(a.dueDate, b.dueDate))
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      daysLeft: daysUntil(t.dueDate),
      case: summarize(findCase(t.caseId)!),
    }));

  const movedCases = db.cases
    .filter((c) => c.ownerId === user.id && c.status !== "done" && c.latestChange)
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || byDesc(a.latestChange!.at, b.latestChange!.at))
    .map(summarize);

  return { user, receivedHandover, tasks, movedCases };
}

/* ───────────── 업무 건 (W-04 / W-05 / W-07) ───────────── */

/** 진행 중인 건 + 완료 건. 정렬: 다음 기한 가까운 순 · 같으면 확인 필요 먼저 */
export async function getCases(): Promise<CaseSummary[]> {
  const active = db.cases.filter((c) => c.status !== "done").sort(byDeadline);
  const done = db.cases.filter((c) => c.status === "done").sort((a, b) => byDesc(a.closedAt ?? "", b.closedAt ?? ""));
  return [...active, ...done].map(summarize);
}

/** id 또는 건 번호(SC-2611-014)로 조회 */
export async function getCase(idOrCode: string): Promise<CaseDetail | null> {
  const c = findCase(idOrCode);
  if (!c) return null;
  const mailIds = new Set(db.mailCaseLinks.filter((l) => l.caseId === c.id).map((l) => l.mailId));
  const attachments = db.attachments
    .filter((a) => mailIds.has(a.mailId))
    .sort((a, b) => {
      const ia = DOC_ORDER.indexOf(a.docType);
      const ib = DOC_ORDER.indexOf(b.docType);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  return {
    case: summarize(c),
    shipper: clone(findShipper(c.shipperId)),
    owner: clone(db.users.find((u) => u.id === c.ownerId)!),
    events: clone(db.caseEvents.filter((e) => e.caseId === c.id)).sort((a, b) => byAsc(a.at, b.at)),
    attachments: clone(attachments),
    offMailInfos: clone(db.offMailInfos.filter((o) => o.caseId === c.id)).sort((a, b) => byDesc(a.confirmedAt, b.confirmedAt)),
    extractedItems: clone(db.extractedItems.filter((x) => x.caseId === c.id)),
  };
}

/** W-07 원문 보기: 건의 추출 항목 + 각 항목의 근거 메일 */
export async function getCaseEvidence(idOrCode: string): Promise<CaseEvidence | null> {
  const c = findCase(idOrCode);
  if (!c) return null;
  const items = db.extractedItems
    .filter((x) => x.caseId === c.id)
    .map((x) => ({ ...clone(x), mail: withAttachments(db.mails.find((m) => m.id === x.evidence.mailId)!) }));
  const reviewItemIdByMail: Record<string, string> = {};
  for (const r of db.reviewItems) reviewItemIdByMail[r.mailId] = r.id;
  return { case: summarize(c), items, reviewItemIdByMail };
}

/* ───────────── 화주 (W-02 / W-03) ───────────── */

export async function getShippers(): Promise<ShipperSummary[]> {
  return db.shippers.map((s) => {
    const active = db.cases.filter((c) => c.shipperId === s.id && c.status !== "done");
    const reviewSuggests = db.reviewItems.some(
      (r) => r.status === "open" && r.candidates[0]?.shipperId === s.id && r.candidates[0].confidence >= 0.5,
    );
    const changeOpen = db.shipperChanges.some((ch) => ch.shipperId === s.id && ch.status === "needs_check");
    return {
      ...clone(s),
      ownerName: userName(s.ownerId) ?? "",
      activeCaseCount: active.length,
      needsCheck: active.some((c) => c.status === "needs_check") || reviewSuggests || changeOpen,
    };
  });
}

export async function getShipper(id: string): Promise<ShipperDetail | null> {
  const shipper = db.shippers.find((s) => s.id === id);
  if (!shipper) return null;
  const all = db.cases.filter((c) => c.shipperId === id);
  const activeCases = all
    .filter((c) => c.status !== "done" && c.code)
    .sort((a, b) => stageIndex(a) - stageIndex(b))
    .map((c) => {
      const issue = db.caseEvents.find((e) => e.caseId === c.id && e.kind === "issue");
      return { ...summarize(c), issue: c.status === "needs_check" ? (issue?.title ?? null) : null };
    });
  const patterns = db.shipperPatterns
    .filter((p) => p.shipperId === id)
    .sort((a, b) => (a.status === b.status ? byDesc(a.confirmedAt ?? "", b.confirmedAt ?? "") : a.status === "suggested" ? -1 : 1))
    .map((p) => ({ ...clone(p), confirmedByName: userName(p.confirmedBy), evidenceHref: evidenceHrefForMail(p.evidenceMailId) }));
  const attentionCount =
    all.filter((c) => c.status === "needs_check" || c.status === "awaiting_reply").length +
    patterns.filter((p) => p.status === "suggested").length +
    db.shipperChanges.filter((ch) => ch.shipperId === id && ch.status === "needs_check").length;
  return {
    shipper: clone(shipper),
    owner: clone(db.users.find((u) => u.id === shipper.ownerId)!),
    activeCases,
    doneCaseCount: all.filter((c) => c.status === "done").length,
    attentionCount,
    patterns,
    changes: clone(db.shipperChanges.filter((ch) => ch.shipperId === id))
      .sort((a, b) => byDesc(a.at, b.at))
      .map((ch) => ({ ...ch, evidenceHref: evidenceHrefForMail(ch.mailId) })),
    memoUpdatedByName: userName(shipper.memoUpdatedBy),
  };
}

/* ───────────── 검토함 (W-10 / W-13 / W-14) ───────────── */

export async function getReviewItems(): Promise<ReviewItemDetail[]> {
  return db.reviewItems
    .map((r) => ({
      ...clone(r),
      mail: withAttachments(db.mails.find((m) => m.id === r.mailId)!),
      candidateDetails: r.candidates.map((cand) => {
        const c = cand.caseId ? findCase(cand.caseId) : undefined;
        return { shipper: clone(findShipper(cand.shipperId)), case: c ? summarize(c) : null, confidence: cand.confidence };
      }),
      extractedItems: clone(db.extractedItems.filter((x) => r.extractedItemIds.includes(x.id))),
    }))
    .sort((a, b) => byDesc(a.mail.receivedAt, b.mail.receivedAt));
}

/** 사이드바·홈 배지용: 열린 검토 항목 (클라이언트에서 확정분을 빼서 표시) */
export async function getOpenReviews(): Promise<{ id: string; type: ReviewItem["type"] }[]> {
  return db.reviewItems.filter((r) => r.status === "open").map((r) => ({ id: r.id, type: r.type }));
}

export async function getCorrectionLogs(): Promise<CorrectionLogDetail[]> {
  return db.correctionLogs
    .map((l) => ({ ...clone(l), correctedByName: userName(l.correctedBy) ?? "", evidenceHref: evidenceHrefForMail(l.mailId) }))
    .sort((a, b) => byDesc(a.correctedAt, b.correctedAt));
}

/** 검토함 연결 선택지: 화주 목록 + 화주별 건 (진행 중 먼저, 최근 완료 건 일부) */
export async function getLinkOptions(): Promise<{
  shippers: { id: string; name: string }[];
  cases: { id: string; code: string | null; shipperId: string; label: string; done: boolean }[];
}> {
  const active = db.cases.filter((c) => c.status !== "done").sort(byDeadline);
  const done = db.cases.filter((c) => c.status === "done").sort((a, b) => byDesc(a.closedAt ?? "", b.closedAt ?? ""));
  return {
    shippers: db.shippers.map((s) => ({ id: s.id, name: s.name })),
    cases: [...active, ...done].map((c) => ({
      id: c.id,
      code: c.code,
      shipperId: c.shipperId,
      label: `${c.code ?? "번호 없음"} · ${c.route}${c.status === "done" ? " (완료)" : ""}`,
      done: c.status === "done",
    })),
  };
}

/** 메일 → 원문 보기 링크 (검토함에서 원문 전체 보기용) */
export async function getEvidenceHrefForMail(mailId: string): Promise<string | null> {
  return evidenceHrefForMail(mailId);
}

/* ───────────── 검색 (TopBar) ───────────── */

export async function search(query: string): Promise<{ cases: CaseSummary[]; shippers: Shipper[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { cases: [], shippers: [] };
  const has = (...v: (string | null)[]) => v.some((x) => x?.toLowerCase().includes(q));
  return {
    cases: db.cases
      .filter((c) => c.status !== "done" || has(c.code))
      .filter((c) => has(c.code, c.blNo, c.bookingNo, findShipper(c.shipperId).name, c.route))
      .sort(byDeadline)
      .slice(0, 8)
      .map(summarize),
    shippers: clone(db.shippers.filter((s) => has(s.name))),
  };
}
