import type { CaseStage, CaseStatus, Role, TransportMode } from "./types";

export const STAGES: { key: CaseStage; label: string }[] = [
  { key: "booking", label: "부킹" },
  { key: "docs", label: "서류" },
  { key: "shipping", label: "선적" },
  { key: "arrival", label: "도착" },
  { key: "settlement", label: "정산" },
];

export const STAGE_LABEL: Record<CaseStage, string> = {
  booking: "부킹",
  docs: "서류",
  shipping: "선적",
  arrival: "도착",
  settlement: "정산",
};

export const STATUS_LABEL: Record<CaseStatus, string> = {
  needs_check: "확인 필요",
  awaiting_reply: "답변 대기",
  in_progress: "진행 중",
  done: "완료",
};

export const MODE_LABEL: Record<TransportMode, string> = {
  sea_export: "해상 수출",
  sea_import: "해상 수입",
  air_export: "항공 수출",
  air_import: "항공 수입",
  domestic: "국내 운송",
};

export const ROLE_LABEL: Record<Role, string> = {
  staff: "실무자",
  lead: "팀장",
  ceo: "대표",
};
