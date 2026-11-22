import { Page, PageTitle } from "@/components/app/page-header";
import { getCompanyMailScope } from "@syncargo/backend/data";
import { AdminNotice } from "../admin-notice";
import { MailScopeEditor } from "./mail-scope-editor";

/** R-10 관리 · 메일 연결 범위: 저장하면 실무자 W-15(사서함·기간 범위)에 바로 반영 */
export default async function AdminMailPage() {
  const scope = await getCompanyMailScope();
  return (
    <Page owner crumbs={[{ label: "관리자 모드" }, { label: "메일 연결 범위" }]}>
      <AdminNotice />
      <PageTitle title="메일 연결 범위" description="어느 사서함을 언제부터 읽을지 정해요" />
      <MailScopeEditor scope={scope} />
    </Page>
  );
}
