/**
 * 데이터 접근 계층. 화면은 반드시 이 파일의 async 함수로만 데이터를 가져온다.
 * 지금은 lib/mock 을 읽고, 나중에 이 파일의 내부만 Supabase / Microsoft Graph 로 교체한다.
 */
import * as db from "./mock";
import { daysUntil } from "./date";
import type {
  Attachment,
  Case,
  CaseEvent,
  CorrectionLog,
  ExtractedItem,
  Mail,
  MailCaseLink,
  MailboxConnection,
  OffMailInfo,
  ReviewItem,
  Shipper,
  ShipperPattern,
  User,
} from "./types";

/* ───────────── 반환 타입 ───────────── */

export interface CaseSummary extends Case {
  shipperName: string;
  ownerName: string;
}

export interface ShipperSummary extends Shipper {
  ownerName: string;
  activeCaseCount: number;
  needsCheckCount: number;
  /** 가장 가까운 마감 */
  nextDeadline: { caseCode: string; label: string; date: string } | null;
  lastMailAt: string | null;
}

export interface MailWithAttachments extends Mail {
  attachments: Attachment[];
}

export interface HomeData {
  user: User;
  counts: { needsCheck: number; awaitingReply: number; inProgress: number; dueThisWeek: number };
  /** 오늘 확인할 건 (확인 필요 + 임박 마감) */
  needsCheck: CaseSummary[];
  deadlines: (CaseSummary & { daysLeft: number })[];
  recentChanges: (CaseEvent & { caseCode: string; shipperName: string })[];
  awaitingReply: CaseSummary[];
}

export interface CaseDetail {
  case: Case;
  shipper: Shipper;
  owner: User;
  extractedItems: ExtractedItem[];
  events: CaseEvent[];
  mails: MailWithAttachments[];
  offMailInfos: OffMailInfo[];
}

export interface ShipperDetail {
  shipper: Shipper;
  owner: User;
  cases: CaseSummary[];
  patterns: ShipperPattern[];
  recentMails: Mail[];
}

export interface MailDetail {
  mail: MailWithAttachments;
  links: (MailCaseLink & { caseCode: string; shipperName: string })[];
  /** 이 메일에서 뽑힌 값들 (근거 문장 강조용) */
  extractedItems: (ExtractedItem & { caseCode: string })[];
  /** 같은 대화의 다른 메일 */
  thread: Mail[];
}

export interface ReviewItemDetail extends ReviewItem {
  mail: MailWithAttachments;
  candidateCases: (CaseSummary & { confidence: number; candidateReason: string })[];
}

export interface CorrectionLogDetail extends CorrectionLog {
  correctedByName: string;
}

/* ───────────── 내부 헬퍼 ───────────── */

const clone = <T>(v: T): T => structuredClone(v);

function userName(id: string): string {
  return db.users.find((u) => u.id === id)?.name ?? "알 수 없음";
}

function shipperName(id: string): string {
  return db.shippers.find((s) => s.id === id)?.name ?? "미지정";
}

function summarize(c: Case): CaseSummary {
  return { ...clone(c), shipperName: shipperName(c.shipperId), ownerName: userName(c.ownerId) };
}

function withAttachments(m: Mail): MailWithAttachments {
  return { ...clone(m), attachments: clone(db.attachments.filter((a) => a.mailId === m.id)) };
}

function findCase(idOrCode: string): Case | undefined {
  return db.cases.find((c) => c.id === idOrCode || c.code === idOrCode);
}

const byDateDesc = (a: string, b: string) => (a < b ? 1 : a > b ? -1 : 0);

/* ───────────── 사용자 · 회사 ───────────── */

export async function getCurrentUser(): Promise<User> {
  return clone(db.users.find((u) => u.id === db.CURRENT_USER_ID)!);
}

export async function getUsers(): Promise<User[]> {
  return clone(db.users);
}

export async function getCompany() {
  return clone(db.company);
}

export async function getMailboxConnection(): Promise<MailboxConnection | null> {
  return clone(db.mailboxConnections.find((m) => m.userId === db.CURRENT_USER_ID) ?? null);
}

/* ───────────── 홈 ───────────── */

export async function getHome(): Promise<HomeData> {
  const user = await getCurrentUser();
  const mine = db.cases.filter((c) => c.ownerId === user.id && c.status !== "done").map(summarize);

  const deadlines = mine
    .filter((c) => c.nextDeadline)
    .map((c) => ({ ...c, daysLeft: daysUntil(c.nextDeadline!.date) }))
    .filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const myCaseIds = new Set(mine.map((c) => c.id));
  const recentChanges = db.caseEvents
    .filter((e) => myCaseIds.has(e.caseId) && (e.type === "changed" || e.type === "stage" || e.type === "extracted"))
    .sort((a, b) => byDateDesc(a.at, b.at))
    .slice(0, 6)
    .map((e) => {
      const c = findCase(e.caseId)!;
      return { ...clone(e), caseCode: c.code, shipperName: shipperName(c.shipperId) };
    });

  return {
    user,
    counts: {
      needsCheck: mine.filter((c) => c.status === "needs_check").length,
      awaitingReply: mine.filter((c) => c.status === "awaiting_reply").length,
      inProgress: mine.filter((c) => c.status === "in_progress").length,
      dueThisWeek: deadlines.length,
    },
    needsCheck: mine.filter((c) => c.status === "needs_check"),
    deadlines,
    recentChanges,
    awaitingReply: mine.filter((c) => c.status === "awaiting_reply"),
  };
}

/* ───────────── 화주 ───────────── */

export async function getShippers(): Promise<ShipperSummary[]> {
  return db.shippers.map((s) => {
    const sc = db.cases.filter((c) => c.shipperId === s.id);
    const active = sc.filter((c) => c.status !== "done");
    const next = active
      .filter((c) => c.nextDeadline && daysUntil(c.nextDeadline.date) >= 0)
      .sort((a, b) => (a.nextDeadline!.date < b.nextDeadline!.date ? -1 : 1))[0];
    const caseIds = new Set(sc.map((c) => c.id));
    const mailIds = new Set(db.mailCaseLinks.filter((l) => caseIds.has(l.caseId)).map((l) => l.mailId));
    const lastMail = db.mails
      .filter((m) => mailIds.has(m.id))
      .sort((a, b) => byDateDesc(a.receivedAt, b.receivedAt))[0];
    return {
      ...clone(s),
      ownerName: userName(s.ownerId),
      activeCaseCount: active.length,
      needsCheckCount: active.filter((c) => c.status === "needs_check").length,
      nextDeadline: next ? { caseCode: next.code, label: next.nextDeadline!.label, date: next.nextDeadline!.date } : null,
      lastMailAt: lastMail?.receivedAt ?? null,
    };
  });
}

export async function getShipper(id: string): Promise<ShipperDetail | null> {
  const shipper = db.shippers.find((s) => s.id === id);
  if (!shipper) return null;
  const cases = db.cases.filter((c) => c.shipperId === id).map(summarize);
  const caseIds = new Set(cases.map((c) => c.id));
  const mailIds = new Set(db.mailCaseLinks.filter((l) => caseIds.has(l.caseId)).map((l) => l.mailId));
  return {
    shipper: clone(shipper),
    owner: clone(db.users.find((u) => u.id === shipper.ownerId)!),
    cases,
    patterns: clone(db.shipperPatterns.filter((p) => p.shipperId === id)),
    recentMails: clone(
      db.mails.filter((m) => mailIds.has(m.id)).sort((a, b) => byDateDesc(a.receivedAt, b.receivedAt)),
    ),
  };
}

/* ───────────── 업무 건 ───────────── */

export async function getCases(): Promise<CaseSummary[]> {
  return db.cases.map(summarize).sort((a, b) => byDateDesc(a.updatedAt, b.updatedAt));
}

/** id 또는 건 번호(SC-2611-014)로 조회 */
export async function getCase(idOrCode: string): Promise<CaseDetail | null> {
  const c = findCase(idOrCode);
  if (!c) return null;
  const mailIds = new Set(
    db.mailCaseLinks.filter((l) => l.caseId === c.id && l.status !== "rejected").map((l) => l.mailId),
  );
  return {
    case: clone(c),
    shipper: clone(db.shippers.find((s) => s.id === c.shipperId)!),
    owner: clone(db.users.find((u) => u.id === c.ownerId)!),
    extractedItems: clone(db.extractedItems.filter((x) => x.caseId === c.id)),
    events: clone(db.caseEvents.filter((e) => e.caseId === c.id)).sort((a, b) => byDateDesc(a.at, b.at)),
    mails: db.mails
      .filter((m) => mailIds.has(m.id))
      .sort((a, b) => byDateDesc(a.receivedAt, b.receivedAt))
      .map(withAttachments),
    offMailInfos: clone(db.offMailInfos.filter((o) => o.caseId === c.id)),
  };
}

/* ───────────── 메일 원문 ───────────── */

export async function getMail(id: string): Promise<MailDetail | null> {
  const m = db.mails.find((x) => x.id === id);
  if (!m) return null;
  const links = db.mailCaseLinks
    .filter((l) => l.mailId === id)
    .map((l) => {
      const c = findCase(l.caseId)!;
      return { ...clone(l), caseCode: c.code, shipperName: shipperName(c.shipperId) };
    });
  const extractedItems = db.extractedItems
    .filter((x) => x.evidence.mailId === id)
    .map((x) => ({ ...clone(x), caseCode: findCase(x.caseId)!.code }));
  const thread = clone(
    db.mails
      .filter((x) => x.conversationId === m.conversationId && x.id !== id)
      .sort((a, b) => byDateDesc(a.receivedAt, b.receivedAt)),
  );
  return { mail: withAttachments(m), links, extractedItems, thread };
}

/* ───────────── 검토함 ───────────── */

export async function getReviewItems(): Promise<ReviewItemDetail[]> {
  return db.reviewItems
    .map((r) => {
      const mail = withAttachments(db.mails.find((m) => m.id === r.mailId)!);
      const candidateCases = r.candidates.map((cand) => ({
        ...summarize(findCase(cand.caseId)!),
        confidence: cand.confidence,
        candidateReason: cand.reason,
      }));
      return { ...clone(r), mail, candidateCases };
    })
    .sort((a, b) => byDateDesc(a.mail.receivedAt, b.mail.receivedAt));
}

export async function getCorrectionLogs(): Promise<CorrectionLogDetail[]> {
  return db.correctionLogs
    .map((l) => ({ ...clone(l), correctedByName: userName(l.correctedBy) }))
    .sort((a, b) => byDateDesc(a.correctedAt, b.correctedAt));
}

/** 사이드바 배지용: 열린 검토 항목 ID (클라이언트에서 확정분을 빼서 표시) */
export async function getOpenReviewIds(): Promise<string[]> {
  return db.reviewItems.filter((r) => r.status === "open").map((r) => r.id);
}

/** 상단 검색 */
export async function search(query: string): Promise<{
  cases: CaseSummary[];
  shippers: Shipper[];
  mails: Mail[];
}> {
  const q = query.trim().toLowerCase();
  if (!q) return { cases: [], shippers: [], mails: [] };
  const has = (...v: (string | null)[]) => v.some((x) => x?.toLowerCase().includes(q));
  return {
    cases: db.cases
      .filter((c) => has(c.code, c.title, c.blNo, c.bookingNo, shipperName(c.shipperId)))
      .map(summarize),
    shippers: clone(db.shippers.filter((s) => has(s.name, s.contactName))),
    mails: clone(db.mails.filter((m) => has(m.subject, m.from.name))),
  };
}
