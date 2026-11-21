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
  /** 마지막 동기화에서 실패한 메일 수 */
  lastSyncFailedCount: number;
  /** 연결 순서 3단계(환경 확인 → 연결 방식 → 읽을 범위) 중 끝낸 단계 수 */
  setupStepsDone: 0 | 1 | 2 | 3;
}

/** handovers: 인계 (이번 데모는 홈 배너 표시만) */
export interface Handover {
  id: ID;
  fromUserId: ID;
  toUserId: ID;
  shipperIds: ID[];
  status: "requested" | "approved";
  approvedAt: DateTimeString | null;
}

/* ───────────── 화주 ───────────── */

export type TradeType = "sea_export" | "sea_import" | "air_export" | "air_import" | "domestic";

/** shippers */
export interface Shipper {
  id: ID;
  companyId: ID;
  name: string;
  tradeType: TradeType;
  /** 주요 구간 "부산 → 롱비치" / "통관" */
  route: string;
  ownerId: ID; // 담당 실무자
  /** 메일 → 화주 매칭에 쓰는 도메인 */
  emailDomains: string[];
  memo: string;
  memoUpdatedAt: DateTimeString | null;
  memoUpdatedBy: ID | null;
  /** 담당자가 마지막으로 화주 카드를 확인한 날 */
  lastReviewedAt: DateString | null;
  /** 화주 카드에 바뀐 정보가 마지막으로 생긴 시점 (목록 "최근 변경") */
  lastChangedAt: DateTimeString;
}

/** shipper_patterns: 반복 조건·주의사항. AI 제안 → 사람이 "맞아요"로 확정 */
export interface ShipperPattern {
  id: ID;
  shipperId: ID;
  text: string;
  status: "suggested" | "confirmed";
  /** 제안 상태일 때 이유 (예: "메일 1건에서만 보임") */
  note: string | null;
  evidenceMailId: ID | null;
  confirmedAt: DateTimeString | null;
  confirmedBy: ID | null;
}

/** shipper_changes: 화주 단위 변경 이력 (담당자·창고·결제 조건 등) */
export interface ShipperChange {
  id: ID;
  shipperId: ID;
  title: string;
  before: string | null;
  after: string | null;
  /** 근거 출처 표시 */
  sourceLabel: string;
  status: "confirmed" | "needs_check";
  mailId: ID | null;
  at: DateTimeString;
}

/* ───────────── 업무 건 ───────────── */

/** 건 유형: 선적 / 국내 운송 / 통관 (국내 운송·통관은 B/L 없음 허용) */
export type CaseKind = "shipment" | "domestic" | "customs";

/** 부킹 → 서류 → 선적 → 도착 → 정산 */
export type CaseStage = "booking" | "docs" | "shipping" | "arrival" | "settlement";

/** 화면 상태 배지 (빨강/노랑/회색/초록) */
export type CaseStatus = "needs_check" | "awaiting_reply" | "in_progress" | "done";

/** cases */
export interface Case {
  id: ID;
  companyId: ID;
  /** 사내 업무 번호 SC-YYMM-NNN. 국내 운송·통관 등은 번호 없음(null) */
  code: string | null;
  kind: CaseKind;
  shipperId: ID;
  ownerId: ID;
  tradeType: TradeType;
  route: string;
  stage: CaseStage;
  status: CaseStatus;
  /** 현재 상태 요약 "부킹 확정 · 서류 대기" */
  stateSummary: string;
  /** 상태 보조 문구 "11/14 선적일 11/20으로 확정" */
  stateNote: string;
  blNo: string | null;
  bookingNo: string | null;
  /** 다음 기한 */
  nextDeadline: { label: string; date: DateString; detail: string | null } | null;
  /** 다음 행동 (자동 정리, 사람이 고칠 수 있음) */
  nextAction: string | null;
  /** 가장 최근 메일에서 바뀐 내용 (홈 "오늘 움직인 건") */
  latestChange: { text: string; at: DateTimeString } | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  closedAt: DateTimeString | null;
}

/** case_tasks: 처리해야 할 일 */
export interface CaseTask {
  id: ID;
  caseId: ID;
  ownerId: ID;
  title: string;
  dueDate: DateString;
  done: boolean;
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
  /** Graph message id / conversation id / Outlook 웹 링크 */
  graphMessageId: string;
  conversationId: string;
  webLink: string | null;
  subject: string;
  from: MailAddress;
  to: MailAddress[];
  cc: MailAddress[];
  receivedAt: DateTimeString;
  bodyText: string;
  /** 분류 결과 */
  classification: "linked" | "needs_review" | "unclassified" | "excluded";
}

/** attachments */
export interface Attachment {
  id: ID;
  mailId: ID;
  /** 화면 표시용 문서 종류 (B/L, Invoice …) */
  docType: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** 첨부에 대한 짧은 상태 메모 (예: "금액 확인 필요") */
  note: { text: string; tone: "danger" | "muted" } | null;
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
  status: "auto" | "confirmed";
  createdAt: DateTimeString;
}

/* ───────────── 추출 값 · 타임라인 ───────────── */

/** 원문 안의 근거 문장 위치 (bodyText 기준 문자 offset) */
export interface Evidence {
  mailId: ID;
  text: string;
  start: number;
  end: number;
}

export type ExtractedField =
  | "etd"
  | "eta"
  | "doc_cutoff"
  | "invoice_amount"
  | "booking"
  | "bl_type"
  | "document"
  | "billing"
  | "other";

/** extracted_items: 메일에서 뽑은 값 + 근거 문장 */
export interface ExtractedItem {
  id: ID;
  caseId: ID;
  field: ExtractedField;
  /** 사람이 읽는 제목 "선적일 11/20 확정" */
  title: string;
  value: string | null;
  previousValue: string | null;
  status: "ok" | "needs_check";
  /** "메일" / "메일 · 첨부" */
  sourceLabel: string;
  evidence: Evidence;
  confidence: number;
  extractedAt: DateTimeString;
}

/** 타임라인 태그: 요청 / 답변 / 확정 / 확인 필요 / 메일 밖 */
export type CaseEventKind = "request" | "reply" | "confirm" | "issue" | "off_mail";

/** case_events: 건 상세 변경 타임라인 */
export interface CaseEvent {
  id: ID;
  caseId: ID;
  kind: CaseEventKind;
  title: string;
  /** 누가 (예: "A전자 박과장", "선사", "자동 발견") */
  actorLabel: string;
  at: DateTimeString;
  mailId: ID | null;
  extractedItemId: ID | null;
  offMailInfoId: ID | null;
  reviewItemId: ID | null;
}

export type OffMailSource = "carrier_site" | "phone" | "messenger" | "other";

/** off_mail_infos: 전화·카톡·선사 홈페이지 등 메일 밖에서 받은 정보 */
export interface OffMailInfo {
  id: ID;
  caseId: ID;
  /** 항목 (예: "선사 서류 마감") */
  field: string;
  value: string;
  source: OffMailSource;
  memo: string;
  confirmedAt: DateTimeString;
  createdBy: ID;
  createdAt: DateTimeString;
}

/* ───────────── 검토함 ───────────── */

export interface ReviewCandidate {
  shipperId: ID;
  caseId: ID | null;
  confidence: number;
}

/** review_items */
export interface ReviewItem {
  id: ID;
  companyId: ID;
  type: "link_check" | "unclassified";
  mailId: ID;
  /** 목록에 보이는 짧은 설명 "A전자 · 어느 건인지 애매함" */
  summary: string;
  /** AI가 판단을 미룬 이유 */
  reason: string;
  /** 1순위가 제안값 */
  candidates: ReviewCandidate[];
  /** 함께 확인할 추출 항목 */
  extractedItemIds: ID[];
  /** 미분류: 새 화주 후보 */
  suggestedShipperName: string | null;
  status: "open" | "resolved";
  createdAt: DateTimeString;
}

export type CorrectionKind =
  | "link_case"
  | "link_shipper"
  | "value"
  | "new_case"
  | "exclude"
  | "pattern";

/** correction_logs: 사람이 AI 결과를 고친 기록 (추후 학습 데이터) */
export interface CorrectionLog {
  id: ID;
  companyId: ID;
  kind: CorrectionKind;
  /** "연결 변경", "값 수정: 선적일" … */
  label: string;
  before: string | null;
  after: string | null;
  /** 대상 표시 "A전자 · SC-2611-014" */
  targetLabel: string | null;
  mailId: ID | null;
  correctedBy: ID;
  correctedAt: DateTimeString;
}
