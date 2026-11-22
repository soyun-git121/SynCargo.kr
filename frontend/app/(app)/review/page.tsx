import { Page } from "@/components/app/page-header";
import { getCorrectionLogs, getCurrentUser, getEvidenceRefForMail, getLinkOptions, getReviewItems, getUsers } from "@syncargo/backend/data";
import { evidenceRefHref } from "@/lib/links";
import { ReviewView, type ReviewTab } from "./review-view";

const TABS: ReviewTab[] = ["links", "unclassified", "history"];

/** W-10 확인 필요한 연결 · W-13 미분류 메일 · W-14 수정 이력 */
export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ tab?: string; item?: string }> }) {
  const [{ tab, item }, items, linkOptions, logs, users, user] = await Promise.all([
    searchParams,
    getReviewItems(),
    getLinkOptions(),
    getCorrectionLogs(),
    getUsers(),
    getCurrentUser(),
  ]);

  const evidenceHrefByMail: Record<string, string | null> = {};
  await Promise.all(items.map(async (r) => (evidenceHrefByMail[r.mail.id] = evidenceRefHref(await getEvidenceRefForMail(r.mail.id)))));

  // ?item= 이 미분류 항목이면 탭도 맞춰 준다
  const itemType = items.find((r) => r.id === item)?.type;
  const initialTab: ReviewTab = TABS.includes(tab as ReviewTab)
    ? (tab as ReviewTab)
    : itemType === "unclassified"
      ? "unclassified"
      : "links";

  return (
    <Page crumbs={[{ label: "검토함" }]}>
      <ReviewView
        key={`${initialTab}-${item ?? ""}`}
        items={items}
        linkOptions={linkOptions}
        logs={logs.map((l) => ({ ...l, evidenceHref: evidenceRefHref(l.evidence) }))}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        userName={user.name}
        initialTab={initialTab}
        initialItemId={item ?? null}
        evidenceHrefByMail={evidenceHrefByMail}
      />
    </Page>
  );
}
