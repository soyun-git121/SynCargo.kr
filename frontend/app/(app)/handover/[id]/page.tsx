import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getHandover, getHandoverPreview } from "@syncargo/backend/data";
import { formatPeriod } from "@/lib/date";
import { HANDOVER_STATUS_LABEL } from "@/lib/labels";
import { HandoverPreview } from "../handover-preview";

/** 인계 요약 (W-12 '인계 요약 보기'): 이미 요청·승인된 인계를 화주별로 */
export default async function HandoverSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getHandover(decodeURIComponent(id));
  if (!h) notFound();
  const shippers = await getHandoverPreview(h.shipperIds, h.id);

  return (
    <Page crumbs={[{ label: "인계", href: "/handover" }, { label: "인계 요약" }]}>
      <HandoverPreview
        mode={{ kind: "view", statusLabel: HANDOVER_STATUS_LABEL[h.status] }}
        fromName={h.fromName}
        toUserId={h.toUserId}
        toName={h.toName}
        reason={h.reason}
        period={h.periodEnd ? formatPeriod(h.periodStart, h.periodEnd) : null}
        shippers={shippers}
        readOnlySummary
      />
    </Page>
  );
}
