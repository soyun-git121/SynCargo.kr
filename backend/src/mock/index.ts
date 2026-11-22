import type {
  Case,
  CaseEvent,
  CaseTask,
  Company,
  CompanyContract,
  CompanyMailbox,
  CompanyMailSettings,
  CorrectionLog,
  Evidence,
  ExtractedItem,
  Handover,
  HandoverItem,
  MailCaseLink,
  MailboxConnection,
  OffMailInfo,
  ReviewItem,
  Shipper,
  ShipperChange,
  ShipperPattern,
  User,
} from "../types";
import { attachments, mails } from "./mails";

/**
 * 가짜 데이터 저장소 — 내용은 Figma 실무자 화면(W-01~W-14) 기준.
 * 화면에서는 절대 직접 import 하지 말 것 → lib/data.ts 사용.
 */

export { attachments, mails };

const CO = "co1";

export const company: Company = {
  id: CO,
  name: "데모포워딩",
  domain: "demo-forwarding.kr",
  createdAt: "2026-08-01T09:00:00+09:00",
};

export const CURRENT_USER_ID = "u1";
/** 대표 화면(/owner)에서 보는 사람 */
export const OWNER_USER_ID = "u5";

export const users: User[] = [
  { id: "u1", companyId: CO, name: "김대리", role: "staff", isAdmin: false, email: "kim@demo-forwarding.kr", status: "active", leavingAt: null },
  { id: "u2", companyId: CO, name: "박주임", role: "staff", isAdmin: false, email: "park@demo-forwarding.kr", status: "active", leavingAt: null },
  { id: "u3", companyId: CO, name: "이사원", role: "staff", isAdmin: false, email: "lee@demo-forwarding.kr", status: "active", leavingAt: null },
  { id: "u6", companyId: CO, name: "한사원", role: "staff", isAdmin: false, email: "han@demo-forwarding.kr", status: "leaving", leavingAt: "2026-11-30" },
  { id: "u4", companyId: CO, name: "최팀장", role: "lead", isAdmin: false, email: "choi@demo-forwarding.kr", status: "active", leavingAt: null },
  { id: "u5", companyId: CO, name: "정대표", role: "ceo", isAdmin: true, email: "jung@demo-forwarding.kr", status: "active", leavingAt: null },
];

export const mailboxConnections: MailboxConnection[] = [
  {
    id: "mb1",
    userId: "u1",
    provider: "microsoft",
    email: "kim@demo-forwarding.kr",
    status: "connected",
    connectedAt: "2026-08-16T10:00:00+09:00",
    lastSyncAt: "2026-11-16T09:12:00+09:00",
    syncFrom: "2026-08-16",
    folders: ["받은편지함", "보낸편지함"],
    mailCount: 1284,
    lastSyncFailedCount: 0,
    setupStepsDone: 2,
  },
];

export const companyMailboxes: CompanyMailbox[] = [
  { id: "cmb1", companyId: CO, email: "kim@demo-forwarding.kr", label: "내 사서함", kind: "personal", ownerUserId: "u1", allowed: true },
  { id: "cmb2", companyId: CO, email: "ops@demo-forwarding.kr", label: "운영 공용 사서함", kind: "shared", ownerUserId: null, allowed: true },
  { id: "cmb3", companyId: CO, email: "sales@demo-forwarding.kr", label: "영업 공용 사서함", kind: "shared", ownerUserId: null, allowed: false },
  { id: "cmb4", companyId: CO, email: "park@demo-forwarding.kr", label: "박주임 사서함", kind: "personal", ownerUserId: "u2", allowed: true },
  { id: "cmb5", companyId: CO, email: "lee@demo-forwarding.kr", label: "이사원 사서함", kind: "personal", ownerUserId: "u3", allowed: true },
  { id: "cmb6", companyId: CO, email: "han@demo-forwarding.kr", label: "한사원 사서함", kind: "personal", ownerUserId: "u6", allowed: true },
  { id: "cmb7", companyId: CO, email: "choi@demo-forwarding.kr", label: "최팀장 사서함", kind: "personal", ownerUserId: "u4", allowed: true },
  { id: "cmb8", companyId: CO, email: "jung@demo-forwarding.kr", label: "대표 사서함", kind: "personal", ownerUserId: "u5", allowed: false },
];

export const companyContract: CompanyContract = {
  companyId: CO,
  plan: "회사 단위 월 구독",
  seats: 6,
  teams: 2,
  nextBillingDate: "2026-12-01",
  monthlyQuota: 10000,
  usedThisMonth: 8200,
};

export const companyMailSettings: CompanyMailSettings = {
  companyId: CO,
  syncFrom: "2026-01-01",
  retentionYears: 5,
  ceoMailAccess: "shared_only",
};

export const handovers: Handover[] = [
  // 받은 인계 (홈 '받은 인계', W-12 받은 인계 탭)
  {
    id: "h1", fromUserId: "u2", toUserId: "u1", shipperIds: ["s1", "s7", "s8"], caseIds: [],
    reason: "reassign", periodStart: "2026-11-16", periodEnd: null,
    status: "approved", contacts: null, requestedAt: "2026-11-14T17:00:00+09:00", approvedAt: "2026-11-16T08:30:00+09:00",
  },
  // 보낸 인계 (W-12 보낸 인계 탭)
  {
    id: "h2", fromUserId: "u1", toUserId: "u2", shipperIds: ["s1", "s2", "s3"], caseIds: ["c014", "c009", "c031", "c-cus", "c013", "c-dom"],
    reason: "vacation", periodStart: "2026-11-23", periodEnd: "2026-11-27",
    status: "requested", contacts: "A전자 박과장 · 선사 담당", requestedAt: "2026-11-16T09:40:00+09:00", approvedAt: null,
  },
  {
    id: "h3", fromUserId: "u1", toUserId: "u3", shipperIds: ["s4"], caseIds: ["c011", "c-d-022"],
    reason: "vacation", periodStart: "2026-11-10", periodEnd: "2026-11-14",
    status: "active", contacts: null, requestedAt: "2026-11-06T10:00:00+09:00", approvedAt: "2026-11-07T09:00:00+09:00",
  },
  {
    id: "h4", fromUserId: "u1", toUserId: "u2", shipperIds: ["s7", "s8"], caseIds: ["c-g-018", "c-h-025", "c-f-002"],
    reason: "vacation", periodStart: "2026-10-06", periodEnd: "2026-10-10",
    status: "done", contacts: null, requestedAt: "2026-10-01T10:00:00+09:00", approvedAt: "2026-10-02T09:00:00+09:00",
  },
  // 대표 화면: 담당자 없는 인계 (11/30 퇴사 예정 한사원)
  {
    id: "h5", fromUserId: "u6", toUserId: null, shipperIds: ["s13", "s14", "s15", "s16", "s17", "s18", "s19"],
    caseIds: ["c018", "c-p2", "c-p3", "c-q1", "c-q2", "c-r1", "c-s1", "c-s2", "c-t1", "c-u1", "c-v1"],
    reason: "resign", periodStart: "2026-11-30", periodEnd: null,
    status: "requested", contacts: "P바이오 김과장 · Q스틸 물류팀", requestedAt: "2026-11-15T16:00:00+09:00", approvedAt: null,
  },
  // 이사원 → 최팀장 담당 변경 (진행 중)
  {
    id: "h6", fromUserId: "u3", toUserId: "u4", shipperIds: ["s6"], caseIds: ["c-f-002", "c-f-003"],
    reason: "reassign", periodStart: "2026-11-10", periodEnd: null,
    status: "active", contacts: null, requestedAt: "2026-11-07T10:00:00+09:00", approvedAt: "2026-11-09T09:00:00+09:00",
  },
];

export const handoverItems: HandoverItem[] = [
  { id: "hi1", handoverId: "h2", kind: "pending", shipperId: "s1", caseId: "c014", title: "패킹리스트 받기", dueDate: "2026-11-18", origin: "auto", done: false },
  { id: "hi2", handoverId: "h2", kind: "pending", shipperId: "s1", caseId: "c014", title: "인보이스 금액 차이 확인", dueDate: "2026-11-18", origin: "auto", done: false },
  { id: "hi3", handoverId: "h2", kind: "pending", shipperId: "s1", caseId: "c031", title: "청구서 발송", dueDate: "2026-11-20", origin: "auto", done: true },
  { id: "hi4", handoverId: "h2", kind: "note", shipperId: "s1", caseId: "c014", title: "인보이스 금액 차이를 화주에 확인", dueDate: null, origin: "auto", done: false },
  { id: "hi6", handoverId: "h5", kind: "pending", shipperId: "s13", caseId: "c018", title: "서류 확인 (P바이오)", dueDate: "2026-11-21", origin: "auto", done: false },
  { id: "hi7", handoverId: "h5", kind: "pending", shipperId: "s13", caseId: "c-p2", title: "선적 서류 회신", dueDate: "2026-11-24", origin: "auto", done: false },
  { id: "hi8", handoverId: "h5", kind: "pending", shipperId: "s14", caseId: "c-q1", title: "선적 완료 통지", dueDate: "2026-11-19", origin: "auto", done: false },
  { id: "hi9", handoverId: "h5", kind: "pending", shipperId: "s16", caseId: "c-s1", title: "부킹 확정 회신", dueDate: "2026-11-20", origin: "auto", done: false },
  { id: "hi10", handoverId: "h6", kind: "pending", shipperId: "s6", caseId: "c-f-003", title: "도착 통지 확인", dueDate: "2026-11-22", origin: "auto", done: false },
  { id: "hi5", handoverId: "h2", kind: "note", shipperId: "s1", caseId: null, title: "창고 변경 여부 전화로 확인", dueDate: null, origin: "auto", done: false },
];

/* ───────────── 화주 (W-02) ───────────── */

function shipper(
  id: string,
  name: string,
  tradeType: Shipper["tradeType"],
  route: string,
  domains: string[],
  lastChangedAt: string,
  extra: Partial<Shipper> = {},
): Shipper {
  return {
    id, companyId: CO, name, tradeType, route, ownerId: "u1", emailDomains: domains,
    memo: "", memoUpdatedAt: null, memoUpdatedBy: null, lastReviewedAt: null, lastChangedAt,
    ...extra,
  };
}

export const shippers: Shipper[] = [
  shipper("s5", "E코스메틱", "air_export", "인천 → 파리", ["e-cosmetic.com"], "2026-11-15T09:00:00+09:00"),
  shipper("s1", "A전자", "sea_export", "부산 → 롱비치", ["a-elec.co.kr"], "2026-11-14T10:22:00+09:00", {
    memo: "담당자 박과장님으로 바뀜 (11/08)\n결제 조건 45일 요청 건, 아직 회신 전",
    memoUpdatedAt: "2026-11-14T18:00:00+09:00",
    memoUpdatedBy: "u1",
    lastReviewedAt: "2026-11-12",
  }),
  shipper("s4", "D모터스", "sea_export", "인천 → 함부르크", ["dmotors.co.kr"], "2026-11-12T11:00:00+09:00"),
  shipper("s3", "C케미칼", "domestic", "통관", ["c-chem.co.kr"], "2026-11-15T08:45:00+09:00"),
  shipper("s2", "B푸드", "sea_import", "호치민 → 부산", ["bfood.co.kr"], "2026-11-13T10:00:00+09:00"),
  shipper("s7", "G텍스타일", "sea_export", "부산 → 자카르타", ["g-textile.co.kr"], "2026-11-11T10:00:00+09:00"),
  shipper("s6", "F리빙", "sea_import", "닝보 → 부산", ["f-living.co.kr"], "2026-11-09T10:00:00+09:00"),
  shipper("s8", "H머티리얼", "sea_import", "칭다오 → 인천", ["h-material.co.kr"], "2026-11-07T10:00:00+09:00"),
  // 박주임
  shipper("s9", "J로지텍", "sea_import", "통관", ["j-logitech.co.kr"], "2026-11-15T10:00:00+09:00", { ownerId: "u2" }),
  shipper("s10", "K트레이딩", "sea_import", "닝보 → 부산", ["k-trading.co.kr"], "2026-11-14T10:00:00+09:00", { ownerId: "u2" }),
  // 이사원
  shipper("s11", "M케어", "air_export", "인천 → LA", ["m-care.co.kr"], "2026-11-10T10:00:00+09:00", { ownerId: "u3" }),
  shipper("s12", "N인더스", "sea_export", "부산 → 호치민", ["n-indus.co.kr"], "2026-11-13T10:00:00+09:00", { ownerId: "u3" }),
  // 한사원 (11/30 퇴사 예정)
  shipper("s13", "P바이오", "sea_export", "부산 → 시드니", ["p-bio.co.kr"], "2026-11-11T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s14", "Q스틸", "sea_export", "광양 → 휴스턴", ["q-steel.co.kr"], "2026-11-13T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s15", "R가구", "sea_import", "하이퐁 → 부산", ["r-furniture.co.kr"], "2026-11-09T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s16", "S글라스", "sea_export", "부산 → 두바이", ["s-glass.co.kr"], "2026-11-14T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s17", "T푸드", "sea_import", "칭다오 → 평택", ["t-food.co.kr"], "2026-11-08T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s18", "U패션", "air_import", "호치민 → 인천", ["u-fashion.co.kr"], "2026-11-12T10:00:00+09:00", { ownerId: "u6" }),
  shipper("s19", "V일렉", "sea_import", "통관", ["v-elec.co.kr"], "2026-11-10T10:00:00+09:00", { ownerId: "u6" }),
];

/* ───────────── 반복 조건 · 화주 변경 이력 (W-03) ───────────── */

export const shipperPatterns: ShipperPattern[] = [
  { id: "p1", shipperId: "s1", text: "대기료가 생기면 미리 알려야 함", status: "suggested", note: "메일 1건에서만 보임 · 맞는 내용인지 확인해 주세요", evidenceMailId: "m03", evidenceText: "대기료 발생 시 사전에 꼭 알려 주세요.", confirmedAt: null, confirmedBy: null },
  { id: "p2", shipperId: "s1", text: "인보이스 보낼 때 재무팀을 항상 참조(CC)", status: "confirmed", note: null, evidenceMailId: "m04", evidenceText: "인보이스는 재무팀(finance@)도 꼭 참조로 넣어 주세요.", confirmedAt: "2026-11-12T10:00:00+09:00", confirmedBy: "u1" },
  { id: "p3", shipperId: "s1", text: "B/L은 서렌더로 발행", status: "confirmed", note: null, evidenceMailId: "m06", evidenceText: "B/L은 서렌더로 발행 부탁드립니다.", confirmedAt: "2026-10-30T12:00:00+09:00", confirmedBy: "u1" },
  { id: "p4", shipperId: "s1", text: "서류 마감 하루 전에 재확인 전화", status: "confirmed", note: null, evidenceMailId: null, evidenceText: "서류 마감 전날 한 번 더 전화 부탁드려요.", confirmedAt: "2026-10-21T10:00:00+09:00", confirmedBy: "u1" },
];

export const shipperChanges: ShipperChange[] = [
  { id: "sc1", shipperId: "s1", title: "도착지 창고 주소 변경", before: null, after: null, sourceLabel: "화주 메일", status: "confirmed", mailId: "m03", at: "2026-11-14T10:22:00+09:00", kind: "change", ownerIdAtTime: "u1", evidenceText: "도착지 창고가 롱비치 B창고로 바뀝니다." },
  { id: "sc2", shipperId: "s1", title: "화주 담당자 변경", before: "이과장", after: "박과장", sourceLabel: "화주 메일", status: "confirmed", mailId: "m01", at: "2026-11-08T09:00:00+09:00", kind: "change", ownerIdAtTime: "u1", evidenceText: "앞으로 A전자 물류 담당은 박과장이 맡습니다." },
  { id: "sc3", shipperId: "s1", title: "결제 조건 변경 요청", before: "30일", after: "45일", sourceLabel: "아직 확정 안 됨", status: "needs_check", mailId: null, at: "2026-11-02T14:00:00+09:00", kind: "change", ownerIdAtTime: "u1", evidenceText: "결제 조건을 45일로 조정 가능할지 검토 부탁드립니다." },
  { id: "sc4", shipperId: "s1", title: "B/L 발행", before: "오리지널", after: "서렌더", sourceLabel: "화주 메일", status: "confirmed", mailId: "m06", at: "2026-10-30T12:00:00+09:00", kind: "change", ownerIdAtTime: "u1", evidenceText: "B/L은 서렌더로 발행 부탁드립니다." },
  { id: "sc5", shipperId: "s1", title: "담당 변경", before: "이사원", after: "김대리", sourceLabel: "인계", status: "confirmed", mailId: null, at: "2026-08-19T09:00:00+09:00", kind: "handover", ownerIdAtTime: null, evidenceText: "인계 승인 · 이사원 → 김대리 (담당 변경)" },
  { id: "sc6", shipperId: "s1", title: "인보이스 보낼 때 재무팀 CC 추가", before: null, after: null, sourceLabel: "화주 메일", status: "confirmed", mailId: null, at: "2026-06-03T10:00:00+09:00", kind: "change", ownerIdAtTime: "u3", evidenceText: "인보이스는 재무팀(finance@)도 꼭 참조로 넣어 주세요." },
  { id: "sc7", shipperId: "s1", title: "거래 시작 · 부산 → 롱비치", before: null, after: null, sourceLabel: "계약 메일", status: "confirmed", mailId: null, at: "2026-03-11T10:00:00+09:00", kind: "start", ownerIdAtTime: "u3", evidenceText: "부산 → 롱비치 정기 물량 진행 부탁드립니다." },
];

/* ───────────── 업무 건 (W-04) ───────────── */

const caseBase = {
  companyId: CO,
  ownerId: "u1",
  blNo: null,
  bookingNo: null,
  latestChange: null,
  closedAt: null,
  need: null,
  blocked: null,
} satisfies Partial<Case>;

const activeCases: Case[] = [
  {
    ...caseBase, id: "c-dom", code: null, kind: "domestic", shipperId: "s3",
    tradeType: "domestic", route: "울산 → 평택", stage: "shipping", status: "in_progress",
    stateSummary: "상차 대기", stateNote: "11/16 상차 시간 확정",
    nextDeadline: { label: "상차", date: "2026-11-17", detail: "오전 9시 울산 공장" },
    nextAction: "기사 배정 확인",
    need: { title: "상차 기사 배정", note: "11/17 오전 9시 울산 공장 상차" },
    latestChange: { text: "국내 운송 상차 시간 확정", at: "2026-11-16T08:45:00+09:00" },
    createdAt: "2026-11-10T09:00:00+09:00", updatedAt: "2026-11-16T08:45:00+09:00",
  },
  {
    ...caseBase, id: "c014", code: "SC-2611-014", kind: "shipment", shipperId: "s1",
    tradeType: "sea_export", route: "부산 → 롱비치", stage: "docs", status: "needs_check",
    stateSummary: "부킹 확정 · 서류 대기", stateNote: "11/14 선적일 11/20으로 확정",
    bookingNo: "HDBK7781203",
    blocked: { kind: "check", reason: "인보이스 금액 확인 필요", since: "2026-11-15" },
    nextDeadline: { label: "서류 마감", date: "2026-11-18", detail: "선사 서류 마감 17시" },
    nextAction: "화주에 패킹리스트 요청",
    need: { title: "패킹리스트 수정본 · 인보이스 금액 확인", note: "인보이스 금액이 메일과 첨부에서 다름" },
    latestChange: { text: "화주가 선적일 변경 요청", at: "2026-11-16T09:50:00+09:00" },
    createdAt: "2026-11-05T09:25:00+09:00", updatedAt: "2026-11-15T17:05:00+09:00",
  },
  {
    ...caseBase, id: "c-cus", code: null, kind: "customs", shipperId: "s1",
    tradeType: "sea_import", route: "통관", stage: "docs", status: "in_progress",
    stateSummary: "수입신고 준비", stateNote: "11/14 관세사 서류 요청",
    nextDeadline: { label: "신고", date: "2026-11-18", detail: "수입신고 예정" },
    nextAction: "관세사에 서류 전달",
    need: { title: "수입신고 서류 일체", note: "11/14 관세사가 서류 요청" },
    createdAt: "2026-11-12T09:00:00+09:00", updatedAt: "2026-11-14T13:30:00+09:00",
  },
  {
    ...caseBase, id: "c013", code: "SC-2611-013", kind: "shipment", shipperId: "s2",
    tradeType: "sea_import", route: "호치민 → 부산", stage: "arrival", status: "in_progress",
    stateSummary: "도착 · 검역 대기", stateNote: "11/16 검역 서류 접수 회신",
    blNo: "HCMB2611013",
    nextDeadline: { label: "검역", date: "2026-11-19", detail: "검역 서류 접수 기한" },
    nextAction: "검역 서류 확인",
    need: { title: "검역 서류 원본", note: "검역 서류 접수 기한 11/19" },
    latestChange: { text: "검역 서류 접수 회신", at: "2026-11-16T10:15:00+09:00" },
    createdAt: "2026-11-03T09:00:00+09:00", updatedAt: "2026-11-16T10:15:00+09:00",
  },
  {
    ...caseBase, id: "c011", code: "SC-2611-011", kind: "shipment", shipperId: "s4",
    tradeType: "sea_export", route: "인천 → 함부르크", stage: "booking", status: "awaiting_reply",
    stateSummary: "부킹 요청 · 선사 회신 대기", stateNote: "11/16 선사에 부킹 요청",
    blocked: { kind: "reply", reason: "선사 부킹 답변 대기", since: "2026-11-12" },
    nextDeadline: { label: "부킹", date: "2026-11-20", detail: "부킹 확정 회신 기한" },
    nextAction: "선사 회신 기다림",
    need: { title: "선사 부킹 확정 회신", note: "11/16 부킹 요청 후 회신 대기" },
    latestChange: { text: "선사 부킹 회신 대기", at: "2026-11-16T09:30:00+09:00" },
    createdAt: "2026-11-14T09:00:00+09:00", updatedAt: "2026-11-16T09:30:00+09:00",
  },
  {
    ...caseBase, id: "c031", code: "SC-2610-031", kind: "shipment", shipperId: "s1",
    tradeType: "sea_export", route: "부산 → 롱비치", stage: "settlement", status: "in_progress",
    stateSummary: "정산 중", stateNote: "11/13 재무팀 청구 요청",
    blNo: "HDLB2610031", bookingNo: "HDBK7765530",
    nextDeadline: { label: "청구", date: "2026-11-20", detail: "재무팀 요청 기한" },
    nextAction: "청구서 발송",
    need: { title: "청구서 · 정산 내역", note: "재무팀이 11/20까지 요청" },
    createdAt: "2026-10-08T10:00:00+09:00", updatedAt: "2026-11-13T14:00:00+09:00",
  },
  {
    ...caseBase, id: "c007", code: "SC-2611-007", kind: "shipment", shipperId: "s5",
    tradeType: "air_export", route: "인천 → 파리", stage: "docs", status: "needs_check",
    stateSummary: "부킹 확정 · 선적 대기", stateNote: "11/16 화주가 선적일 변경 문의",
    bookingNo: "KE-AWB-18077420",
    nextDeadline: { label: "선적", date: "2026-11-21", detail: "항공 출발 예정" },
    nextAction: "선적일 변경 확인",
    need: { title: "변경할 선적일 확정", note: "화주가 선적일 변경 가능 여부 문의" },
    latestChange: { text: "선적일 변경 가능 문의", at: "2026-11-16T09:05:00+09:00" },
    createdAt: "2026-11-09T10:20:00+09:00", updatedAt: "2026-11-16T09:05:00+09:00",
  },
  {
    ...caseBase, id: "c009", code: "SC-2611-009", kind: "shipment", shipperId: "s1",
    tradeType: "sea_export", route: "부산 → 롱비치", stage: "arrival", status: "in_progress",
    stateSummary: "선적 완료", stateNote: "11/11 부산 출항",
    blNo: "HDLB2611009", bookingNo: "HDBK7779012",
    nextDeadline: { label: "도착", date: "2026-11-25", detail: "롱비치 도착 예정" },
    nextAction: "도착 통지 대기",
    need: { title: "도착 통지", note: "롱비치 도착 예정 11/25" },
    latestChange: { text: "선적 완료 통지", at: "2026-11-16T08:10:00+09:00" },
    createdAt: "2026-11-01T11:00:00+09:00", updatedAt: "2026-11-16T08:10:00+09:00",
  },
];

/** 다른 담당자의 진행 중인 건 (대표 화면) */
function otherCase(
  id: string,
  code: string | null,
  shipperId: string,
  ownerId: string,
  tradeType: Case["tradeType"],
  route: string,
  stage: Case["stage"],
  stateSummary: string,
  deadline: [label: string, date: string],
  extra: Partial<Case> = {},
): Case {
  return {
    ...caseBase, id, code, kind: code ? "shipment" : "customs", shipperId, ownerId, tradeType, route, stage,
    status: "in_progress", stateSummary, stateNote: stateSummary,
    nextDeadline: { label: deadline[0], date: deadline[1], detail: null },
    nextAction: null,
    createdAt: "2026-11-01T09:00:00+09:00", updatedAt: "2026-11-12T09:00:00+09:00",
    ...extra,
  };
}

const otherCases: Case[] = [
  // 박주임
  otherCase("c-j1", null, "s9", "u2", "sea_import", "통관", "arrival", "통관 완료", ["정산", "2026-11-25"], { updatedAt: "2026-11-15T10:00:00+09:00" }),
  otherCase("c-j2", "SC-2611-016", "s9", "u2", "sea_import", "상하이 → 부산", "shipping", "선적 완료", ["도착", "2026-11-26"]),
  otherCase("c-k1", "SC-2611-012", "s10", "u2", "sea_import", "닝보 → 부산", "arrival", "도착 통지 수신", ["반출", "2026-11-19"], { updatedAt: "2026-11-14T10:00:00+09:00" }),
  // 이사원
  otherCase("c021", "SC-2611-021", "s11", "u3", "air_export", "인천 → LA", "docs", "화주 승인 대기", ["선적", "2026-11-18"], {
    status: "awaiting_reply", updatedAt: "2026-11-10T10:00:00+09:00",
    blocked: { kind: "approval", reason: "화주 승인 대기", since: "2026-11-10" },
    need: { title: "화주 출고 승인", note: "견적 확정 후 화주 승인 대기" }, nextAction: "화주에 승인 재요청",
  }),
  otherCase("c019", "SC-2611-019", "s11", "u3", "air_export", "인천 → LA", "shipping", "선사 답변 대기", ["도착", "2026-11-24"], {
    status: "awaiting_reply", updatedAt: "2026-11-13T10:00:00+09:00",
    blocked: { kind: "reply", reason: "선사 답변 대기", since: "2026-11-13" },
  }),
  otherCase("c-n1", "SC-2611-015", "s12", "u3", "sea_export", "부산 → 호치민", "settlement", "청구서 발송", ["청구", "2026-11-21"], { updatedAt: "2026-11-13T10:00:00+09:00" }),
  otherCase("c-f-003", "SC-2611-010", "s12", "u4", "sea_import", "닝보 → 부산", "arrival", "도착 통지 대기", ["도착", "2026-11-22"]),
  // 한사원 (11/30 퇴사 예정) — 화주 7곳 · 건 11개
  otherCase("c018", "SC-2611-018", "s13", "u6", "sea_export", "부산 → 시드니", "docs", "서류 확인 필요", ["선적", "2026-11-21"], {
    status: "needs_check", updatedAt: "2026-11-11T10:00:00+09:00",
    blocked: { kind: "check", reason: "서류 확인 필요", since: "2026-11-11" },
    need: { title: "원산지 증명서 확인", note: "서류 금액이 견적과 다름" }, nextAction: "화주에 서류 재확인",
  }),
  otherCase("c-p2", "SC-2611-022", "s13", "u6", "sea_export", "부산 → 시드니", "booking", "부킹 확정", ["서류 마감", "2026-11-24"], { status: "needs_check" }),
  otherCase("c-p3", "SC-2611-023", "s13", "u6", "sea_export", "부산 → 시드니", "booking", "부킹 요청", ["부킹", "2026-11-25"]),
  otherCase("c-q1", "SC-2611-017", "s14", "u6", "sea_export", "광양 → 휴스턴", "shipping", "선적 완료", ["도착", "2026-12-02"], { status: "needs_check", updatedAt: "2026-11-13T10:00:00+09:00" }),
  otherCase("c-q2", "SC-2611-024", "s14", "u6", "sea_export", "광양 → 휴스턴", "docs", "서류 대기", ["서류 마감", "2026-11-27"]),
  otherCase("c-r1", "SC-2611-008", "s15", "u6", "sea_import", "하이퐁 → 부산", "arrival", "도착 통지", ["반출", "2026-11-20"], { updatedAt: "2026-11-09T10:00:00+09:00" }),
  otherCase("c-s1", "SC-2611-020", "s16", "u6", "sea_export", "부산 → 두바이", "booking", "부킹 요청", ["부킹", "2026-11-20"], { status: "needs_check", updatedAt: "2026-11-14T10:00:00+09:00" }),
  otherCase("c-s2", "SC-2611-025", "s16", "u6", "sea_export", "부산 → 두바이", "docs", "서류 대기", ["서류 마감", "2026-11-28"]),
  otherCase("c-t1", "SC-2611-006", "s17", "u6", "sea_import", "칭다오 → 평택", "settlement", "청구 완료", ["정산", "2026-11-22"], { updatedAt: "2026-11-08T10:00:00+09:00" }),
  otherCase("c-u1", "SC-2611-005", "s18", "u6", "air_import", "호치민 → 인천", "booking", "견적 회신", ["부킹", "2026-11-23"], { updatedAt: "2026-11-12T10:00:00+09:00" }),
  otherCase("c-v1", null, "s19", "u6", "sea_import", "통관", "arrival", "통관 완료", ["정산", "2026-11-26"], { updatedAt: "2026-11-10T10:00:00+09:00" }),
];

/** 완료된 건: A전자 12건 + 검토함·수정 이력에 등장하는 건 */
function doneCase(id: string, code: string, shipperId: string, route: string, closedAt: string, tradeType: Case["tradeType"] = "sea_export"): Case {
  return {
    ...caseBase, id, code, kind: "shipment", shipperId, tradeType, route,
    stage: "settlement", status: "done", stateSummary: "정산 완료", stateNote: `${closedAt.slice(5, 7)}/${closedAt.slice(8, 10)} 입금 확인`,
    nextDeadline: null, nextAction: null,
    createdAt: closedAt, updatedAt: closedAt, closedAt,
  };
}

const aDone = Array.from({ length: 12 }, (_, i) => {
  const month = i < 6 ? "09" : "10";
  const no = String(3 + i * 2).padStart(3, "0");
  const day = String(5 + (i % 6) * 4).padStart(2, "0");
  return doneCase(`c-a-done-${i + 1}`, `SC-26${month}-${no}`, "s1", "부산 → 롱비치", `2026-${month === "09" ? "10" : "11"}-${day}T17:00:00+09:00`);
});

export const cases: Case[] = [
  ...activeCases,
  ...otherCases,
  ...aDone,
  doneCase("c-d-022", "SC-2610-022", "s4", "인천 → 함부르크", "2026-11-06T17:00:00+09:00"),
  doneCase("c-f-002", "SC-2611-002", "s6", "닝보 → 부산", "2026-11-12T17:00:00+09:00", "sea_import"),
  doneCase("c-g-018", "SC-2610-018", "s7", "부산 → 자카르타", "2026-11-04T17:00:00+09:00"),
  doneCase("c-h-025", "SC-2610-025", "s8", "칭다오 → 인천", "2026-11-03T17:00:00+09:00", "sea_import"),
];

/* ───────────── 처리해야 할 일 (W-01) ───────────── */

export const caseTasks: CaseTask[] = [
  { id: "t1", caseId: "c-dom", ownerId: "u1", title: "상차 기사 배정 확인", dueDate: "2026-11-17", done: false },
  { id: "t2", caseId: "c014", ownerId: "u1", title: "패킹리스트 받기", dueDate: "2026-11-18", done: false },
  { id: "t3", caseId: "c013", ownerId: "u1", title: "검역 서류 확인", dueDate: "2026-11-19", done: false },
  { id: "t4", caseId: "c031", ownerId: "u1", title: "청구서 발송", dueDate: "2026-11-20", done: false },
];

/* ───────────── 메일 ↔ 건 연결 ───────────── */

const links: [string, string, string, number][] = [
  ["l01", "m01", "c014", 0.97],
  ["l02", "m02", "c014", 0.95],
  ["l03", "m03", "c014", 0.96],
  ["l05", "m05", "c014", 0.99],
  ["l06", "m06", "c014", 0.82],
  ["l07", "m07", "c009", 0.96],
  ["l08", "m08", "c031", 0.98],
  ["l09", "m09", "c-cus", 0.9],
  ["l10", "m10", "c007", 0.98],
  ["l11", "m11", "c011", 0.99],
  ["l12", "m12", "c013", 0.97],
  ["l13", "m13", "c-dom", 0.9],
];

export const mailCaseLinks: MailCaseLink[] = links.map(([id, mailId, caseId, confidence]) => ({
  id,
  mailId,
  caseId,
  confidence,
  status: "auto",
  createdAt: mails.find((m) => m.id === mailId)!.receivedAt,
}));

/* ───────────── 추출 값 (근거 문장 위치 자동 계산) ───────────── */

function ev(mailId: string, text: string): Evidence {
  const m = mails.find((x) => x.id === mailId);
  if (!m) throw new Error(`mock: mail ${mailId} not found`);
  const start = m.bodyText.indexOf(text);
  if (start < 0) throw new Error(`mock: evidence "${text}" not found in ${mailId}`);
  return { mailId, text, start, end: start + text.length };
}

function item(
  id: string,
  caseId: string,
  field: ExtractedItem["field"],
  title: string,
  mailId: string,
  evidenceText: string,
  opts: Partial<Pick<ExtractedItem, "value" | "previousValue" | "status" | "sourceLabel" | "confidence">> = {},
): ExtractedItem {
  const m = mails.find((x) => x.id === mailId)!;
  return {
    id, caseId, field, title,
    value: opts.value ?? null,
    previousValue: opts.previousValue ?? null,
    status: opts.status ?? "ok",
    sourceLabel: opts.sourceLabel ?? "메일",
    evidence: ev(mailId, evidenceText),
    confidence: opts.confidence ?? 0.93,
    extractedAt: m.receivedAt,
  };
}

export const extractedItems: ExtractedItem[] = [
  // SC-2611-014 (W-07 목록 순서)
  item("x01", "c014", "etd", "선적일 11/20 확정", "m03", "지난번 통화에서 말씀드린 대로 11/20 선적으로 진행 부탁드립니다.", { value: "2026-11-20", previousValue: "2026-11-22", confidence: 0.95 }),
  item("x02", "c014", "etd", "선적일 변경 요청", "m01", "선적일을 11/22에서 11/20으로 당겨 주실 수 있을까요?", { value: "2026-11-20", previousValue: "2026-11-22" }),
  item("x03", "c014", "etd", "선사 스케줄 변경 회신", "m02", "11/20 출항 HANBADA PRIDE 052E로 변경 가능합니다.", { value: "HANBADA PRIDE 052E" }),
  item("x04", "c014", "invoice_amount", "인보이스 금액 차이", "m04", "인보이스 금액은 USD 12,400입니다.", { value: "USD 12,400", previousValue: "USD 12,040", status: "needs_check", sourceLabel: "메일 · 첨부", confidence: 0.62 }),
  item("x05", "c014", "document", "패킹리스트 수정 요청", "m05", "패킹리스트 수정본을 11/17까지 보내주실 수 있을까요?"),
  item("x06", "c014", "bl_type", "B/L 서렌더 발행", "m06", "B/L은 서렌더로 발행 부탁드립니다.", { value: "Surrender" }),
  // 나머지 건
  item("x07", "c009", "eta", "도착 예정 11/25", "m07", "ETA LONG BEACH: 2026-11-25", { value: "2026-11-25" }),
  item("x08", "c031", "billing", "청구 기한 11/20", "m08", "11/20까지 청구서 보내주시면 월말 지급 처리하겠습니다.", { value: "2026-11-20" }),
  item("x09", "c-cus", "other", "수입신고 11/18 예정", "m09", "A전자 수입 원자재 건은 11/18 수입신고 예정입니다.", { value: "2026-11-18" }),
  item("x10", "c007", "etd", "선적일 변경 문의", "m10", "11/21 선적을 11/24로 미룰 수 있을지 문의드립니다.", { value: "2026-11-24", previousValue: "2026-11-21", status: "needs_check" }),
  item("x11", "c011", "booking", "부킹 회신 기한 11/20", "m11", "11/20까지 부킹 확정 회신 부탁드립니다.", { value: "2026-11-20" }),
  item("x12", "c013", "other", "검역 서류 11/19 접수", "m12", "검역 서류는 11/19까지 접수 완료하겠습니다.", { value: "2026-11-19" }),
  item("x13", "c-dom", "other", "상차 11/17 오전 9시 확정", "m13", "11/17 오전 9시 울산 공장 상차로 확정합니다.", { value: "2026-11-17 09:00" }),
];

/* ───────────── 메일 밖 정보 ───────────── */

export const offMailInfos: OffMailInfo[] = [
  { id: "o1", caseId: "c014", field: "선사 서류 마감", value: "11/18 17시", source: "carrier_site", memo: "", confirmedAt: "2026-11-15T14:30:00+09:00", createdBy: "u1", createdAt: "2026-11-15T17:20:00+09:00" },
  { id: "o2", caseId: "c014", field: "도착지 창고", value: "변경 예정", source: "phone", memo: "박과장 통화 — 롱비치 창고 바뀔 수 있음, 확정되면 메일 준다고 함", confirmedAt: "2026-11-14T11:00:00+09:00", createdBy: "u1", createdAt: "2026-11-14T11:05:00+09:00" },
];

/* ───────────── 변경 타임라인 (W-05) ───────────── */

function event(
  id: string, caseId: string, at: string, kind: CaseEvent["kind"], title: string, actorLabel: string,
  refs: Partial<Pick<CaseEvent, "mailId" | "extractedItemId" | "offMailInfoId" | "reviewItemId">> = {},
): CaseEvent {
  return {
    id, caseId, at, kind, title, actorLabel,
    mailId: refs.mailId ?? null, extractedItemId: refs.extractedItemId ?? null,
    offMailInfoId: refs.offMailInfoId ?? null, reviewItemId: refs.reviewItemId ?? null,
  };
}

export const caseEvents: CaseEvent[] = [
  // SC-2611-014
  event("e01", "c014", "2026-11-12T09:40:00+09:00", "request", "화주가 선적일을 11/20으로 변경 요청", "A전자 박과장", { mailId: "m01", extractedItemId: "x02" }),
  event("e02", "c014", "2026-11-13T15:10:00+09:00", "reply", "선사 스케줄 변경 가능 회신", "선사", { mailId: "m02", extractedItemId: "x03" }),
  event("e03", "c014", "2026-11-14T10:30:00+09:00", "confirm", "11/20 선적으로 확정", "김대리", { mailId: "m03", extractedItemId: "x01" }),
  event("e04", "c014", "2026-11-15T16:41:00+09:00", "issue", "인보이스 금액이 메일과 첨부에서 다름", "자동 발견", { mailId: "m04", extractedItemId: "x04", reviewItemId: "r1" }),
  event("e05", "c014", "2026-11-15T17:05:00+09:00", "request", "패킹리스트 수정본 요청", "김대리", { mailId: "m05", extractedItemId: "x05" }),
  event("e06", "c014", "2026-11-15T17:20:00+09:00", "off_mail", "선사 서류 마감 11/18 17시", "선사 홈페이지 · 직접 입력", { offMailInfoId: "o1" }),
  // 나머지 건
  event("e10", "c009", "2026-11-16T08:10:00+09:00", "confirm", "부산 출항 완료 · 11/25 도착 예정", "선사", { mailId: "m07", extractedItemId: "x07" }),
  event("e20", "c031", "2026-11-13T14:00:00+09:00", "request", "11/20까지 청구서 요청", "A전자 재무팀", { mailId: "m08", extractedItemId: "x08" }),
  event("e30", "c-cus", "2026-11-14T13:30:00+09:00", "request", "통관 서류 11/17까지 전달 요청", "한결관세사", { mailId: "m09", extractedItemId: "x09" }),
  event("e40", "c007", "2026-11-16T09:05:00+09:00", "issue", "화주가 선적일 11/24로 변경 문의", "E코스메틱 윤매니저", { mailId: "m10", extractedItemId: "x10" }),
  event("e50", "c011", "2026-11-16T09:30:00+09:00", "request", "선사에 부킹 요청", "김대리", { mailId: "m11", extractedItemId: "x11" }),
  event("e60", "c013", "2026-11-16T10:15:00+09:00", "reply", "검역 서류 11/19까지 접수 회신", "B푸드 한대리", { mailId: "m12", extractedItemId: "x12" }),
  event("e70", "c-dom", "2026-11-16T08:45:00+09:00", "confirm", "상차 11/17 오전 9시 확정", "C케미칼 오주임", { mailId: "m13", extractedItemId: "x13" }),
];

/* ───────────── 검토함 (W-10 / W-13) ───────────── */

export const reviewItems: ReviewItem[] = [
  {
    id: "r1", companyId: CO, type: "link_check", mailId: "m04", status: "open", createdAt: "2026-11-15T16:41:00+09:00",
    summary: "A전자 · 어느 건인지 애매함",
    reason: "제목은 SC-2611-013, 본문은 SC-2611-014를 가리켜요",
    candidates: [
      { shipperId: "s1", caseId: "c014", confidence: 0.71 },
      { shipperId: "s2", caseId: "c013", confidence: 0.24 },
    ],
    extractedItemIds: ["x04"],
    suggestedShipperName: null,
  },
  {
    id: "r2", companyId: CO, type: "link_check", mailId: "m14", status: "open", createdAt: "2026-11-15T09:06:00+09:00",
    summary: "D모터스 · 건 2개 중 하나",
    reason: "D모터스 건이 2개라 어느 건의 스케줄인지 애매해요",
    candidates: [
      { shipperId: "s4", caseId: "c011", confidence: 0.58 },
      { shipperId: "s4", caseId: "c-d-022", confidence: 0.33 },
    ],
    extractedItemIds: [],
    suggestedShipperName: null,
  },
  {
    id: "r3", companyId: CO, type: "link_check", mailId: "m15", status: "open", createdAt: "2026-11-15T07:31:00+09:00",
    summary: "화주가 불확실함",
    reason: "화주 이름 없이 처음 보는 B/L 번호만 있어요",
    candidates: [
      { shipperId: "s2", caseId: "c013", confidence: 0.45 },
      { shipperId: "s6", caseId: null, confidence: 0.31 },
    ],
    extractedItemIds: [],
    suggestedShipperName: null,
  },
  {
    id: "r4", companyId: CO, type: "unclassified", mailId: "m16", status: "open", createdAt: "2026-11-15T11:06:00+09:00",
    summary: "새 화주로 보임",
    reason: "기존 화주·건과 맞는 것이 없어요 · 새 화주로 보입니다",
    candidates: [],
    extractedItemIds: [],
    suggestedShipperName: "K트레이딩",
  },
];

/* ───────────── 수정 이력 (W-14) ───────────── */

export const correctionLogs: CorrectionLog[] = [
  { id: "cl1", companyId: CO, kind: "link_case", label: "연결 변경", before: "SC-2611-013", after: "SC-2611-014", targetLabel: "A전자 · SC-2611-014", mailId: "m03", correctedBy: "u1", correctedAt: "2026-11-15T14:02:00+09:00" },
  { id: "cl2", companyId: CO, kind: "new_case", label: "미분류 메일을 새 건으로 만듦", before: null, after: null, targetLabel: "C케미칼 · 번호 없음", mailId: "m13", correctedBy: "u1", correctedAt: "2026-11-15T10:40:00+09:00" },
  { id: "cl3", companyId: CO, kind: "value", label: "값 수정: 선적일", before: "11/19", after: "11/20", targetLabel: "A전자 · SC-2611-014", mailId: "m03", correctedBy: "u2", correctedAt: "2026-11-14T17:21:00+09:00" },
  { id: "cl4", companyId: CO, kind: "exclude", label: "업무와 무관으로 제외", before: null, after: null, targetLabel: null, mailId: null, correctedBy: "u1", correctedAt: "2026-11-13T09:05:00+09:00" },
  { id: "cl5", companyId: CO, kind: "link_shipper", label: "화주 연결 변경", before: "B푸드", after: "F리빙", targetLabel: "F리빙 · SC-2611-002", mailId: null, correctedBy: "u3", correctedAt: "2026-11-12T15:48:00+09:00" },
];
