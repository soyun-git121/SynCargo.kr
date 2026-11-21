import type { Attachment, Mail, MailAddress } from "../types";

/**
 * 가짜 메일 원문. 화면에서 직접 import 하지 말고 lib/data.ts를 거칠 것.
 * 근거 문장(evidence)은 lib/mock/index.ts에서 본문 안 위치를 자동 계산한다.
 */

const CO = "co1";
const MB = "mb1";

const ME: MailAddress = { name: "김대리", email: "kim@demo-forwarding.kr" };
const PARK: MailAddress = { name: "박주임", email: "park@demo-forwarding.kr" };

const A_LEE: MailAddress = { name: "이과장 (A전자)", email: "lee@a-elec.co.kr" };
const A_ACC: MailAddress = { name: "박사원 (A전자 회계)", email: "accounting@a-elec.co.kr" };
const B_HAN: MailAddress = { name: "한대리 (B푸드)", email: "han@bfood.co.kr" };
const C_OH: MailAddress = { name: "오주임 (C케미칼)", email: "oh@c-chem.co.kr" };
const D_ACC: MailAddress = { name: "정산팀 (D모터스)", email: "billing@dmotors.co.kr" };
const E_YOON: MailAddress = { name: "윤매니저 (E코스메틱)", email: "yoon@e-cosmetic.com" };
const G_SEO: MailAddress = { name: "서과장 (G텍스타일)", email: "seo@g-textile.co.kr" };
const H_KANG: MailAddress = { name: "강대리 (H머티리얼)", email: "kang@h-material.co.kr" };
const K_TRADE: MailAddress = { name: "최부장 (K트레이딩)", email: "choi@k-trading.co.kr" };
const HANBADA: MailAddress = { name: "한바다해운 부킹팀", email: "booking@hanbada-line.com" };
const NINGBO_AGENT: MailAddress = { name: "Ningbo Pacific Logistics", email: "ops@nbpacific.cn" };
const CARRIER_AN: MailAddress = { name: "Blue Ocean Lines 고객센터", email: "notice@blueocean-lines.com" };

function mail(
  id: string,
  m: Omit<Mail, "id" | "companyId" | "mailboxId" | "graphMessageId" | "conversationId" | "classification"> & {
    conv: string;
    classification?: Mail["classification"];
  },
): Mail {
  const { conv, classification, ...rest } = m;
  return {
    id,
    companyId: CO,
    mailboxId: MB,
    graphMessageId: `AAMk-${id}`,
    conversationId: `conv-${conv}`,
    classification: classification ?? "linked",
    ...rest,
  };
}

export const mails: Mail[] = [
  /* ── SC-2611-014 A전자 (부산→롱비치) ── */
  mail("m01", {
    conv: "a014",
    subject: "SC-2611-014 부킹 요청 (부산→롱비치, 40HC x 2)",
    from: A_LEE,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-10T09:20:00+09:00",
    bodyText: `김대리님 안녕하세요, A전자 이과장입니다.

이번 달 미주 물량 부킹 요청드립니다.

- 구간: 부산 → 롱비치
- 장비: 40HC x 2
- 품목: 가전 부품 (모니터 패널)
- 총 금액은 USD 46,800 예정입니다.

11/22 선적 희망합니다. 가능한 스케줄 회신 부탁드립니다.

감사합니다.
이과장 드림`,
  }),
  mail("m02", {
    conv: "a014",
    subject: "Booking Confirmation - HDBK7781203 (BUSAN → LONG BEACH)",
    from: HANBADA,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-11T14:05:00+09:00",
    bodyText: `Dear Customer,

Your booking has been confirmed as below.

Booking No: HDBK7781203
Vessel / Voyage: HANBADA PRIDE 052E
Equipment: 40HC x 2
ETD BUSAN: 2026-11-20
ETA LONG BEACH: 2026-12-04
Doc cut-off: 11/18 17:00
Cargo cut-off: 11/19 12:00

Please submit SI and VGM before the doc cut-off.

Best regards,
Hanbada Line Booking Team`,
  }),
  mail("m03", {
    conv: "a014",
    subject: "RE: SC-2611-014 선적 일정 확인",
    from: A_LEE,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-13T10:30:00+09:00",
    bodyText: `김대리님,

확인 감사합니다. 공장 출고 일정이 당겨져서 22일 배는 필요 없게 되었습니다.
지난번 통화에서 말씀드린 대로 11/20 선적으로 진행 부탁드립니다.

서류는 이번 주 금요일까지 정리해서 보내드리겠습니다.

이과장 드림

-----Original Message-----
From: 김대리
Subject: SC-2611-014 선적 일정 확인
한바다해운 11/20 출항 스케줄로 부킹 확정되었습니다. 22일 희망하셨는데 20일로 진행해도 괜찮으실까요?`,
  }),
  mail("m04", {
    conv: "a014",
    subject: "SC-2611-014 인보이스 및 패킹리스트 송부",
    from: A_LEE,
    to: [ME],
    cc: [A_ACC],
    receivedAt: "2026-11-14T16:40:00+09:00",
    bodyText: `김대리님,

요청하신 서류 첨부합니다.

- Commercial Invoice 1부
- Packing List 1부

인보이스 금액은 USD 48,600입니다.
패킹리스트 기준 총 중량 18,420kg, 64 팔레트입니다.

확인 부탁드립니다.
이과장 드림`,
  }),
  mail("m05", {
    conv: "a-invoice",
    classification: "needs_review",
    subject: "RE: 인보이스 송부",
    from: A_ACC,
    to: [ME],
    cc: [A_LEE],
    receivedAt: "2026-11-16T08:52:00+09:00",
    bodyText: `안녕하세요, A전자 회계팀 박사원입니다.

요청하신 인보이스 재송부드립니다.
지난번 보내드린 건 중 단가 오류가 있어 수정본으로 첨부합니다.

수정 후 총액은 USD 46,800입니다.

확인 후 회신 부탁드립니다.
박사원 드림`,
  }),

  /* ── SC-2611-009 B푸드 (부산→시드니) ── */
  mail("m06", {
    conv: "b009",
    subject: "[Departure Notice] BSTK2611009 출항 완료",
    from: HANBADA,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-12T18:10:00+09:00",
    bodyText: `Dear Customer,

Please be advised that your shipment has departed.

B/L No: BSTK2611009
Vessel / Voyage: HANBADA STAR 118S
ATD BUSAN: 2026-11-12
ETA SYDNEY: 2026-11-25

Thank you for choosing Hanbada Line.`,
  }),
  mail("m07", {
    conv: "b009",
    subject: "SC-2611-009 도착 후 냉장 창고 배송 문의",
    from: B_HAN,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-14T11:00:00+09:00",
    bodyText: `김대리님 안녕하세요, B푸드 한대리입니다.

시드니 도착 후 현지 냉장 창고까지 배송 가능한지 문의드립니다.
창고 주소는 첨부와 같고, 입고 가능 시간은 평일 오전 7시~11시입니다.

도착 예정일 기준으로 일정 잡아주시면 감사하겠습니다.
한대리 드림`,
  }),

  /* ── SC-2610-031 D모터스 (부산→함부르크) ── */
  mail("m08", {
    conv: "d031",
    subject: "SC-2610-031 운임 정산 관련",
    from: D_ACC,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-13T15:20:00+09:00",
    bodyText: `안녕하세요, D모터스 정산팀입니다.

10월 함부르크 선적 건(SC-2610-031) 운임 정산 관련 연락드립니다.
11/20까지 청구서 보내주시면 월말 지급 처리하겠습니다.

청구서에는 THC, 서류비 항목을 분리해서 기재 부탁드립니다.
감사합니다.`,
  }),

  /* ── SC-2611-007 E코스메틱 (항공 인천→파리) ── */
  mail("m09", {
    conv: "e007",
    subject: "SC-2611-007 항공 부킹 요청 (인천→파리, 320kg)",
    from: E_YOON,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-15T10:15:00+09:00",
    bodyText: `김대리님, E코스메틱 윤매니저입니다.

파리 박람회용 샘플 항공 부킹 요청드립니다.

- 구간: 인천(ICN) → 파리(CDG)
- 중량: 320kg / 14 CTN
- 품목: 화장품 (MSDS 첨부)

화물은 11/19 반입 가능합니다.
항공사 스케줄과 요율 회신 부탁드립니다.

윤매니저 드림`,
  }),
  mail("m10", {
    conv: "fw-schedule",
    classification: "needs_review",
    subject: "FW: 스케줄 안내",
    from: PARK,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-16T09:05:00+09:00",
    bodyText: `김대리님, 선사에서 온 스케줄 공유드려요. 대리님 건에 필요하실 것 같아서요.

-----Forwarded Message-----
From: Hanbada Line
Subject: 스케줄 안내

[부산 출항 주간 스케줄]
- 부산 → 자카르타: 11/21(토) HANBADA JADE 207S, 서류 마감 11/18
- 부산 → 롱비치: 11/27(금) HANBADA PRIDE 053E, 서류 마감 11/24

잔여 공간이 많지 않으니 빠른 확정 부탁드립니다.`,
  }),

  /* ── SC-2611-013 G텍스타일 (부산→자카르타) ── */
  mail("m11", {
    conv: "g013",
    subject: "SC-2611-013 자카르타 부킹 요청 (20GP x 3)",
    from: G_SEO,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-14T09:40:00+09:00",
    bodyText: `김대리님 안녕하세요. G텍스타일 서과장입니다.

자카르타행 원단 물량 부킹 요청드립니다.
- 장비: 20GP x 3
- 희망 출항: 11월 셋째 주

선사 스케줄 회신은 11/17까지 부탁드립니다.
감사합니다.`,
  }),

  /* ── SC-2611-011 F리빙 (닝보→부산) ── */
  mail("m12", {
    conv: "f011",
    subject: "Pre-alert: NGB→PUS HBL NBPS2611011",
    from: NINGBO_AGENT,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-15T13:00:00+09:00",
    bodyText: `Dear Partner,

Please find the pre-alert for the shipment below.

Shipper: F-Living Ningbo Factory
HBL No: NBPS2611011
Vessel: BLUE OCEAN 7 / 2245N
ETD NINGBO: 2026-11-13
ETA BUSAN: 2026-11-17

Draft HBL and commercial documents attached.

Best regards,
Ningbo Pacific Logistics`,
  }),
  mail("m13", {
    conv: "arrival",
    classification: "needs_review",
    subject: "도착 통지",
    from: CARRIER_AN,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-16T07:30:00+09:00",
    bodyText: `[도착 통지 / Arrival Notice]

B/L No: NBPS2611O11
선명: BLUE OCEAN 7 / 2245N
도착항: 부산 신항
도착 예정: 2026-11-17

화물 인도 전 운임 및 D/O 비용 결제가 필요합니다.
문의: Blue Ocean Lines 고객센터`,
  }),

  /* ── SC-2611-012 H머티리얼 (칭다오→인천) ── */
  mail("m14", {
    conv: "h012",
    subject: "SC-2611-012 선적서류 송부 (칭다오→인천)",
    from: H_KANG,
    to: [PARK],
    cc: [ME],
    receivedAt: "2026-11-14T17:20:00+09:00",
    bodyText: `박주임님, H머티리얼 강대리입니다.

칭다오 출항 건 선적서류 송부드립니다.
B/L 사본, 인보이스, 패킹리스트 첨부합니다.

인천 도착 예정일은 11/21입니다.
통관 준비 부탁드립니다.`,
  }),

  /* ── SC-2611-005 C케미칼 (국내 운송, B/L 없음) ── */
  mail("m16", {
    conv: "c005",
    subject: "울산→평택 운송 하차 일정 확인",
    from: C_OH,
    to: [PARK],
    cc: [ME],
    receivedAt: "2026-11-15T08:30:00+09:00",
    bodyText: `박주임님, C케미칼 오주임입니다.

평택 공장 하차 일정 공유드립니다.
11/18 오전 하차 예정입니다.

하차 시 지게차는 저희 쪽에서 준비하겠습니다.`,
  }),

  /* ── 미분류: K트레이딩 ── */
  mail("m15", {
    conv: "k-quote",
    classification: "unclassified",
    subject: "운임 견적 문의 (부산→호치민 20GP)",
    from: K_TRADE,
    to: [ME],
    cc: [],
    receivedAt: "2026-11-16T10:02:00+09:00",
    bodyText: `안녕하세요, K트레이딩 최부장입니다.

지인 소개로 연락드립니다.
부산 → 호치민 20GP 2대 운임 견적 부탁드립니다.

- 품목: 생활용품
- 희망 출항: 12월 첫째 주

견적 회신 부탁드립니다.
최부장 드림`,
  }),
];

export const attachments: Attachment[] = [
  { id: "at01", mailId: "m02", fileName: "Booking_Confirmation_HDBK7781203.pdf", contentType: "application/pdf", sizeBytes: 184_320, storagePath: null },
  { id: "at02", mailId: "m04", fileName: "CI_SC-2611-014.pdf", contentType: "application/pdf", sizeBytes: 98_304, storagePath: null },
  { id: "at03", mailId: "m04", fileName: "PL_SC-2611-014.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 45_056, storagePath: null },
  { id: "at04", mailId: "m05", fileName: "CI_revised.pdf", contentType: "application/pdf", sizeBytes: 101_376, storagePath: null },
  { id: "at05", mailId: "m07", fileName: "창고주소_시드니.pdf", contentType: "application/pdf", sizeBytes: 52_224, storagePath: null },
  { id: "at06", mailId: "m09", fileName: "MSDS_E-Cosmetic.pdf", contentType: "application/pdf", sizeBytes: 230_400, storagePath: null },
  { id: "at07", mailId: "m12", fileName: "HBL_DRAFT_NBPS2611011.pdf", contentType: "application/pdf", sizeBytes: 143_360, storagePath: null },
  { id: "at08", mailId: "m13", fileName: "Arrival_Notice.pdf", contentType: "application/pdf", sizeBytes: 76_800, storagePath: null },
  { id: "at09", mailId: "m14", fileName: "BL_copy_SC-2611-012.pdf", contentType: "application/pdf", sizeBytes: 167_936, storagePath: null },
  { id: "at10", mailId: "m14", fileName: "CI_PL_SC-2611-012.pdf", contentType: "application/pdf", sizeBytes: 120_832, storagePath: null },
];
