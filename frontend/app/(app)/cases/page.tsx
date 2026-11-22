import { Page, PageTitle } from "@/components/app/page-header";
import { getCases, getShippers } from "@syncargo/backend/data";
import { CaseList, type Tab } from "./case-list";

const TABS: Tab[] = ["all", "in_progress", "needs_check", "awaiting_reply", "done"];

/**
 * W-04 업무 건 목록.
 * ?tab=needs_check 로 탭을, ?shipper=s1&status=done 으로 화주·완료를 미리 고를 수 있음 (화주 카드 '지난 건 보기').
 */
export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; shipper?: string; status?: string }>;
}) {
  const [{ tab, shipper, status }, cases, shippers] = await Promise.all([searchParams, getCases(), getShippers()]);
  const wanted = status === "done" ? "done" : tab;
  const initialTab = TABS.includes(wanted as Tab) ? (wanted as Tab) : "all";
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
        fromShipperCard={initialShipperId !== "all" && status !== undefined}
      />
    </Page>
  );
}
