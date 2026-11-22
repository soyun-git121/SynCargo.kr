import { Page } from "@/components/app/page-header";
import { HandoverSteps } from "@/components/app/handover-steps";
import { getAllHandovers, getHandoverPreview, getUsers } from "@syncargo/backend/data";
import { HandoverApproval } from "./handover-approval";

/** R-08 인계 요약 확인·승인: 실무자 인계 흐름의 3단계(대표 승인) · 미결·기한을 색으로 · '중요 사항 · 챙길 일'도 함께 보고 승인 */
export default async function OwnerHandoverApprovePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [all, users] = await Promise.all([getAllHandovers(), getUsers()]);
  const pending = all.filter((h) => h.status === "requested");
  const selected = all.find((h) => h.id === decodeURIComponent(id)) ?? null;
  const preview = selected ? await getHandoverPreview(selected.shipperIds, selected.id) : [];

  return (
    <Page owner crumbs={[{ label: "인계", href: "/owner/handover" }, { label: "인계 요약 확인·승인" }]}>
      <HandoverSteps current={3} />
      <HandoverApproval
        key={id}
        selectedId={decodeURIComponent(id)}
        pending={pending}
        selected={selected}
        notes={preview.flatMap((p) => p.notes)}
        receivers={users.filter((u) => u.role !== "ceo" && u.status === "active").map((u) => ({ id: u.id, name: u.name }))}
      />
    </Page>
  );
}
