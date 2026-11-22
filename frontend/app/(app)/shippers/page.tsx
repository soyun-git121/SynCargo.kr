import { Page, PageTitle } from "@/components/app/page-header";
import { getCurrentUser, getShippers } from "@syncargo/backend/data";
import { ShipperList } from "./shipper-list";

/** W-02 화주 목록 */
export default async function ShippersPage() {
  const [shippers, user] = await Promise.all([getShippers(), getCurrentUser()]);
  const mine = shippers.filter((s) => s.ownerId === user.id).length;
  return (
    <Page crumbs={[{ label: "화주" }]}>
      <PageTitle title="화주" description={`내가 맡은 화주가 먼저 보입니다 · ${mine}곳`} />
      <ShipperList shippers={shippers} userId={user.id} />
    </Page>
  );
}
