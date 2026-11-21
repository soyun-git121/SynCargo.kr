import type {
  CaseEventKind,
  ExtractedField,
  CaseKind,
  CaseStage,
  CaseStatus,
  OffMailSource,
  Role,
  TradeType,
} from "@syncargo/backend/types";
import { NO_CODE_LABEL, STATUS_RANK } from "@syncargo/backend/domain";

export { NO_CODE_LABEL, STATUS_RANK };

export const STAGES: { key: CaseStage; label: string }[] = [
  { key: "booking", label: "부킹" },
  { key: "docs", label: "서류" },
  { key: "shipping", label: "선적" },
  { key: "arrival", label: "도착" },
  { key: "settlement", label: "정산" },
];

export const STATUS_LABEL: Record<CaseStatus, string> = {
  needs_check: "확인 필요",
  awaiting_reply: "답변 대기",
  in_progress: "진행 중",
  done: "완료",
};

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  sea_export: "해상 수출",
  sea_import: "해상 수입",
  air_export: "항공 수출",
  air_import: "항공 수입",
  domestic: "국내 운송",
};

export const CASE_KIND_LABEL: Record<CaseKind, string> = {
  shipment: "선적",
  domestic: "국내 운송",
  customs: "통관",
};

export const EVENT_KIND_LABEL: Record<CaseEventKind, string> = {
  request: "요청",
  reply: "답변",
  confirm: "확정",
  issue: "확인 필요",
  off_mail: "메일 밖",
};

export const OFF_MAIL_SOURCE_LABEL: Record<OffMailSource, string> = {
  carrier_site: "선사 홈페이지",
  phone: "전화",
  messenger: "메신저 · 카톡",
  other: "기타",
};

export const ROLE_LABEL: Record<Role, string> = {
  staff: "실무자",
  lead: "팀장",
  ceo: "대표",
};


export const EXTRACTED_FIELD_LABEL: Record<ExtractedField, string> = {
  etd: "선적일",
  eta: "도착일",
  doc_cutoff: "서류 마감",
  invoice_amount: "인보이스 금액",
  booking: "부킹",
  bl_type: "B/L 발행 방식",
  document: "서류",
  billing: "청구",
  other: "기타",
};
