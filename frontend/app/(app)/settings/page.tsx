import { Page } from "@/components/app/page-header";
import { getMailboxConnection, getMailScope, getMembers } from "@syncargo/backend/data";
import { SettingsView, type SettingsTab } from "./settings-view";

const TAB_LABEL: Record<SettingsTab, string> = {
  mail: "메일 연결",
  scope: "사서함·기간 범위",
  members: "구성원·권한",
};

/** W-11 메일 연결 · W-15 사서함·기간 범위 · W-16 구성원·권한 (?tab=scope|members) */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ tab: tabParam }, mailbox, scope, members] = await Promise.all([
    searchParams,
    getMailboxConnection(),
    getMailScope(),
    getMembers(),
  ]);
  const tab: SettingsTab = tabParam === "scope" || tabParam === "members" ? tabParam : "mail";
  return (
    <Page crumbs={[{ label: "설정", href: "/settings" }, { label: TAB_LABEL[tab] }]}>
      <SettingsView tab={tab} mailbox={mailbox} scope={scope} members={members} />
    </Page>
  );
}
