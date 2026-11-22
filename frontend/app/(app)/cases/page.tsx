import { Page, PageTitle } from "@/components/app/page-header";
import { getCases, getShippers } from "@syncargo/backend/data";
import { CaseList, type Tab } from "./case-list";

const TABS: Tab[] = ["all", "in_progress", "needs_check", "awaiting_reply", "done"];

/** W-04 업무 건 목록 (?tab=done&shipper=s1 로 탭·화주를 미리 고를 수 있음) */
export default async function CasesPage({ searchParams }: { searchParams: Promise<{ tab?: string; shipper?: string }> }) {
  const [{ tab, shipper }, cases, shippers] = await Promise.all([searchParams, getCases(), getShippers()]);
  const initialTab = TABS.includes(tab as Tab) ? (tab as Tab) : "all";
  const initialShipperId = shippers.some((s) => s.id === shipper) ? shipper! : "all";
  return (
    <Page crumbs={[{ label: "업무 건" }]}>
      <PageTitle title="업무 건" description="B/L 없는 국내 운송·통관 건까지 한 목록에" />
      <CaseList
        key={`${initialTab}-${initialShipperId}`}
        cases={cases}
        shippers={shippers.map((s) => ({ id: s.id, name: s.name }))}
        initialTab={initialTab}
        initialShipperId={initialShipperId}
      />
    </Page>
  );
}
