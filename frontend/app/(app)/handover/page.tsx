import { Page } from "@/components/app/page-header";
import { getHandovers } from "@syncargo/backend/data";
import { HandoverStatusView } from "./handover-status";

/** W-12 인계·미결 현황. ?tab=received 로 받은 인계 탭이 바로 열림 (홈 '받은 인계 보기'). */
export default async function HandoverPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab }, { sent, received }] = await Promise.all([searchParams, getHandovers()]);
  return (
    <Page crumbs={[{ label: "인계", href: "/handover" }, { label: "인계·미결 현황" }]}>
      <HandoverStatusView key={tab ?? "sent"} sent={sent} received={received} initialTab={tab === "received" ? "received" : "sent"} />
    </Page>
  );
}
