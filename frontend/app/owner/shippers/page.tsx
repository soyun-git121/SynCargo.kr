import { Page, PageTitle } from "@/components/app/page-header";
import { getCompanyShippers } from "@syncargo/backend/data";
import { OwnerShipperList } from "./owner-shipper-list";

/** R-02 화주 목록 (대표): 담당자별 묶음 · 막힌 건을 색으로 · 묶음마다 더 보기 */
export default async function OwnerShippersPage() {
  const shippers = await getCompanyShippers();
  return (
    <Page owner crumbs={[{ label: "화주" }]}>
      <PageTitle title="화주" description="담당자별로 묶어 보는 회사 화주" />
      <OwnerShipperList shippers={shippers} />
    </Page>
  );
}
