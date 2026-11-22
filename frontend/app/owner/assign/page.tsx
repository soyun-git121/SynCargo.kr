import { notFound } from "next/navigation";
import { Page } from "@/components/app/page-header";
import { getAllHandovers, getAssignContext, getOwnersWithShippers } from "@syncargo/backend/data";
import { AssignView } from "./assign-view";

/**
 * R-09 담당자 지정: 아직 배정 안 된 화주를 강조 · 배정 후 담당자별 화주 수를 미리 보여 줘 한쪽 쏠림 방지.
 * ?from=u1&shipper=s1 → 화주 카드(R-03)에서 들어옴: 그 화주와 현재 담당자가 미리 선택된 상태.
 */
export default async function OwnerAssignPage({ searchParams }: { searchParams: Promise<{ from?: string; shipper?: string }> }) {
  const [q, owners, handovers] = await Promise.all([searchParams, getOwnersWithShippers(), getAllHandovers()]);
  // 기본: 퇴사 예정자 → 없으면 첫 번째 담당자
  const fromId = q.from && owners.some((o) => o.id === q.from) ? q.from : (owners.find((o) => o.leavingAt)?.id ?? owners[0]?.id);
  if (!fromId) notFound();
  const ctx = await getAssignContext(fromId);
  if (!ctx) notFound();
  const handover = handovers.find((h) => h.fromUserId === fromId && !h.toUserId && h.status === "requested") ?? null;

  return (
    <Page owner crumbs={[{ label: "인계", href: "/owner/handover" }, { label: "담당자 지정" }]}>
      <AssignView
        key={`${fromId}-${q.shipper ?? ""}`}
        ctx={ctx}
        owners={owners}
        focusShipperId={q.shipper && ctx.shippers.some((s) => s.id === q.shipper) ? q.shipper : null}
        handoverId={handover?.id ?? null}
      />
    </Page>
  );
}
