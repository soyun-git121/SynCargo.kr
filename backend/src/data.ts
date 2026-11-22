/**
 * 데이터 접근 계층 (backend). 프론트엔드는 반드시 이 파일의 async 함수로만 데이터를 가져온다.
 * 지금은 ./mock 을 읽고, 나중에 이 파일의 내부만 Supabase / Microsoft Graph 로 교체한다.
 * 서버(Next.js 서버 컴포넌트·Server Action)에서만 호출할 것 — 클라이언트 컴포넌트는 `import type`만.
 */
import * as db from "./mock";
import { NO_CODE_LABEL, STAGE_ORDER, STATUS_RANK, daysUntil } from "./domain";
import type {
  Attachment,
  CompanyContract,
  CompanyMailbox,
  CompanyMailSettings,
  Case,
  CaseEvent,
  CorrectionLog,
  ExtractedItem,
  Handover,
  HandoverItem,
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

/** 원문 보기(W-07)로 갈 수 있는 위치. 링크 주소는 프론트엔드가 만든다. */
export interface EvidenceRef {
  caseId: string;
  caseCode: string | null;
  itemId: string;
}

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
  activeCases: (CaseSummary & {
    issue: string | null;
    /** 확인 필요 이슈가 발견된 시점 */
    issueAt: string | null;
    /** 이 건과 연결된 열린 검토 항목 (검토함에서 확인) */
    reviewItemId: string | null;
  })[];
  doneCaseCount: number;
  /** "지금 챙길 것" — 확인 필요·답변 대기 건 + 확인 필요 반복 조건 */
  attentionCount: number;
  patterns: (ShipperPattern & { confirmedByName: string | null; evidence: EvidenceRef | null })[];
  changes: (ShipperChange & { evidence: EvidenceRef | null })[];
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
  evidence: EvidenceRef | null;
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

/** 메일 → 원문 보기 위치. 그 메일에서 뽑은 항목이 있는 건으로 연결 */
function evidenceRefForMail(mailId: string | null): EvidenceRef | null {
  if (!mailId) return null;
  const item = db.extractedItems.find((x) => x.evidence.mailId === mailId);
  if (!item) return null;
  const c = findCase(item.caseId)!;
  return { caseId: c.id, caseCode: c.code, itemId: item.id };
}

const stageIndex = (c: Case) => STAGE_ORDER.indexOf(c.stage);

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

/** 내가 맡은 진행 중인 건 + 완료 건. 정렬: 다음 기한 가까운 순 · 같으면 확인 필요 먼저 */
export async function getCases(): Promise<CaseSummary[]> {
  const mine = db.cases.filter((c) => c.ownerId === db.CURRENT_USER_ID);
  const active = mine.filter((c) => c.status !== "done").sort(byDeadline);
  const done = mine.filter((c) => c.status === "done").sort((a, b) => byDesc(a.closedAt ?? "", b.closedAt ?? ""));
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
      const issue = c.status === "needs_check" ? db.caseEvents.find((e) => e.caseId === c.id && e.kind === "issue") : undefined;
      const review = db.reviewItems.find(
        (r) => r.status === "open" && (r.candidates[0]?.caseId === c.id || r.id === issue?.reviewItemId),
      );
      return {
        ...summarize(c),
        issue: issue?.title ?? null,
        issueAt: issue?.at ?? null,
        reviewItemId: review?.id ?? null,
      };
    });
  const patterns = db.shipperPatterns
    .filter((p) => p.shipperId === id)
    .sort((a, b) => (a.status === b.status ? byDesc(a.confirmedAt ?? "", b.confirmedAt ?? "") : a.status === "suggested" ? -1 : 1))
    .map((p) => ({ ...clone(p), confirmedByName: userName(p.confirmedBy), evidence: evidenceRefForMail(p.evidenceMailId) }));
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
      .map((ch) => ({ ...ch, evidence: evidenceRefForMail(ch.mailId) })),
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
    .map((l) => ({ ...clone(l), correctedByName: userName(l.correctedBy) ?? "", evidence: evidenceRefForMail(l.mailId) }))
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
      label: `${c.code ?? NO_CODE_LABEL} · ${c.route}${c.status === "done" ? " (완료)" : ""}`,
      done: c.status === "done",
    })),
  };
}

/** 메일 → 원문 보기 위치 (검토함에서 원문 전체 보기용) */
export async function getEvidenceRefForMail(mailId: string): Promise<EvidenceRef | null> {
  return evidenceRefForMail(mailId);
}

/* ───────────── 검색 (TopBar) ───────────── */

/** scope: mine = 내가 맡은 건만 (실무자), company = 회사 전체 (대표) */
export async function search(
  query: string,
  scope: "mine" | "company" = "mine",
): Promise<{ cases: CaseSummary[]; shippers: Shipper[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { cases: [], shippers: [] };
  const has = (...v: (string | null)[]) => v.some((x) => x?.toLowerCase().includes(q));
  return {
    cases: db.cases
      .filter((c) => scope === "company" || c.ownerId === db.CURRENT_USER_ID)
      .filter((c) => c.status !== "done" || has(c.code))
      .filter((c) => has(c.code, c.blNo, c.bookingNo, findShipper(c.shipperId).name, c.route))
      .sort(byDeadline)
      .slice(0, 8)
      .map(summarize),
    shippers: clone(db.shippers.filter((s) => has(s.name))),
  };
}

/* ───────────── 인계 (W-08 / W-09 / W-12, 대표 R-07 / R-08) ───────────── */

export interface HandoverSummary extends Handover {
  fromName: string;
  /** 넘기는 사람이 퇴사 예정이면 그 날짜 */
  fromLeavingAt: string | null;
  toName: string | null;
  shipperNames: string[];
  /** 화주별로 넘어가는 건 수 */
  caseCountByShipper: Record<string, number>;
  /** 남은 미결 사항 (끝나지 않은 것) 수 */
  openCount: number;
  pending: (HandoverItem & { caseCode: string | null; shipperName: string })[];
}

function summarizeHandover(h: Handover): HandoverSummary {
  const pending = db.handoverItems
    .filter((i) => i.handoverId === h.id && i.kind === "pending")
    .map((i) => ({
      ...clone(i),
      caseCode: i.caseId ? (findCase(i.caseId)?.code ?? null) : null,
      shipperName: findShipper(i.shipperId).name,
    }));
  return {
    ...clone(h),
    fromName: userName(h.fromUserId) ?? "",
    fromLeavingAt: db.users.find((u) => u.id === h.fromUserId)?.leavingAt ?? null,
    toName: userName(h.toUserId),
    shipperNames: h.shipperIds.map((id) => findShipper(id).name),
    caseCountByShipper: Object.fromEntries(
      h.shipperIds.map((sid) => [sid, h.caseIds.filter((cid) => findCase(cid)?.shipperId === sid).length]),
    ),
    openCount: pending.filter((i) => !i.done).length,
    pending,
  };
}

/** 현재 사용자 기준 보낸 · 받은 인계 (최근 요청 순) */
export async function getHandovers(): Promise<{ sent: HandoverSummary[]; received: HandoverSummary[] }> {
  const me = db.CURRENT_USER_ID;
  const sorted = [...db.handovers].sort((a, b) => byDesc(a.requestedAt, b.requestedAt));
  return {
    sent: sorted.filter((h) => h.fromUserId === me).map(summarizeHandover),
    received: sorted.filter((h) => h.toUserId === me).map(summarizeHandover),
  };
}

/** 회사 전체 인계 (대표 R-07) */
export async function getAllHandovers(): Promise<HandoverSummary[]> {
  return [...db.handovers].sort((a, b) => byDesc(a.requestedAt, b.requestedAt)).map(summarizeHandover);
}

export async function getHandover(id: string): Promise<HandoverSummary | null> {
  const h = db.handovers.find((x) => x.id === id);
  return h ? summarizeHandover(h) : null;
}

export interface HandoverCandidate {
  shipper: Shipper;
  activeCases: { id: string; code: string | null; label: string; needsCheck: boolean }[];
  needsCheckCount: number;
}

/** W-08: 넘길 수 있는 화주 (내가 맡은 화주, 진행 중인 건이 많은 순) */
export async function getHandoverCandidates(): Promise<HandoverCandidate[]> {
  return db.shippers
    .filter((s) => s.ownerId === db.CURRENT_USER_ID)
    .map((s) => {
      const active = db.cases.filter((c) => c.shipperId === s.id && c.status !== "done").sort(byDeadline);
      return {
        shipper: clone(s),
        activeCases: active.map((c) => ({
          id: c.id,
          code: c.code,
          label: `${c.code ?? NO_CODE_LABEL} · ${c.stateSummary}`,
          needsCheck: c.status === "needs_check",
        })),
        needsCheckCount: active.filter((c) => c.status === "needs_check").length,
      };
    })
    .filter((x) => x.activeCases.length > 0);
}

export interface HandoverShipperPreview {
  shipper: Shipper;
  /** 자동 생성 요약 (사람이 고칠 수 있음) */
  summary: { trade: string; patterns: string; latestChange: string | null; caution: string | null };
  cases: (CaseSummary & { remaining: string; dueDate: string | null })[];
  /** 미결: 확인 필요 건 + 확인 필요 조건 */
  openCount: number;
  notes: { id: string; title: string; sub: string; done: boolean }[];
  mails: { id: string; subject: string; receivedAt: string; evidence: EvidenceRef | null }[];
}

const TRADE_LABEL: Record<Shipper["tradeType"], string> = {
  sea_export: "해상 수출",
  sea_import: "해상 수입",
  air_export: "항공 수출",
  air_import: "항공 수입",
  domestic: "국내 운송",
};

/** W-09 인계 미리보기: 화주별 요약 · 남은 일 · 중요 사항 · 근거 메일 */
export async function getHandoverPreview(shipperIds: string[], handoverId?: string): Promise<HandoverShipperPreview[]> {
  return shipperIds
    .filter((id) => db.shippers.some((s) => s.id === id))
    .map((id) => {
      const s = findShipper(id);
      const active = db.cases.filter((c) => c.shipperId === id && c.status !== "done").sort((a, b) => stageIndex(a) - stageIndex(b));
      const patterns = db.shipperPatterns.filter((p) => p.shipperId === id);
      const confirmed = patterns.filter((p) => p.status === "confirmed");
      const caution = patterns.find((p) => p.status === "suggested");
      const change = db.shipperChanges.filter((c) => c.shipperId === id).sort((a, b) => byDesc(a.at, b.at))[0];
      const shortPattern = (t: string) =>
        t.replace("인보이스 보낼 때 재무팀을 항상 참조(CC)", "인보이스 재무팀 CC").replace("B/L은 서렌더로 발행", "B/L 서렌더");

      const cases = active.map((c) => {
        const task = db.caseTasks.find((t) => t.caseId === c.id && !t.done);
        const due = task?.dueDate ?? c.nextDeadline?.date ?? null;
        return { ...summarize(c), remaining: task?.title ?? c.nextAction ?? c.stateSummary, dueDate: due };
      });

      const notes = db.handoverItems
        .filter((i) => i.shipperId === id && i.kind === "note" && (!handoverId || i.handoverId === handoverId))
        .map((i) => ({
          id: i.id,
          title: i.title,
          sub: `${i.caseId ? (findCase(i.caseId)?.code ?? NO_CODE_LABEL) : s.name} · ${i.origin === "auto" ? "자동 정리" : "직접 추가"}`,
          done: i.done,
        }));

      const caseIds = new Set(active.map((c) => c.id));
      const mailIds = new Set([
        ...db.mailCaseLinks.filter((l) => caseIds.has(l.caseId)).map((l) => l.mailId),
        ...db.shipperChanges.filter((c) => c.shipperId === id && c.mailId).map((c) => c.mailId!),
      ]);
      const mails = db.mails
        .filter((m) => mailIds.has(m.id))
        .sort((a, b) => byDesc(a.receivedAt, b.receivedAt))
        .slice(0, 4)
        .map((m) => ({ id: m.id, subject: m.subject, receivedAt: m.receivedAt, evidence: evidenceRefForMail(m.id) }));

      return {
        shipper: clone(s),
        summary: {
          trade: `${TRADE_LABEL[s.tradeType]} · ${s.route}`,
          patterns: confirmed.length ? confirmed.slice(0, 2).map((p) => shortPattern(p.text)).join(" · ") : "아직 확인된 조건 없음",
          latestChange: change ? `${change.title} (${change.at.slice(5, 7).replace(/^0/, "")}/${change.at.slice(8, 10)})` : null,
          caution: caution ? caution.text.replace("대기료가 생기면 미리 알려야 함", "대기료는 미리 알려야 함") : null,
        },
        cases,
        openCount:
          active.filter((c) => c.status === "needs_check").length +
          db.shipperChanges.filter((c) => c.shipperId === id && c.status === "needs_check").length,
        notes,
        mails,
      };
    });
}

/* ───────────── 설정 (W-15 / W-16, 대표 관리자 모드 R-10 / R-11) ───────────── */

export interface MailScope {
  /** 내 사서함 + 회사 공용 사서함 (다른 사람 개인 사서함은 제외) */
  mailboxes: CompanyMailbox[];
  settings: CompanyMailSettings;
}

export async function getMailScope(): Promise<MailScope> {
  return {
    mailboxes: clone(db.companyMailboxes.filter((m) => m.kind === "shared" || m.ownerUserId === db.CURRENT_USER_ID)),
    settings: clone(db.companyMailSettings),
  };
}

/** 관리자 모드: 회사 전체 사서함 */
export async function getCompanyMailScope(): Promise<MailScope> {
  return { mailboxes: clone(db.companyMailboxes), settings: clone(db.companyMailSettings) };
}

export interface Member extends User {
  shipperCount: number;
  activeCaseCount: number;
  /** 퇴사 예정 등 담당자 없는 인계를 요청한 사람 */
  leaving: boolean;
}

export async function getMembers(): Promise<Member[]> {
  return db.users.map((u) => ({
    ...clone(u),
    shipperCount: db.shippers.filter((s) => s.ownerId === u.id).length,
    activeCaseCount: db.cases.filter((c) => c.ownerId === u.id && c.status !== "done").length,
    leaving: db.handovers.some((h) => h.fromUserId === u.id && h.reason === "resign"),
  }));
}

/* ───────────── 대표 화면 (R-01 ~ R-12) ───────────── */

export async function getOwnerUser(): Promise<User> {
  return clone(db.users.find((u) => u.id === db.OWNER_USER_ID)!);
}

const activeOf = (shipperId: string) => db.cases.filter((c) => c.shipperId === shipperId && c.status !== "done");

/** "선적일 변경 확정 (11/14)" — 화주의 가장 최근 움직임 */
function lastActivity(shipperId: string): { text: string; at: string } | null {
  const c = [...activeOf(shipperId)].sort((a, b) => byDesc(a.updatedAt, b.updatedAt))[0];
  if (!c) return null;
  const text = c.blocked?.reason ?? c.latestChange?.text ?? c.stateSummary;
  return { text, at: c.updatedAt };
}

export interface CompanyShipperRow extends Shipper {
  ownerName: string;
  activeCaseCount: number;
  /** 막혀 있는 건: 확인 필요 / 답변·승인 대기 */
  blockedCheck: number;
  blockedWait: number;
  lastActivity: { text: string; at: string } | null;
}

function companyShipperRow(s: Shipper): CompanyShipperRow {
  const active = activeOf(s.id);
  return {
    ...clone(s),
    ownerName: userName(s.ownerId) ?? "",
    activeCaseCount: active.length,
    blockedCheck: active.filter((c) => c.blocked?.kind === "check").length,
    blockedWait: active.filter((c) => c.blocked && c.blocked.kind !== "check").length,
    lastActivity: lastActivity(s.id),
  };
}

/** R-02 화주 목록 (회사 전체) */
export async function getCompanyShippers(): Promise<CompanyShipperRow[]> {
  return db.shippers.map(companyShipperRow).sort((a, b) => byDesc(a.lastChangedAt, b.lastChangedAt));
}

export interface BlockedCase extends CaseSummary {
  blocked: NonNullable<Case["blocked"]>;
  /** 멈춘 지 며칠 */
  stoppedDays: number;
  ownerLeavingAt: string | null;
}

/** R-05 막혀 있는 건: 오래 멈춘 순 */
export async function getBlockedCases(): Promise<BlockedCase[]> {
  return db.cases
    .filter((c) => c.blocked && c.status !== "done")
    .map((c) => ({
      ...summarize(c),
      blocked: clone(c.blocked!),
      stoppedDays: -daysUntil(c.blocked!.since),
      ownerLeavingAt: db.users.find((u) => u.id === c.ownerId)?.leavingAt ?? null,
    }))
    .sort((a, b) => b.stoppedDays - a.stoppedDays);
}

export interface CompanyOverview {
  shipperCount: number;
  activeCaseCount: number;
  blocked: { total: number; wait: number; check: number };
  /** 확인 필요: 확인 필요 건 + 열린 검토 + 확인 안 된 조건 */
  needsCheckCount: number;
  shippers: CompanyShipperRow[];
  /** 기한 임박 · 미결 건 */
  urgentCases: CaseSummary[];
  handovers: HandoverSummary[];
}

/** R-01 대표 홈 · 회사 현황 */
export async function getCompanyOverview(): Promise<CompanyOverview> {
  const active = db.cases.filter((c) => c.status !== "done");
  const blocked = active.filter((c) => c.blocked);
  const shippers = db.shippers
    .map(companyShipperRow)
    .filter((s) => s.activeCaseCount > 0)
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName, "ko") || byDesc(a.lastChangedAt, b.lastChangedAt));
  return {
    shipperCount: db.shippers.length,
    activeCaseCount: active.length,
    blocked: {
      total: blocked.length,
      wait: blocked.filter((c) => c.blocked!.kind !== "check").length,
      check: blocked.filter((c) => c.blocked!.kind === "check").length,
    },
    needsCheckCount:
      active.filter((c) => c.status === "needs_check").length +
      db.reviewItems.filter((r) => r.status === "open").length +
      db.shipperChanges.filter((ch) => ch.status === "needs_check").length,
    shippers,
    urgentCases: active
      .filter((c) => c.nextDeadline && c.status !== "in_progress")
      .sort(byDeadline)
      .slice(0, 4)
      .map(summarize),
    handovers: (await getAllHandovers()).filter((h) => h.status !== "done").slice(0, 3),
  };
}

export interface ShipperHistoryRow extends ShipperChange {
  ownerNameAtTime: string | null;
}

/** R-04 화주 이력: 조건이 바뀐 날짜와 근거 (최근 순) */
export async function getShipperHistory(id: string): Promise<{ shipper: Shipper; rows: ShipperHistoryRow[]; startedAt: string | null } | null> {
  const shipper = db.shippers.find((s) => s.id === id);
  if (!shipper) return null;
  const rows = db.shipperChanges
    .filter((c) => c.shipperId === id)
    .sort((a, b) => byDesc(a.at, b.at))
    .map((c) => ({ ...clone(c), ownerNameAtTime: userName(c.ownerIdAtTime) }));
  return { shipper: clone(shipper), rows, startedAt: rows.find((r) => r.kind === "start")?.at ?? null };
}

export interface AssignContext {
  from: User;
  shippers: (CompanyShipperRow & { openCount: number })[];
  /** 배정 받을 수 있는 사람 + 지금 담당 화주 수 */
  receivers: { id: string; name: string; shipperCount: number }[];
}

/** R-09 담당자 지정: 현재 담당자의 화주를 다음 담당자에게 */
export async function getAssignContext(fromUserId: string): Promise<AssignContext | null> {
  const from = db.users.find((u) => u.id === fromUserId);
  if (!from) return null;
  return {
    from: clone(from),
    shippers: db.shippers
      .filter((s) => s.ownerId === fromUserId)
      .map((s) => {
        const row = companyShipperRow(s);
        const open =
          activeOf(s.id).filter((c) => c.status === "needs_check").length +
          db.shipperChanges.filter((c) => c.shipperId === s.id && c.status === "needs_check").length;
        return { ...row, openCount: open };
      }),
    receivers: db.users
      .filter((u) => u.id !== fromUserId && u.role !== "ceo" && u.status === "active")
      .map((u) => ({ id: u.id, name: u.name, shipperCount: db.shippers.filter((s) => s.ownerId === u.id).length })),
  };
}

/** 담당자 지정 화면에서 고를 수 있는 현재 담당자 (화주가 있는 실무자·팀장) */
export async function getOwnersWithShippers(): Promise<{ id: string; name: string; leavingAt: string | null; shipperCount: number }[]> {
  return db.users
    .filter((u) => u.role !== "ceo")
    .map((u) => ({ id: u.id, name: u.name, leavingAt: u.leavingAt, shipperCount: db.shippers.filter((s) => s.ownerId === u.id).length }))
    .filter((u) => u.shipperCount > 0);
}

export async function getContract(): Promise<CompanyContract & { mailboxCount: number; retentionYears: number }> {
  return {
    ...clone(db.companyContract),
    mailboxCount: db.companyMailboxes.filter((m) => m.allowed).length,
    retentionYears: db.companyMailSettings.retentionYears,
  };
}
