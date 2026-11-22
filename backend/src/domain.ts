/**
 * 도메인 규칙 (화면과 무관). 데이터 계층과 프론트엔드가 함께 쓴다.
 */
import type { CaseStage, CaseStatus } from "./types";

/** 데모 기준 날짜: 2026-11-16(월). D-day는 모두 이 날짜 기준. 실제 운영 시 오늘 날짜로 교체. */
export const TODAY: string = "2026-11-16";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toUTC(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 기준일로부터 남은 일수 (양수 = 미래) */
export function daysUntil(date: string, today: string = TODAY): number {
  return Math.round((toUTC(date) - toUTC(today)) / DAY_MS);
}

/** 업무 단계 순서: 부킹 → 서류 → 선적 → 도착 → 정산 */
export const STAGE_ORDER: CaseStage[] = ["booking", "docs", "shipping", "arrival", "settlement"];

/** 정렬용: 확인 필요가 먼저 */
export const STATUS_RANK: Record<CaseStatus, number> = {
  needs_check: 0,
  awaiting_reply: 1,
  in_progress: 2,
  done: 3,
};

/** 번호 없는 건(국내 운송·통관) 표시 문구 */
export const NO_CODE_LABEL = "번호 없음";
