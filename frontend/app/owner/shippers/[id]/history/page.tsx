import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getShipperHistory } from "@syncargo/backend/data";
import { ShipperHistory } from "./shipper-history";

/** R-04 화주 이력: 무엇이 무엇으로 바뀌었는지 전·후로 · 담당이 바뀐 시점도 한 줄에 · 원문 대신 근거 문장 */
export default async function OwnerShipperHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const h = await getShipperHistory(decodeURIComponent(id));
  if (!h) notFound();
  return (
    <Page
      owner
      crumbs={[
        { label: "화주", href: "/owner/shippers" },
        { label: h.shipper.name, href: `/owner/shippers/${encodeURIComponent(h.shipper.id)}` },
        { label: "화주 이력" },
      ]}
    >
      <ShipperHistory shipper={h.shipper} rows={h.rows} startedAt={h.startedAt} />
    </Page>
  );
}
