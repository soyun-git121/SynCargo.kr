import type {
  Case,
  CaseEvent,
  Company,
  CorrectionLog,
  Evidence,
  ExtractedItem,
  MailCaseLink,
  MailboxConnection,
  OffMailInfo,
  ReviewItem,
  Shipper,
  ShipperPattern,
  User,
} from "../types";
import { attachments, mails } from "./mails";

/**
 * 가짜 데이터 저장소. 화면에서는 절대 직접 import 하지 말 것 → lib/data.ts 사용.
 * 나중에 이 파일은 Supabase 테이블로 대체된다.
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

export const users: User[] = [
  { id: "u1", companyId: CO, name: "김대리", title: "대리", role: "staff", isAdmin: false, email: "kim@demo-forwarding.kr" },
  { id: "u2", companyId: CO, name: "박주임", title: "주임", role: "staff", isAdmin: false, email: "park@demo-forwarding.kr" },
  { id: "u3", companyId: CO, name: "이사원", title: "사원", role: "staff", isAdmin: false, email: "lee@demo-forwarding.kr" },
  { id: "u4", companyId: CO, name: "최팀장", title: "팀장", role: "lead", isAdmin: false, email: "choi@demo-forwarding.kr" },
  { id: "u5", companyId: CO, name: "정대표", title: "대표", role: "ceo", isAdmin: true, email: "jung@demo-forwarding.kr" },
];

export const mailboxConnections: MailboxConnection[] = [
  {
    id: "mb1",
    userId: "u1",
    provider: "microsoft",
    email: "kim@demo-forwarding.kr",
    status: "connected",
    connectedAt: "2026-08-16T10:00:00+09:00",
    lastSyncAt: "2026-11-16T10:05:00+09:00",
    syncFrom: "2026-08-16",
    folders: ["받은편지함", "보낸편지함"],
    mailCount: 1284,
  },
];

export const shippers: Shipper[] = [
  { id: "s1", companyId: CO, name: "A전자", mode: "sea_export", origin: "부산", destination: "롱비치", ownerId: "u1", contactName: "이과장", contactEmail: "lee@a-elec.co.kr", emailDomains: ["a-elec.co.kr"], memo: "인보이스는 회계팀(박사원)이 따로 보내는 경우가 많음." },
  { id: "s2", companyId: CO, name: "B푸드", mode: "sea_export", origin: "부산", destination: "시드니", ownerId: "u1", contactName: "한대리", contactEmail: "han@bfood.co.kr", emailDomains: ["bfood.co.kr"], memo: "냉장 화물. 도착 후 현지 창고 배송까지 요청." },
  { id: "s3", companyId: CO, name: "C케미칼", mode: "domestic", origin: "울산", destination: "평택", ownerId: "u2", contactName: "오주임", contactEmail: "oh@c-chem.co.kr", emailDomains: ["c-chem.co.kr"], memo: "국내 운송 전용. B/L 번호 없음." },
  { id: "s4", companyId: CO, name: "D모터스", mode: "sea_export", origin: "부산", destination: "함부르크", ownerId: "u1", contactName: "정산팀", contactEmail: "billing@dmotors.co.kr", emailDomains: ["dmotors.co.kr"], memo: "청구서 항목 분리 기재 필수(THC, 서류비)." },
  { id: "s5", companyId: CO, name: "E코스메틱", mode: "air_export", origin: "인천", destination: "파리", ownerId: "u1", contactName: "윤매니저", contactEmail: "yoon@e-cosmetic.com", emailDomains: ["e-cosmetic.com"], memo: "" },
  { id: "s6", companyId: CO, name: "F리빙", mode: "sea_import", origin: "닝보", destination: "부산", ownerId: "u3", contactName: "Ningbo Pacific (현지 파트너)", contactEmail: "ops@nbpacific.cn", emailDomains: ["f-living.co.kr", "nbpacific.cn"], memo: "" },
  { id: "s7", companyId: CO, name: "G텍스타일", mode: "sea_export", origin: "부산", destination: "자카르타", ownerId: "u1", contactName: "서과장", contactEmail: "seo@g-textile.co.kr", emailDomains: ["g-textile.co.kr"], memo: "" },
  { id: "s8", companyId: CO, name: "H머티리얼", mode: "sea_import", origin: "칭다오", destination: "인천", ownerId: "u2", contactName: "강대리", contactEmail: "kang@h-material.co.kr", emailDomains: ["h-material.co.kr"], memo: "" },
];

export const shipperPatterns: ShipperPattern[] = [
  { id: "p1", shipperId: "s1", text: "인보이스 수정본은 회계팀(accounting@a-elec.co.kr)에서 건 번호 없이 따로 옵니다.", evidenceMailIds: ["m05"], status: "suggested" },
  { id: "p2", shipperId: "s1", text: "미주 물량은 보통 40HC 2대 단위로 부킹합니다.", evidenceMailIds: ["m01"], status: "confirmed" },
  { id: "p3", shipperId: "s5", text: "항공 화장품 건은 항상 MSDS가 첨부됩니다.", evidenceMailIds: ["m09"], status: "suggested" },
  { id: "p4", shipperId: "s4", text: "정산 청구서는 THC·서류비 항목을 분리해서 요청합니다.", evidenceMailIds: ["m08"], status: "suggested" },
];

const base = { companyId: CO, memo: "" };

export const cases: Case[] = [
  {
    ...base, id: "c014", code: "SC-2611-014", shipperId: "s1", ownerId: "u1",
    title: "A전자 미주 물량 (40HC x 2)", mode: "sea_export", origin: "부산", destination: "롱비치",
    stage: "docs", stageNote: "부킹 확정 · 서류 대기", status: "needs_check",
    blNo: null, bookingNo: "HDBK7781203", vessel: "HANBADA PRIDE 052E",
    etd: "2026-11-20", eta: "2026-12-04",
    nextDeadline: { label: "서류 마감", date: "2026-11-18" },
    createdAt: "2026-11-10T09:25:00+09:00", updatedAt: "2026-11-14T16:41:00+09:00",
  },
  {
    ...base, id: "c009", code: "SC-2611-009", shipperId: "s2", ownerId: "u1",
    title: "B푸드 냉장 식품 시드니", mode: "sea_export", origin: "부산", destination: "시드니",
    stage: "shipping", stageNote: "선적 완료 · 도착 대기", status: "in_progress",
    blNo: "BSTK2611009", bookingNo: "HDBK7779012", vessel: "HANBADA STAR 118S",
    etd: "2026-11-12", eta: "2026-11-25",
    nextDeadline: { label: "도착", date: "2026-11-25" },
    createdAt: "2026-11-02T11:00:00+09:00", updatedAt: "2026-11-14T11:01:00+09:00",
  },
  {
    ...base, id: "c031", code: "SC-2610-031", shipperId: "s4", ownerId: "u1",
    title: "D모터스 함부르크 부품", mode: "sea_export", origin: "부산", destination: "함부르크",
    stage: "settlement", stageNote: "정산 중 · 청구서 작성", status: "in_progress",
    blNo: "HDHB2610031", bookingNo: "HDBK7765530", vessel: "HANBADA GLORY 031W",
    etd: "2026-10-18", eta: "2026-11-24",
    nextDeadline: { label: "청구", date: "2026-11-20" },
    createdAt: "2026-10-08T10:00:00+09:00", updatedAt: "2026-11-13T15:21:00+09:00",
  },
  {
    ...base, id: "c007", code: "SC-2611-007", shipperId: "s5", ownerId: "u1",
    title: "E코스메틱 파리 박람회 샘플", mode: "air_export", origin: "인천", destination: "파리",
    stage: "booking", stageNote: "부킹 요청 · 항공사 회신 대기", status: "awaiting_reply",
    blNo: null, bookingNo: null, vessel: null,
    etd: null, eta: null,
    nextDeadline: { label: "반입", date: "2026-11-19" },
    createdAt: "2026-11-15T10:20:00+09:00", updatedAt: "2026-11-15T10:20:00+09:00",
  },
  {
    ...base, id: "c011", code: "SC-2611-011", shipperId: "s6", ownerId: "u3",
    title: "F리빙 가구 수입 (닝보)", mode: "sea_import", origin: "닝보", destination: "부산",
    stage: "arrival", stageNote: "도착 예정 · 통관 서류 확인", status: "in_progress",
    blNo: "NBPS2611011", bookingNo: null, vessel: "BLUE OCEAN 7 2245N",
    etd: "2026-11-13", eta: "2026-11-17",
    nextDeadline: { label: "도착", date: "2026-11-17" },
    createdAt: "2026-11-08T09:00:00+09:00", updatedAt: "2026-11-15T13:01:00+09:00",
  },
  {
    ...base, id: "c013", code: "SC-2611-013", shipperId: "s7", ownerId: "u1",
    title: "G텍스타일 원단 자카르타", mode: "sea_export", origin: "부산", destination: "자카르타",
    stage: "booking", stageNote: "부킹 요청 · 선사 회신 대기", status: "awaiting_reply",
    blNo: null, bookingNo: null, vessel: null,
    etd: null, eta: null,
    nextDeadline: { label: "스케줄 회신", date: "2026-11-17" },
    createdAt: "2026-11-14T09:45:00+09:00", updatedAt: "2026-11-14T09:45:00+09:00",
  },
  {
    ...base, id: "c005", code: "SC-2611-005", shipperId: "s3", ownerId: "u2",
    title: "C케미칼 울산→평택 내륙 운송", mode: "domestic", origin: "울산", destination: "평택",
    stage: "shipping", stageNote: "운송 중", status: "in_progress",
    blNo: null, bookingNo: null, vessel: null,
    etd: "2026-11-17", eta: "2026-11-18",
    nextDeadline: { label: "하차", date: "2026-11-18" },
    createdAt: "2026-11-05T14:00:00+09:00", updatedAt: "2026-11-15T08:31:00+09:00",
  },
  {
    ...base, id: "c012", code: "SC-2611-012", shipperId: "s8", ownerId: "u2",
    title: "H머티리얼 원자재 수입 (칭다오)", mode: "sea_import", origin: "칭다오", destination: "인천",
    stage: "docs", stageNote: "선적서류 수취 · 통관 준비", status: "in_progress",
    blNo: "QDIC2611012", bookingNo: null, vessel: "BLUE OCEAN 3 118E",
    etd: "2026-11-15", eta: "2026-11-21",
    nextDeadline: { label: "도착", date: "2026-11-21" },
    createdAt: "2026-11-07T10:00:00+09:00", updatedAt: "2026-11-14T17:21:00+09:00",
  },
  {
    ...base, id: "c027", code: "SC-2610-027", shipperId: "s1", ownerId: "u1",
    title: "A전자 10월 미주 물량", mode: "sea_export", origin: "부산", destination: "롱비치",
    stage: "settlement", stageNote: "정산 완료", status: "done",
    blNo: "HDLB2610027", bookingNo: "HDBK7760211", vessel: "HANBADA PRIDE 048E",
    etd: "2026-10-16", eta: "2026-10-30",
    nextDeadline: null,
    createdAt: "2026-10-05T09:00:00+09:00", updatedAt: "2026-11-06T17:00:00+09:00",
  },
];

/* ───────────── 메일 ↔ 건 연결 ───────────── */

function link(id: string, mailId: string, caseId: string, confidence: number, reason: string, createdAt: string): MailCaseLink {
  return { id, mailId, caseId, confidence, status: "auto", reason, createdAt };
}

export const mailCaseLinks: MailCaseLink[] = [
  link("l01", "m01", "c014", 0.98, "제목에 건 번호 SC-2611-014", "2026-11-10T09:21:00+09:00"),
  link("l02", "m02", "c014", 0.95, "부킹 번호 HDBK7781203 일치", "2026-11-11T14:06:00+09:00"),
  link("l03", "m03", "c014", 0.98, "제목에 건 번호 SC-2611-014", "2026-11-13T10:31:00+09:00"),
  link("l04", "m04", "c014", 0.98, "제목에 건 번호 SC-2611-014", "2026-11-14T16:41:00+09:00"),
  link("l06", "m06", "c009", 0.96, "B/L 번호 BSTK2611009 일치", "2026-11-12T18:11:00+09:00"),
  link("l07", "m07", "c009", 0.98, "제목에 건 번호 SC-2611-009", "2026-11-14T11:01:00+09:00"),
  link("l08", "m08", "c031", 0.98, "본문에 건 번호 SC-2610-031", "2026-11-13T15:21:00+09:00"),
  link("l09", "m09", "c007", 0.98, "제목에 건 번호 SC-2611-007", "2026-11-15T10:16:00+09:00"),
  link("l11", "m11", "c013", 0.98, "제목에 건 번호 SC-2611-013", "2026-11-14T09:41:00+09:00"),
  link("l12", "m12", "c011", 0.95, "HBL 번호 NBPS2611011 일치", "2026-11-15T13:01:00+09:00"),
  link("l14", "m14", "c012", 0.98, "제목에 건 번호 SC-2611-012", "2026-11-14T17:21:00+09:00"),
  link("l16", "m16", "c005", 0.9, "화주 도메인 c-chem.co.kr + 구간 울산→평택", "2026-11-15T08:31:00+09:00"),
];

/* ───────────── 추출 값 (근거 문장 위치 자동 계산) ───────────── */

function ev(mailId: string, text: string): Evidence {
  const m = mails.find((x) => x.id === mailId);
  if (!m) throw new Error(`mock: mail ${mailId} not found`);
  const start = m.bodyText.indexOf(text);
  if (start < 0) throw new Error(`mock: evidence "${text}" not found in ${mailId}`);
  return { mailId, text, start, end: start + text.length };
}

export const extractedItems: ExtractedItem[] = [
  // SC-2611-014
  { id: "x01", caseId: "c014", field: "etd", label: "선적일(ETD)", value: "2026-11-20", previousValue: "2026-11-22", status: "changed", confidence: 0.94, extractedAt: "2026-11-13T10:31:00+09:00",
    evidence: ev("m03", "지난번 통화에서 말씀드린 대로 11/20 선적으로 진행 부탁드립니다.") },
  { id: "x02", caseId: "c014", field: "doc_cutoff", label: "서류 마감", value: "2026-11-18 17:00", previousValue: null, status: "confirmed", confidence: 0.97, extractedAt: "2026-11-11T14:06:00+09:00",
    evidence: ev("m02", "Doc cut-off: 11/18 17:00") },
  { id: "x03", caseId: "c014", field: "cargo_cutoff", label: "화물 반입 마감", value: "2026-11-19 12:00", previousValue: null, status: "confirmed", confidence: 0.96, extractedAt: "2026-11-11T14:06:00+09:00",
    evidence: ev("m02", "Cargo cut-off: 11/19 12:00") },
  { id: "x04", caseId: "c014", field: "invoice_amount", label: "인보이스 금액", value: "USD 48,600", previousValue: "USD 46,800", status: "conflict", confidence: 0.88, extractedAt: "2026-11-14T16:41:00+09:00",
    evidence: ev("m04", "인보이스 금액은 USD 48,600입니다.") },
  { id: "x05", caseId: "c014", field: "booking_no", label: "부킹 번호", value: "HDBK7781203", previousValue: null, status: "confirmed", confidence: 0.99, extractedAt: "2026-11-11T14:06:00+09:00",
    evidence: ev("m02", "Booking No: HDBK7781203") },
  { id: "x06", caseId: "c014", field: "eta", label: "도착일(ETA)", value: "2026-12-04", previousValue: null, status: "confirmed", confidence: 0.97, extractedAt: "2026-11-11T14:06:00+09:00",
    evidence: ev("m02", "ETA LONG BEACH: 2026-12-04") },
  // SC-2611-009
  { id: "x07", caseId: "c009", field: "bl_no", label: "B/L 번호", value: "BSTK2611009", previousValue: null, status: "confirmed", confidence: 0.99, extractedAt: "2026-11-12T18:11:00+09:00",
    evidence: ev("m06", "B/L No: BSTK2611009") },
  { id: "x08", caseId: "c009", field: "eta", label: "도착일(ETA)", value: "2026-11-25", previousValue: null, status: "confirmed", confidence: 0.97, extractedAt: "2026-11-12T18:11:00+09:00",
    evidence: ev("m06", "ETA SYDNEY: 2026-11-25") },
  // SC-2610-031
  { id: "x09", caseId: "c031", field: "billing_date", label: "청구 기한", value: "2026-11-20", previousValue: null, status: "confirmed", confidence: 0.93, extractedAt: "2026-11-13T15:21:00+09:00",
    evidence: ev("m08", "11/20까지 청구서 보내주시면 월말 지급 처리하겠습니다.") },
  // SC-2611-007
  { id: "x10", caseId: "c007", field: "cargo_cutoff", label: "화물 반입", value: "2026-11-19", previousValue: null, status: "confirmed", confidence: 0.9, extractedAt: "2026-11-15T10:16:00+09:00",
    evidence: ev("m09", "화물은 11/19 반입 가능합니다.") },
  // SC-2611-013
  { id: "x11", caseId: "c013", field: "other", label: "스케줄 회신 기한", value: "2026-11-17", previousValue: null, status: "confirmed", confidence: 0.91, extractedAt: "2026-11-14T09:41:00+09:00",
    evidence: ev("m11", "선사 스케줄 회신은 11/17까지 부탁드립니다.") },
  // SC-2611-011
  { id: "x12", caseId: "c011", field: "eta", label: "도착일(ETA)", value: "2026-11-17", previousValue: null, status: "confirmed", confidence: 0.97, extractedAt: "2026-11-15T13:01:00+09:00",
    evidence: ev("m12", "ETA BUSAN: 2026-11-17") },
  // SC-2611-012
  { id: "x13", caseId: "c012", field: "eta", label: "도착일(ETA)", value: "2026-11-21", previousValue: null, status: "confirmed", confidence: 0.95, extractedAt: "2026-11-14T17:21:00+09:00",
    evidence: ev("m14", "인천 도착 예정일은 11/21입니다.") },
  // SC-2611-005
  { id: "x14", caseId: "c005", field: "other", label: "하차 일정", value: "2026-11-18 오전", previousValue: null, status: "confirmed", confidence: 0.92, extractedAt: "2026-11-15T08:31:00+09:00",
    evidence: ev("m16", "11/18 오전 하차 예정입니다.") },
];

/* ───────────── 메일 밖 정보 ───────────── */

export const offMailInfos: OffMailInfo[] = [
  { id: "o1", caseId: "c014", content: "컨테이너 2대 중 1대는 11/19 오전에 먼저 반입 예정", source: "phone", sourceDetail: "A전자 이과장 통화", confirmedAt: "2026-11-14T15:00:00+09:00", createdBy: "u1", createdAt: "2026-11-14T15:05:00+09:00" },
];

/* ───────────── 타임라인 ───────────── */

function event(id: string, caseId: string, at: string, type: CaseEvent["type"], title: string, description: string, opts: Partial<Pick<CaseEvent, "actorId" | "mailId" | "extractedItemId">> = {}): CaseEvent {
  return { id, caseId, at, type, title, description, actorId: opts.actorId ?? null, mailId: opts.mailId ?? null, extractedItemId: opts.extractedItemId ?? null };
}

export const caseEvents: CaseEvent[] = [
  // SC-2611-014
  event("e01", "c014", "2026-11-10T09:21:00+09:00", "mail", "부킹 요청 메일 수신", "A전자 이과장 · 40HC x 2, 11/22 선적 희망", { mailId: "m01" }),
  event("e02", "c014", "2026-11-11T14:06:00+09:00", "stage", "부킹 확정", "한바다해운 HDBK7781203 · ETD 11/20", { mailId: "m02", extractedItemId: "x05" }),
  event("e03", "c014", "2026-11-11T14:06:00+09:00", "extracted", "서류 마감 11/18 17:00", "부킹 확정 메일에서 추출", { mailId: "m02", extractedItemId: "x02" }),
  event("e04", "c014", "2026-11-13T10:31:00+09:00", "changed", "선적일 11/22 → 11/20 확정", "이과장 회신: \"11/20 선적으로 진행 부탁드립니다\"", { mailId: "m03", extractedItemId: "x01" }),
  event("e05", "c014", "2026-11-14T15:05:00+09:00", "off_mail", "메일 밖 정보 추가", "이과장 통화 · 1대 11/19 오전 선반입", { actorId: "u1" }),
  event("e06", "c014", "2026-11-14T16:41:00+09:00", "changed", "인보이스 금액 불일치", "부킹 요청 USD 46,800 ↔ 인보이스 USD 48,600", { mailId: "m04", extractedItemId: "x04" }),
  // SC-2611-009
  event("e10", "c009", "2026-11-12T18:11:00+09:00", "stage", "선적 완료", "HANBADA STAR 118S 출항 · ETA 11/25", { mailId: "m06", extractedItemId: "x08" }),
  event("e11", "c009", "2026-11-14T11:01:00+09:00", "mail", "도착 후 배송 문의", "B푸드 한대리 · 시드니 냉장 창고", { mailId: "m07" }),
  // SC-2610-031
  event("e20", "c031", "2026-11-13T15:21:00+09:00", "extracted", "청구 기한 11/20", "D모터스 정산팀 요청", { mailId: "m08", extractedItemId: "x09" }),
  // SC-2611-007
  event("e30", "c007", "2026-11-15T10:16:00+09:00", "mail", "항공 부킹 요청", "E코스메틱 · ICN→CDG 320kg, 11/19 반입", { mailId: "m09", extractedItemId: "x10" }),
  // SC-2611-013
  event("e40", "c013", "2026-11-14T09:41:00+09:00", "mail", "부킹 요청", "G텍스타일 · 20GP x 3, 회신 11/17까지", { mailId: "m11", extractedItemId: "x11" }),
  // SC-2611-011
  event("e50", "c011", "2026-11-15T13:01:00+09:00", "mail", "Pre-alert 수신", "닝보 파트너 · ETA 부산 11/17", { mailId: "m12", extractedItemId: "x12" }),
  // SC-2611-012
  event("e60", "c012", "2026-11-14T17:21:00+09:00", "mail", "선적서류 수취", "H머티리얼 · 인천 도착 11/21", { mailId: "m14", extractedItemId: "x13" }),
  // SC-2611-005
  event("e70", "c005", "2026-11-15T08:31:00+09:00", "extracted", "하차 일정 11/18 오전", "C케미칼 오주임", { mailId: "m16", extractedItemId: "x14" }),
  // SC-2610-027
  event("e80", "c027", "2026-11-06T17:00:00+09:00", "stage", "정산 완료", "운임 입금 확인", { actorId: "u1" }),
];

/* ───────────── 검토함 ───────────── */

export const reviewItems: ReviewItem[] = [
  {
    id: "r1", companyId: CO, type: "link_check", mailId: "m05", status: "open", createdAt: "2026-11-16T08:53:00+09:00",
    reason: "제목에 건 번호가 없고, A전자 진행 건이 2개입니다.",
    suggestedShipperName: null,
    candidates: [
      { caseId: "c014", confidence: 0.68, reason: "같은 금액(USD 46,800)이 부킹 요청 메일에 있음" },
      { caseId: "c027", confidence: 0.41, reason: "같은 화주의 직전 정산 건" },
    ],
  },
  {
    id: "r2", companyId: CO, type: "link_check", mailId: "m10", status: "open", createdAt: "2026-11-16T09:06:00+09:00",
    reason: "전달 메일 안에 여러 항로 스케줄이 섞여 있습니다.",
    suggestedShipperName: null,
    candidates: [
      { caseId: "c013", confidence: 0.62, reason: "부산→자카르타 스케줄, 회신 대기 중인 건" },
      { caseId: "c014", confidence: 0.35, reason: "부산→롱비치 스케줄 포함" },
    ],
  },
  {
    id: "r3", companyId: CO, type: "link_check", mailId: "m13", status: "open", createdAt: "2026-11-16T07:31:00+09:00",
    reason: "B/L 번호가 등록된 값과 한 글자 다릅니다 (NBPS2611O11 ↔ NBPS2611011).",
    suggestedShipperName: null,
    candidates: [
      { caseId: "c011", confidence: 0.81, reason: "선명·도착일(11/17)·도착항 일치" },
      { caseId: "c012", confidence: 0.22, reason: "같은 선사(Blue Ocean Lines) 수입 건" },
    ],
  },
  {
    id: "r4", companyId: CO, type: "unclassified", mailId: "m15", status: "open", createdAt: "2026-11-16T10:03:00+09:00",
    reason: "등록된 화주 도메인과 일치하지 않는 새 발신자입니다.",
    suggestedShipperName: "K트레이딩",
    candidates: [],
  },
];

/* ───────────── 수정 이력 ───────────── */

export const correctionLogs: CorrectionLog[] = [
  { id: "cl1", companyId: CO, targetType: "extracted_item", targetId: "x06", label: "SC-2611-014 · 도착일(ETA)", before: "2026-12-02", after: "2026-12-04", correctedBy: "u1", correctedAt: "2026-11-12T09:40:00+09:00" },
  { id: "cl2", companyId: CO, targetType: "mail_case_link", targetId: "l03", label: "RE: SC-2611-014 선적 일정 확인", before: "SC-2610-027", after: "SC-2611-014", correctedBy: "u1", correctedAt: "2026-11-13T10:45:00+09:00" },
  { id: "cl3", companyId: CO, targetType: "shipper_pattern", targetId: "p2", label: "A전자 · 반복 조건", before: "제안", after: "확정 (맞아요)", correctedBy: "u1", correctedAt: "2026-11-13T11:02:00+09:00" },
  { id: "cl4", companyId: CO, targetType: "extracted_item", targetId: "x13", label: "SC-2611-012 · 도착일(ETA)", before: "2026-11-20", after: "2026-11-21", correctedBy: "u2", correctedAt: "2026-11-14T17:50:00+09:00" },
];
