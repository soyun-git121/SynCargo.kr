"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ListItem } from "@/components/app/card";
import { Pill } from "@/components/app/status-pill";
import { useDemoState } from "@/lib/demo-state";
import { reviewHref } from "@/lib/links";
import { StatTile } from "./stat-tile";

/** 홈 통계: 검토함 (검토함에서 확정하면 숫자가 바로 줄어든다) */
export function ReviewStat() {
  const { openReviewCount, openLinkCheckCount, openUnclassifiedCount } = useDemoState();
  return (
    <StatTile
      label="검토함"
      value={openReviewCount}
      sub={`연결 확인 ${openLinkCheckCount} · 미분류 ${openUnclassifiedCount}`}
      href="/review"
    />
  );
}

/** 홈 오른쪽: 검토함 카드 */
export function ReviewCard() {
  const { openReviewCount, openLinkCheckCount, openUnclassifiedCount } = useDemoState();
  return (
    <Card className="flex flex-col gap-1">
      <CardHeader
        title="검토함"
        description={openReviewCount > 0 ? `확인할 것 ${openReviewCount}건` : "확인할 것이 없어요"}
      />
      <Link href={reviewHref("links")} className="block">
        <ListItem
          title="연결 확인"
          subtitle="어느 화주·건인지 애매한 메일"
          action={<Pill tone={openLinkCheckCount > 0 ? "red" : "gray"}>{openLinkCheckCount}건</Pill>}
        />
      </Link>
      <Link href={reviewHref("unclassified")} className="block">
        <ListItem
          title="미분류 메일"
          subtitle="어느 건에도 붙지 않은 메일"
          action={<Pill tone="gray">{openUnclassifiedCount}건</Pill>}
        />
      </Link>
      <Button asChild className="mt-1 w-full">
        <Link href="/review">검토함으로 이동 →</Link>
      </Button>
    </Card>
  );
}
