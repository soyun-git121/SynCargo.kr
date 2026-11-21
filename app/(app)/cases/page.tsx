import { Page, PageTitle } from "@/components/app/page-header";
import { getCases, getShippers } from "@/lib/data";
import { CaseList } from "./case-list";

/** W-04 업무 건 목록 */
export default async function CasesPage() {
  const [cases, shippers] = await Promise.all([getCases(), getShippers()]);
  return (
    <Page crumbs={[{ label: "업무 건" }]}>
      <PageTitle title="업무 건" description="B/L 없는 국내 운송·통관 건까지 한 목록에" />
      <CaseList cases={cases} shippers={shippers.map((s) => ({ id: s.id, name: s.name }))} />
    </Page>
  );
}
