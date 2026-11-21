"use client";

/**
 * 시연용 클라이언트 상태. 새로고침하면 초기화된다(의도된 동작).
 * 검토 확정, 화주 메모 저장, 반복 조건 "맞아요", 메일 밖 정보 입력을 여기서만 처리한다.
 * 나중에 서버 저장으로 바꿀 때는 각 액션을 Server Action / API 호출로 교체한다.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CorrectionLog, OffMailInfo, ReviewItem } from "./types";

export type ReviewDecision =
  | { kind: "link"; shipperId: string; caseId: string | null }
  | { kind: "new_case"; shipperName: string }
  | { kind: "exclude" };

/** 이번 세션에서 사람이 고친 기록 (검토함 > 수정 이력 맨 위에 붙음) */
export type LocalCorrection = Omit<CorrectionLog, "companyId" | "correctedBy"> & { correctedByName: string };

type OpenReview = { id: string; type: ReviewItem["type"] };

interface DemoState {
  openReviews: OpenReview[];
  openReviewCount: number;
  openLinkCheckCount: number;
  openUnclassifiedCount: number;
  reviewDecisions: Record<string, ReviewDecision>;
  resolveReview: (id: string, decision: ReviewDecision, correction?: Omit<LocalCorrection, "id" | "correctedAt">) => void;

  shipperMemos: Record<string, { text: string; savedAt: string }>;
  saveShipperMemo: (shipperId: string, text: string) => void;

  confirmedPatternIds: string[];
  confirmPattern: (patternId: string, correction: Omit<LocalCorrection, "id" | "correctedAt">) => void;

  addedOffMail: OffMailInfo[];
  addOffMail: (info: Omit<OffMailInfo, "id" | "createdAt">) => void;

  localCorrections: LocalCorrection[];
}

const Ctx = createContext<DemoState | null>(null);

/** 데모 시각: 기준일 2026-11-16 + 현재 시:분 */
export function demoNow(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `2026-11-16T${hh}:${mm}:00+09:00`;
}

export function DemoStateProvider({
  initialOpenReviews,
  children,
}: {
  initialOpenReviews: OpenReview[];
  children: React.ReactNode;
}) {
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewDecision>>({});
  const [shipperMemos, setShipperMemos] = useState<DemoState["shipperMemos"]>({});
  const [confirmedPatternIds, setConfirmedPatternIds] = useState<string[]>([]);
  const [addedOffMail, setAddedOffMail] = useState<OffMailInfo[]>([]);
  const [localCorrections, setLocalCorrections] = useState<LocalCorrection[]>([]);

  const pushCorrection = useCallback((c: Omit<LocalCorrection, "id" | "correctedAt">) => {
    setLocalCorrections((prev) => [{ ...c, id: `local-${Date.now()}`, correctedAt: demoNow() }, ...prev]);
  }, []);

  const resolveReview = useCallback<DemoState["resolveReview"]>(
    (id, decision, correction) => {
      setReviewDecisions((prev) => ({ ...prev, [id]: decision }));
      if (correction) pushCorrection(correction);
    },
    [pushCorrection],
  );

  const saveShipperMemo = useCallback((shipperId: string, text: string) => {
    setShipperMemos((prev) => ({ ...prev, [shipperId]: { text, savedAt: demoNow() } }));
  }, []);

  const confirmPattern = useCallback<DemoState["confirmPattern"]>(
    (patternId, correction) => {
      setConfirmedPatternIds((prev) => (prev.includes(patternId) ? prev : [...prev, patternId]));
      pushCorrection(correction);
    },
    [pushCorrection],
  );

  const addOffMail = useCallback((info: Omit<OffMailInfo, "id" | "createdAt">) => {
    setAddedOffMail((prev) => [{ ...info, id: `local-o-${Date.now()}`, createdAt: demoNow() }, ...prev]);
  }, []);

  const value = useMemo<DemoState>(() => {
    const openReviews = initialOpenReviews.filter((r) => !reviewDecisions[r.id]);
    return {
      openReviews,
      openReviewCount: openReviews.length,
      openLinkCheckCount: openReviews.filter((r) => r.type === "link_check").length,
      openUnclassifiedCount: openReviews.filter((r) => r.type === "unclassified").length,
      reviewDecisions,
      resolveReview,
      shipperMemos,
      saveShipperMemo,
      confirmedPatternIds,
      confirmPattern,
      addedOffMail,
      addOffMail,
      localCorrections,
    };
  }, [
    initialOpenReviews,
    reviewDecisions,
    resolveReview,
    shipperMemos,
    saveShipperMemo,
    confirmedPatternIds,
    confirmPattern,
    addedOffMail,
    addOffMail,
    localCorrections,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoState(): DemoState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoState must be used inside <DemoStateProvider>");
  return v;
}
