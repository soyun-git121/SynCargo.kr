import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getCurrentUser, getShipper } from "@syncargo/backend/data";
import { ShipperView } from "./shipper-view";

/** W-03 화주 카드 */
export default async function ShipperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, user] = await Promise.all([getShipper(decodeURIComponent(id)), getCurrentUser()]);
  if (!detail) notFound();
  return (
    <Page crumbs={[{ label: "화주", href: "/shippers" }, { label: detail.shipper.name }]}>
      <ShipperView detail={detail} userName={user.name} />
    </Page>
  );
}
