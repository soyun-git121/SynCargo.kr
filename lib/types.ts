/**
 * SynCargo 도메인 타입.
 * 나중에 Supabase(Postgres) 테이블과 1:1로 대응하도록 설계한다.
 *  - 각 인터페이스 = 테이블 1개, 필드명은 camelCase(DB에서는 snake_case로 매핑)
 *  - 날짜는 ISO 문자열(DB: timestamptz / date)
 *  - 외래키는 `xxxId` 형태
 */

export type ID = string;
/** ISO 날짜 "2026-11-18" */
export type DateString = string;
/** ISO 일시 "2026-11-16T09:12:00+09:00" */
export type DateTimeString = string;

/* ───────────── 회사 · 사용자 ───────────── */

/** companies */
export interface Company {
  id: ID;
  name: string;
  domain: string;
  createdAt: DateTimeString;
}

export type Role = "staff" | "lead" | "ceo";

/** users */
export interface User {
  id: ID;
  companyId: ID;
  name: string; // 김대리
  title: string; // 대리, 주임, 사원, 팀장, 대표
  role: Role;
  isAdmin: boolean; // 관리자 모드 접근 가능 여부
  email: string;
}

/** mailbox_connections: Microsoft Graph(Mail.Read 위임 권한) 연결 상태 */
export interface MailboxConnection {
  id: ID;
  userId: ID;
  provider: "microsoft";
  email: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  connectedAt: DateTimeString | null;
  lastSyncAt: DateTimeString | null;
  /** 이 날짜 이후 메일만 읽음 */
  syncFrom: DateString;
  folders: string[];
  mailCount: number;
}

/* ───────────── 화주 ───────────── */

export type TransportMode =
  | "sea_export"
  | "sea_import"
  | "air_export"
  | "air_import"
  | "domestic";

/** shippers */
export interface Shipper {
  id: ID;
  companyId: ID;
  name: string;
  mode: TransportMode;
  origin: string | null;
  destination: string | null;
  ownerId: ID; // 담당 실무자
  contactName: string;
  contactEmail: string;
  /** 메일 → 화주 매칭에 쓰는 도메인 */
  emailDomains: string[];
  memo: string;
}

/** shipper_patterns: AI가 찾은 반복 조건. 사용자가 "맞아요"로 확정 */
export interface ShipperPattern {
  id: ID;
  shipperId: ID;
  text: string;
  /** 근거가 된 메일들 */
  evidenceMailIds: ID[];
  status: "suggested" | "confirmed" | "rejected";
}

/* ───────────── 업무 건 ───────────── */

/** 부킹 → 서류 → 선적 → 도착 → 정산 */
export type CaseStage = "booking" | "docs" | "shipping" | "arrival" | "settlement";

/** 화면 상태 배지 (빨강/노랑/회색/초록) */
export type CaseStatus = "needs_check" | "awaiting_reply" | "in_progress" | "done";

/** cases */
export interface Case {
  id: ID;
  companyId: ID;
  /** 사내 업무 번호 SC-YYMM-NNN */
  code: string;
  shipperId: ID;
  ownerId: ID;
  title: string;
  mode: TransportMode;
  origin: string;
  destination: string;
  stage: CaseStage;
  /** 단계 안의 세부 상태 문구 (예: "부킹 확정 · 서류 대기") */
  stageNote: string;
  status: CaseStatus;
  /** B/L 번호 없는 건(국내 운송 등) 허용 */
  blNo: string | null;
  bookingNo: string | null;
  vessel: string | null;
  etd: DateString | null;
  eta: DateString | null;
  /** 다음 마감 (D-day 표시용) */
  nextDeadline: { label: string; date: DateString } | null;
  memo: string;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

/* ───────────── 메일 ───────────── */

export interface MailAddress {
  name: string;
  email: string;
}

/** mails: Graph 메시지 사본(읽기 전용) */
export interface Mail {
  id: ID;
  companyId: ID;
  mailboxId: ID;
  /** Graph message id / conversation id */
  graphMessageId: string;
  conversationId: string;
  subject: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  receivedAt: DateTimeString;
  bodyText: string;
  /** 분류 결과 */
  classification: "linked" | "needs_review" | "unclassified";
}

/** attachments */
export interface Attachment {
  id: ID;
  mailId: ID;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Supabase Storage 경로 (지금은 null) */
  storagePath: string | null;
}

/** mail_case_links: 메일 ↔ 업무 건 연결 + 신뢰도 */
export interface MailCaseLink {
  id: ID;
  mailId: ID;
  caseId: ID;
  /** 0~1 */
  confidence: number;
  status: "auto" | "confirmed" | "rejected";
  reason: string;
  createdAt: DateTimeString;
}

/* ───────────── 추출 값 · 타임라인 ───────────── */

export type ExtractedField =
  | "etd"
  | "eta"
  | "doc_cutoff"
  | "cargo_cutoff"
  | "invoice_amount"
  | "booking_no"
  | "bl_no"
  | "vessel"
  | "billing_date"
  | "other";

/** 원문 안의 근거 문장 위치 (bodyText 기준 문자 offset) */
export interface Evidence {
  mailId: ID;
  text: string;
  start: number;
  end: number;
}

/** extracted_items */
export interface ExtractedItem {
  id: ID;
  caseId: ID;
  field: ExtractedField;
  label: string;
  value: string;
  /** 변경 전 값 (변경 이력 표시용) */
  previousValue: string | null;
  status: "confirmed" | "changed" | "conflict";
  evidence: Evidence;
  confidence: number;
  extractedAt: DateTimeString;
}

export type CaseEventType =
  | "mail"
  | "extracted"
  | "changed"
  | "stage"
  | "off_mail"
  | "note";

/** case_events: 건 상세 타임라인 */
export interface CaseEvent {
  id: ID;
  caseId: ID;
  type: CaseEventType;
  title: string;
  description: string;
  at: DateTimeString;
  actorId: ID | null; // null = AI/시스템
  mailId: ID | null;
  extractedItemId: ID | null;
}

/** off_mail_infos: 전화·카톡·미팅 등 메일 밖에서 받은 정보 */
export interface OffMailInfo {
  id: ID;
  caseId: ID;
  content: string;
  source: "phone" | "messenger" | "meeting" | "other";
  sourceDetail: string; // 예: "A전자 이과장 통화"
  confirmedAt: DateTimeString;
  createdBy: ID;
  createdAt: DateTimeString;
}

/* ───────────── 검토함 ───────────── */

export interface ReviewCandidate {
  caseId: ID;
  confidence: number;
  reason: string;
}

/** review_items */
export interface ReviewItem {
  id: ID;
  companyId: ID;
  type: "link_check" | "unclassified";
  mailId: ID;
  candidates: ReviewCandidate[];
  /** AI가 판단을 미룬 이유 */
  reason: string;
  /** 미분류 메일: 새 화주 후보 이름 */
  suggestedShipperName: string | null;
  status: "open" | "resolved";
  createdAt: DateTimeString;
}

/** correction_logs: 사람이 AI 결과를 고친 기록 (추후 학습 데이터) */
export interface CorrectionLog {
  id: ID;
  companyId: ID;
  targetType: "mail_case_link" | "extracted_item" | "shipper_pattern";
  targetId: ID;
  label: string; // 사람이 읽는 대상 설명
  before: string;
  after: string;
  correctedBy: ID;
  correctedAt: DateTimeString;
}
