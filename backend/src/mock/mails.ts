import type { Attachment, Mail, MailAddress } from "../types";

/**
 * 가짜 메일 원문. 화면에서 직접 import 하지 말고 lib/data.ts를 거칠 것.
 * 근거 문장(evidence)의 위치는 lib/mock/index.ts에서 본문 안을 검색해 자동 계산한다.
 */

const CO = "co1";
const MB = "mb1";

const ME: MailAddress = { name: "김대리", email: "kim@demo-forwarding.kr" };
const PARK: MailAddress = { name: "박주임", email: "park@demo-forwarding.kr" };

const A_PARK: MailAddress = { name: "A전자 박과장", email: "park@a-elec.co.kr" };
const A_FIN: MailAddress = { name: "A전자 재무팀", email: "finance@a-elec.co.kr" };
const B_HAN: MailAddress = { name: "B푸드 한대리", email: "han@bfood.co.kr" };
const C_OH: MailAddress = { name: "C케미칼 오주임", email: "oh@c-chem.co.kr" };
const E_YOON: MailAddress = { name: "E코스메틱 윤매니저", email: "yoon@e-cosmetic.com" };
const K_CHOI: MailAddress = { name: "K트레이딩 최대리", email: "choi@k-trading.co.kr" };
const CARRIER: MailAddress = { name: "한바다해운 부킹팀", email: "booking@hanbada-line.com" };
const CARRIER_NOTICE: MailAddress = { name: "Blue Ocean Lines 고객센터", email: "notice@blueocean-lines.com" };
const BROKER: MailAddress = { name: "한결관세사 이관세사", email: "lee@hangyeol-customs.kr" };

type MailInput = Omit<
  Mail,
  "id" | "companyId" | "mailboxId" | "graphMessageId" | "conversationId" | "webLink" | "classification" | "cc"
> & { conv: string; cc?: MailAddress[]; classification?: Mail["classification"] };

function mail(id: string, m: MailInput): Mail {
  const { conv, classification, cc, ...rest } = m;
  return {
    id,
    companyId: CO,
    mailboxId: MB,
    graphMessageId: `AAMk-${id}`,
    conversationId: `conv-${conv}`,
    webLink: null,
    classification: classification ?? "linked",
    cc: cc ?? [],
    ...rest,
  };
}

export const mails: Mail[] = [
  /* ── SC-2611-014 A전자 (부산 → 롱비치) ── */
  mail("m01", {
    conv: "a014-schedule",
    subject: "11월 선적 일정 변경 건",
    from: A_PARK,
    to: [ME],
    receivedAt: "2026-11-12T09:40:00+09:00",
    bodyText: `김대리님 안녕하세요, A전자 박과장입니다.

이번에 이과장님 업무를 제가 이어받게 되었습니다. 앞으로 잘 부탁드립니다.

SC-2611-014 건 관련해서, 공장 출고 일정이 이틀 당겨졌습니다.
선적일을 11/22에서 11/20으로 당겨 주실 수 있을까요?

가능 여부 회신 부탁드립니다.
박과장 드림`,
  }),
  mail("m02", {
    conv: "a014-carrier",
    subject: "RE: 스케줄 변경 문의 - HDBK7781203",
    from: CARRIER,
    to: [ME],
    receivedAt: "2026-11-13T15:10:00+09:00",
    bodyText: `Dear Customer,

Regarding your request for booking HDBK7781203,
11/20 출항 HANBADA PRIDE 052E로 변경 가능합니다.

Vessel / Voyage: HANBADA PRIDE 052E
ETD BUSAN: 2026-11-20
ETA LONG BEACH: 2026-12-04

Please confirm by 11/14.

Best regards,
Hanbada Line Booking Team`,
  }),
  mail("m03", {
    conv: "a014-schedule",
    subject: "RE: 11월 선적 일정 변경 건",
    from: A_PARK,
    to: [ME],
    receivedAt: "2026-11-14T10:22:00+09:00",
    bodyText: `김대리님,

선사 회신 공유 감사합니다. 확인했습니다.
지난번 통화에서 말씀드린 대로 11/20 선적으로 진행 부탁드립니다.

인보이스와 패킹리스트 첨부합니다.
서류 마감 전까지 추가로 필요한 것 있으면 알려주세요.
그리고 혹시 대기료가 생기면 미리 알려주세요.

박과장 드림

-----Original Message-----
From: 김대리
Subject: RE: 11월 선적 일정 변경 건
선사에서 11/20 출항 HANBADA PRIDE 052E로 변경 가능하다고 회신 왔습니다. 이대로 확정할까요?`,
  }),
  mail("m04", {
    conv: "a-invoice",
    classification: "needs_review",
    subject: "RE: 인보이스 송부",
    from: A_PARK,
    to: [ME],
    cc: [A_FIN],
    receivedAt: "2026-11-15T16:40:00+09:00",
    bodyText: `김대리님,

SC-2611-014 건 수정 인보이스 송부드립니다.
인보이스 금액은 USD 12,400입니다.

재무팀 참조로 넣었습니다.
박과장 드림

-----Original Message-----
From: 김대리
Subject: SC-2611-013 인보이스 요청
인보이스 수정본 부탁드립니다.`,
  }),
  mail("m05", {
    conv: "a014-pl",
    subject: "패킹리스트 수정본 요청 (SC-2611-014)",
    from: ME,
    to: [A_PARK],
    receivedAt: "2026-11-15T17:05:00+09:00",
    bodyText: `박과장님 안녕하세요, 김대리입니다.

보내주신 패킹리스트의 팔레트 수량이 인보이스와 다르게 적혀 있습니다.
패킹리스트 수정본을 11/17까지 보내주실 수 있을까요?

서류 마감이 11/18 17시라 그 전에 선사에 제출해야 합니다.
감사합니다.`,
  }),
  mail("m06", {
    conv: "a-bl",
    subject: "B/L 발행 방식 안내",
    from: A_PARK,
    to: [ME],
    receivedAt: "2026-10-30T11:15:00+09:00",
    bodyText: `김대리님,

앞으로 미주 물량은 B/L은 서렌더로 발행 부탁드립니다.
원본 B/L 수령이 늦어져 현지 통관이 지연된 적이 있어서요.

감사합니다.
박과장 드림`,
  }),

  /* ── SC-2611-009 A전자 (선적 완료 → 도착 대기) ── */
  mail("m07", {
    conv: "a009",
    subject: "[선적 완료 통지] HDLB2611009",
    from: CARRIER,
    to: [ME],
    receivedAt: "2026-11-16T08:10:00+09:00",
    bodyText: `Dear Customer,

Please be advised that your shipment has departed.

B/L No: HDLB2611009
Vessel / Voyage: HANBADA STAR 118E
ATD BUSAN: 2026-11-11
ETA LONG BEACH: 2026-11-25

Thank you for choosing Hanbada Line.`,
  }),

  /* ── SC-2610-031 A전자 (정산) ── */
  mail("m08", {
    conv: "a031",
    subject: "SC-2610-031 운임 청구 요청",
    from: A_FIN,
    to: [ME],
    receivedAt: "2026-11-13T14:00:00+09:00",
    bodyText: `안녕하세요, A전자 재무팀입니다.

10월 롱비치 선적 건(SC-2610-031) 운임 청구 관련 연락드립니다.
11/20까지 청구서 보내주시면 월말 지급 처리하겠습니다.

감사합니다.`,
  }),

  /* ── 통관 (번호 없음) A전자 ── */
  mail("m09", {
    conv: "a-customs",
    subject: "A전자 수입 원자재 통관 서류 요청",
    from: BROKER,
    to: [ME],
    receivedAt: "2026-11-14T13:30:00+09:00",
    bodyText: `김대리님 안녕하세요, 한결관세사 이관세사입니다.

A전자 수입 원자재 건은 11/18 수입신고 예정입니다.
인보이스, 패킹리스트, 원산지증명서를 11/17까지 전달 부탁드립니다.

감사합니다.`,
  }),

  /* ── SC-2611-007 E코스메틱 (항공 인천 → 파리) ── */
  mail("m10", {
    conv: "e007",
    subject: "SC-2611-007 선적일 변경 가능 문의",
    from: E_YOON,
    to: [ME],
    receivedAt: "2026-11-16T09:05:00+09:00",
    bodyText: `김대리님, E코스메틱 윤매니저입니다.

박람회 일정이 바뀌어서 문의드립니다.
11/21 선적을 11/24로 미룰 수 있을지 문의드립니다.

가능하면 오늘 중으로 회신 부탁드립니다.
윤매니저 드림`,
  }),

  /* ── SC-2611-011 D모터스 (부킹 회신 대기) ── */
  mail("m11", {
    conv: "d011",
    subject: "부킹 요청 - D모터스 인천 → 함부르크 (SC-2611-011)",
    from: ME,
    to: [CARRIER],
    receivedAt: "2026-11-16T09:30:00+09:00",
    bodyText: `Dear Hanbada Line,

Please arrange the booking below.

Shipper: D Motors
Route: INCHEON → HAMBURG
Equipment: 40HC x 3

11/20까지 부킹 확정 회신 부탁드립니다.

Best regards,
김대리`,
  }),

  /* ── SC-2611-013 B푸드 (검역) ── */
  mail("m12", {
    conv: "b013",
    subject: "RE: SC-2611-013 검역 서류 접수",
    from: B_HAN,
    to: [ME],
    receivedAt: "2026-11-16T10:15:00+09:00",
    bodyText: `김대리님, B푸드 한대리입니다.

요청하신 검역 서류 접수 관련 회신드립니다.
검역 서류는 11/19까지 접수 완료하겠습니다.

식물검역증명서 원본은 택배로 보내드릴게요.
한대리 드림`,
  }),

  /* ── 국내 운송 (번호 없음) C케미칼 ── */
  mail("m13", {
    conv: "c-dom",
    subject: "울산 → 평택 상차 시간 확정",
    from: C_OH,
    to: [ME],
    receivedAt: "2026-11-16T08:45:00+09:00",
    bodyText: `김대리님, C케미칼 오주임입니다.

내일 운송 건 상차 시간 공유드립니다.
11/17 오전 9시 울산 공장 상차로 확정합니다.

기사님 배정되면 차량 번호 알려주세요.`,
  }),

  /* ── 검토함: 확인 필요한 연결 ── */
  mail("m14", {
    conv: "fw-schedule",
    classification: "needs_review",
    subject: "FW: 스케줄 안내",
    from: PARK,
    to: [ME],
    receivedAt: "2026-11-15T09:05:00+09:00",
    bodyText: `김대리님, D모터스 쪽 스케줄 선사에서 받은 거 공유드려요.

-----Forwarded Message-----
From: Hanbada Line
Subject: 스케줄 안내

[인천 출항 주간 스케줄 - 함부르크]
- 11/22(일) HANBADA GLORY 031W, 서류 마감 11/19
- 11/29(일) HANBADA GLORY 032W, 서류 마감 11/26`,
  }),
  mail("m15", {
    conv: "arrival",
    classification: "needs_review",
    subject: "도착 통지",
    from: CARRIER_NOTICE,
    to: [ME],
    receivedAt: "2026-11-15T07:30:00+09:00",
    bodyText: `[도착 통지 / Arrival Notice]

B/L No: BOLN2611207
선명: BLUE OCEAN 7 / 2245N
도착항: 부산 신항
도착 예정: 2026-11-17

화물 인도 전 운임 및 D/O 비용 결제가 필요합니다.
문의: Blue Ocean Lines 고객센터`,
  }),

  /* ── 검토함: 미분류 ── */
  mail("m16", {
    conv: "k-quote",
    classification: "unclassified",
    subject: "운임 견적 문의",
    from: K_CHOI,
    to: [ME],
    receivedAt: "2026-11-15T11:05:00+09:00",
    bodyText: `안녕하세요, K트레이딩 최대리입니다.

지인 소개로 연락드립니다.
부산 → 호치민 20GP 2대 운임 견적 부탁드립니다.

- 품목: 생활용품
- 희망 출항: 12월 첫째 주

견적 회신 부탁드립니다.
최대리 드림`,
  }),
];

const PDF = "application/pdf";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const attachments: Attachment[] = [
  { id: "at01", mailId: "m03", docType: "Invoice", fileName: "Invoice.pdf", contentType: PDF, sizeBytes: 98_304, note: { text: "금액 확인 필요", tone: "danger" }, storagePath: null },
  { id: "at02", mailId: "m03", docType: "Packing List", fileName: "PackingList.xlsx", contentType: XLSX, sizeBytes: 45_056, note: { text: "수정본 요청함", tone: "muted" }, storagePath: null },
  { id: "at03", mailId: "m02", docType: "B/L", fileName: "BL_Draft_HDBK7781203.pdf", contentType: PDF, sizeBytes: 184_320, note: null, storagePath: null },
  { id: "at04", mailId: "m04", docType: "Invoice", fileName: "Invoice_rev.pdf", contentType: PDF, sizeBytes: 101_376, note: { text: "첨부 금액 USD 12,040", tone: "danger" }, storagePath: null },
  { id: "at05", mailId: "m07", docType: "B/L", fileName: "BL_HDLB2611009.pdf", contentType: PDF, sizeBytes: 143_360, note: null, storagePath: null },
  { id: "at06", mailId: "m15", docType: "Arrival Notice", fileName: "Arrival_Notice.pdf", contentType: PDF, sizeBytes: 76_800, note: null, storagePath: null },
];
