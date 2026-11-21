import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getCase, getCurrentUser } from "@/lib/data";
import { NO_CODE_LABEL } from "@/lib/labels";
import { CaseDetailView } from "./case-detail-view";

/** W-05 건 상세 */
export default async function CaseDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [detail, user] = await Promise.all([getCase(code), getCurrentUser()]);
  if (!detail) notFound();

  const itemIdByMail: Record<string, string> = {};
  for (const x of detail.extractedItems) itemIdByMail[x.evidence.mailId] ??= x.id;

  return (
    <Page crumbs={[{ label: "업무 건", href: "/cases" }, { label: detail.case.code ?? NO_CODE_LABEL }]}>
      <CaseDetailView detail={detail} itemIdByMail={itemIdByMail} userId={user.id} />
    </Page>
  );
}
