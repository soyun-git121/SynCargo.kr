import { Card } from "./card";
import { Page, PageTitle } from "./page-header";

/** 이번 범위 밖 화면 */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <Page crumbs={[{ label: title }]}>
      <PageTitle title={title} />
      <Card className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-base font-bold">준비 중입니다</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description ?? "이 화면은 다음 단계에서 제공됩니다."}</p>
      </Card>
    </Page>
  );
}
