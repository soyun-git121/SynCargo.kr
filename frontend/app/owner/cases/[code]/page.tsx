import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getCase } from "@syncargo/backend/data";
import { NO_CODE_LABEL } from "@/lib/labels";
import { OwnerCaseView } from "./owner-case-view";

/** R-06 건 상세 (대표 · 열람): 요약 + 근거 문장만, 원문은 담당자가 공유할 때만 · 입력·수정 버튼 없음 */
export default async function OwnerCasePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const detail = await getCase(code);
  if (!detail) notFound();
  return (
    <Page owner crumbs={[{ label: "업무 건", href: "/owner/cases" }, { label: detail.case.code ?? NO_CODE_LABEL }]}>
      <OwnerCaseView detail={detail} />
    </Page>
  );
}
