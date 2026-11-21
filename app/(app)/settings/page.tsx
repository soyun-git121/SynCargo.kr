import { Page } from "@/components/app/page-header";
import { getMailboxConnection } from "@/lib/data";
import { SettingsView } from "./settings-view";

/** W-11 설정 · 메일 연결 */
export default async function SettingsPage() {
  const mailbox = await getMailboxConnection();
  return (
    <Page crumbs={[{ label: "설정" }, { label: "메일 연결" }]}>
      <SettingsView mailbox={mailbox} />
    </Page>
  );
}
