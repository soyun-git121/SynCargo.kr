import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/app/card";
import { CaseCode } from "@/components/app/case-code";
import { DdayBadge } from "@/components/app/dday-badge";
import { PageHeader } from "@/components/app/page-header";
import { ProgressSteps } from "@/components/app/progress-steps";
import { StatusPill } from "@/components/app/status-pill";
import { Timeline } from "@/components/app/timeline";
import { getCase } from "@/lib/data";

/**
 * 임시 화면: 1단계(공통 부품) 확인용 미리보기.
 * 다음 단계에서 Figma W-01 홈으로 교체한다.
 */
export default async function HomePage() {
  const detail = await getCase("SC-2611-014");

  return (
    <>
      <PageHeader title="공통 부품 미리보기" description="1단계 확인용 임시 화면 — 다음 단계에서 W-01 홈으로 교체" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="상태 배지 · D-day · 건 번호" />
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill status="needs_check" />
              <StatusPill status="awaiting_reply" />
              <StatusPill status="in_progress" />
              <StatusPill status="done" />
              <StatusPill status="done" label="확정" />
            </div>
            <div className="flex flex-wrap gap-2">
              <DdayBadge date="2026-11-16" />
              <DdayBadge date="2026-11-18" />
              <DdayBadge date="2026-11-20" />
              <DdayBadge date="2026-11-25" />
              <DdayBadge date="2026-11-12" />
            </div>
            <CaseCode code="SC-2611-014" href="/cases/SC-2611-014" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="버튼" />
          <CardBody className="flex flex-wrap gap-2">
            <Button>확정</Button>
            <Button variant="outline">다른 건으로 연결</Button>
            <Button variant="ghost">취소</Button>
            <Button size="lg">메일 연결하기</Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="5단계 진행 바" />
          <CardBody className="space-y-6">
            <ProgressSteps stage="docs" />
            <ProgressSteps stage="shipping" size="sm" />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="타임라인 (SC-2611-014 mock 데이터)" />
          <CardBody>
            <Timeline
              entries={(detail?.events ?? []).map((e) => ({
                id: e.id,
                type: e.type,
                title: e.title,
                description: e.description,
                at: e.at,
                href: e.mailId ? `/mails/${e.mailId}` : undefined,
              }))}
            />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
