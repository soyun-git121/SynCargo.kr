/** 데모 기준 날짜: 2026-11-16(월). D-day는 모두 이 날짜 기준. */
export const TODAY: string = "2026-11-16";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toUTC(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** 기준일로부터 남은 일수 (양수 = 미래) */
export function daysUntil(date: string, today: string = TODAY): number {
  return Math.round((toUTC(date) - toUTC(today)) / DAY_MS);
}

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

/** "11/18(수)" */
export function formatMDW(date: string): string {
  const w = new Date(toUTC(date)).getUTCDay();
  return `${formatMD(date)}(${WEEKDAYS[w]})`;
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
