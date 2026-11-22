import { Page } from "@/components/app/page-header";
import { HandoverSteps } from "@/components/app/handover-steps";
import { getCurrentUser, getHandoverCandidates, getUsers } from "@syncargo/backend/data";
import { HandoverSelect } from "./handover-select";

/** W-08 인계 대상 고르기. ?shippers=s1 로 들어오면 그 화주가 미리 선택된다 (화주 카드 '이 화주 인계'). */
export default async function HandoverNewPage({
  searchParams,
}: {
  searchParams: Promise<{ shippers?: string; to?: string; reason?: string; period?: string; cases?: string }>;
}) {
  const [q, candidates, users, me] = await Promise.all([searchParams, getHandoverCandidates(), getUsers(), getCurrentUser()]);
  const preselected = (q.shippers ?? "").split(",").filter((id) => candidates.some((c) => c.shipper.id === id));
  const receivers = users.filter((u) => u.id !== me.id && u.role === "staff").map((u) => ({ id: u.id, name: u.name }));

  return (
    <Page crumbs={[{ label: "인계", href: "/handover" }, { label: "인계 대상 고르기" }]}>
      <HandoverSteps current={1} />
      <HandoverSelect
        me={me.name}
        candidates={candidates}
        receivers={receivers}
        preselected={preselected}
        // 화주 카드에서 바로 들어온 경우만 안내 띠를 보여 준다 (대상 수정으로 돌아온 경우는 제외)
        fromShipperCard={preselected.length === 1 && !q.to}
        initial={{
          to: q.to,
          reason: q.reason,
          period: q.period,
          cases: q.cases ? q.cases.split(",") : undefined,
        }}
      />
    </Page>
  );
}
