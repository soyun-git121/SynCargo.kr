import { Page } from "@/components/app/page-header";
import { getCompanyMailScope, getMembers, getOwnerUser } from "@syncargo/backend/data";
import { AdminNotice } from "../admin-notice";
import { MembersAdmin } from "./members-admin";

/** R-11 관리 · 구성원·권한: 구성원마다 관리 버튼 · 퇴사자는 비활성화 권장 · 삭제는 담당 화주 인계 뒤 · 메일 원문 열람 기준 */
export default async function AdminMembersPage() {
  const [members, me, scope] = await Promise.all([getMembers(), getOwnerUser(), getCompanyMailScope()]);
  return (
    <Page owner crumbs={[{ label: "관리자 모드" }, { label: "구성원·권한" }]}>
      <AdminNotice />
      <MembersAdmin members={members} meId={me.id} initialMailAccess={scope.settings.ceoMailAccess} />
    </Page>
  );
}
