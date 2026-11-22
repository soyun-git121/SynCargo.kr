/** 화면용 날짜 표시. 기준일·D-day 계산 규칙은 backend(domain)에 있다. */
import { TODAY, daysUntil, toUTC } from "@syncargo/backend/domain";

export { TODAY, daysUntil };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** "D-2" / "D-Day" / "D+1" */
export function ddayLabel(date: string, today: string = TODAY): string {
  const n = daysUntil(date, today);
  if (n === 0) return "D-Day";
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

/** "11/18" */
export function formatMD(date: string): string {
  const [, m, d] = date.slice(0, 10).split("-").map(Number);
  return `${m}/${d}`;
}

/** "11/09" (두 자리) */
export function formatMMDD(date: string): string {
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`;
}

function weekday(date: string): string {
  return WEEKDAYS[new Date(toUTC(date)).getUTCDay()];
}

/** "11/18 (수)" */
export function formatMDW(date: string): string {
  return `${formatMD(date)} (${weekday(date)})`;
}

/** "11월 16일 (월)" */
export function formatKoreanDate(date: string): string {
  const [, m, d] = date.slice(0, 10).split("-").map(Number);
  return `${m}월 ${d}일 (${weekday(date)})`;
}

/** "2026.11.18" */
export function formatYMD(date: string): string {
  return date.slice(0, 10).replaceAll("-", ".");
}

/** "11/16 09:12" — 일시 문자열의 로컬(KST) 부분을 그대로 사용 */
export function formatDateTime(dt: string): string {
  const time = dt.slice(11, 16);
  return `${formatMD(dt)} ${time}`;
}

/** "09:12" 또는 기준일이 아니면 "11/14" */
export function formatRelative(dt: string, today: string = TODAY): string {
  return dt.slice(0, 10) === today ? dt.slice(11, 16) : formatMD(dt);
}
