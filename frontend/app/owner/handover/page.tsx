import { Page } from "@/components/app/page-header";
import { getAllHandovers } from "@syncargo/backend/data";
import { OwnerHandoverStatus } from "./owner-handover-status";

/** R-07 인계 현황: 담당자가 없는 인계를 맨 위 경고로 · 행마다 바로 할 일 버튼 · 사유를 태그로 */
export default async function OwnerHandoverPage() {
  const handovers = await getAllHandovers();
  return (
    <Page owner crumbs={[{ label: "인계", href: "/owner/handover" }, { label: "인계 현황" }]}>
      <OwnerHandoverStatus handovers={handovers} />
    </Page>
  );
}
