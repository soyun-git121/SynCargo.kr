import { Construction } from "lucide-react";
import { Card } from "./card";
import { PageHeader } from "./page-header";

/** 이번 범위 밖 화면 */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-neutral-soft text-neutral">
          <Construction className="size-5" />
        </span>
        <p className="text-base font-semibold">준비 중입니다</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {description ?? "이 화면은 다음 단계에서 제공됩니다."}
        </p>
      </Card>
    </>
  );
}
