import { Page, PageTitle } from "@/components/app/page-header";
import { getBlockedCases } from "@syncargo/backend/data";
import { BlockedCaseList } from "./blocked-case-list";

/** R-05 막혀 있는 건: 오래 멈춘 순 · 멈춘 기간을 막대로 · 막힌 이유를 상태 색으로 · 퇴사 예정자 건은 바로 경고 */
export default async function OwnerCasesPage() {
  const cases = await getBlockedCases();
  return (
    <Page owner crumbs={[{ label: "업무 건", href: "/owner/cases" }, { label: "막혀 있는 건" }]}>
      <PageTitle title="막혀 있는 건" description="답변·승인 대기, 확인 필요 상태인 건 · 감시가 아니라 도와줄 곳을 찾는 화면" />
      <BlockedCaseList cases={cases} />
    </Page>
  );
}
