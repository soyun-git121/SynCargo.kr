import { Page } from "@/components/app/page-header";
import { HandoverSteps } from "@/components/app/handover-steps";
import { getCurrentUser, getHandoverPreview, getUsers } from "@syncargo/backend/data";
import type { HandoverReason } from "@syncargo/backend/types";
import { HANDOVER_REASON_LABEL } from "@/lib/labels";
import { HandoverPreview } from "../../handover-preview";

/** W-09 인계 미리보기 (W-08에서 고른 화주 · 받는 사람 · 사유 · 기간) */
export default async function HandoverPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ shippers?: string; to?: string; reason?: string; period?: string; cases?: string }>;
}) {
  const q = await searchParams;
  const shipperIds = (q.shippers ?? "").split(",").filter(Boolean);
  const caseIds = q.cases ? new Set(q.cases.split(",")) : null;
  const [preview, users, me] = await Promise.all([getHandoverPreview(shipperIds), getUsers(), getCurrentUser()]);
  // 일부 건만 고른 경우 그 건만
  const shippers = caseIds ? preview.map((p) => ({ ...p, cases: p.cases.filter((c) => caseIds.has(c.id)) })) : preview;
  const to = users.find((u) => u.id === q.to) ?? null;
  const reason: HandoverReason = q.reason && q.reason in HANDOVER_REASON_LABEL ? (q.reason as HandoverReason) : "vacation";

  return (
    <Page crumbs={[{ label: "인계", href: "/handover" }, { label: "인계 미리보기" }]}>
      <HandoverSteps current={2} />
      <HandoverPreview
        mode={{
          kind: "draft",
          draft: { shippers: shipperIds, to: q.to, reason: q.reason, period: q.period, cases: q.cases?.split(",") },
        }}
        fromName={me.name}
        toUserId={to?.id ?? null}
        toName={to?.name ?? null}
        reason={reason}
        period={reason === "vacation" ? (q.period ?? null) : null}
        shippers={shippers}
      />
    </Page>
  );
}
