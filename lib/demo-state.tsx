"use client";

/**
 * 시연용 클라이언트 상태. 새로고침하면 초기화된다(의도된 동작).
 * 검토 확정, 메모 저장, 반복 조건 "맞아요", 메일 밖 정보 추가 등을 여기서만 처리한다.
 * 나중에 서버 저장으로 바꿀 때는 각 액션을 Server Action / API 호출로 교체한다.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { OffMailInfo, ShipperPattern } from "./types";

export type ReviewDecision =
  | { kind: "link"; caseId: string }
  | { kind: "ignore" }
  | { kind: "new_shipper"; shipperName: string };

export interface LocalCorrection {
  id: string;
  label: string;
  before: string;
  after: string;
  correctedAt: string;
}

interface DemoState {
  /** 서버에서 받은 열린 검토 항목 중 아직 확정 안 된 것 */
  openReviewIds: string[];
  openReviewCount: number;
  reviewDecisions: Record<string, ReviewDecision>;
  resolveReview: (id: string, decision: ReviewDecision, correction?: Omit<LocalCorrection, "id" | "correctedAt">) => void;

  caseNotes: Record<string, string>;
  setCaseNote: (caseId: string, note: string) => void;

  patternStatus: Record<string, ShipperPattern["status"]>;
  setPatternStatus: (patternId: string, status: ShipperPattern["status"]) => void;

  addedOffMail: OffMailInfo[];
  addOffMail: (info: Omit<OffMailInfo, "id" | "createdAt">) => void;

  localCorrections: LocalCorrection[];
}

const Ctx = createContext<DemoState | null>(null);

/** 데모 시각: 기준일 2026-11-16 + 현재 시:분 */
function demoNow(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `2026-11-16T${hh}:${mm}:00+09:00`;
}

export function DemoStateProvider({
  initialOpenReviewIds,
  children,
}: {
  initialOpenReviewIds: string[];
  children: React.ReactNode;
}) {
  const [reviewDecisions, setReviewDecisions] = useState<Record<string, ReviewDecision>>({});
  const [caseNotes, setCaseNotes] = useState<Record<string, string>>({});
  const [patternStatus, setPatternStatusMap] = useState<Record<string, ShipperPattern["status"]>>({});
  const [addedOffMail, setAddedOffMail] = useState<OffMailInfo[]>([]);
  const [localCorrections, setLocalCorrections] = useState<LocalCorrection[]>([]);

  const resolveReview = useCallback<DemoState["resolveReview"]>((id, decision, correction) => {
    setReviewDecisions((prev) => ({ ...prev, [id]: decision }));
    if (correction) {
      setLocalCorrections((prev) => [
        { ...correction, id: `local-${id}-${Date.now()}`, correctedAt: demoNow() },
        ...prev,
      ]);
    }
  }, []);

  const setCaseNote = useCallback((caseId: string, note: string) => {
    setCaseNotes((prev) => ({ ...prev, [caseId]: note }));
  }, []);

  const setPatternStatus = useCallback((patternId: string, status: ShipperPattern["status"]) => {
    setPatternStatusMap((prev) => ({ ...prev, [patternId]: status }));
  }, []);

  const addOffMail = useCallback((info: Omit<OffMailInfo, "id" | "createdAt">) => {
    setAddedOffMail((prev) => [{ ...info, id: `local-o-${Date.now()}`, createdAt: demoNow() }, ...prev]);
  }, []);

  const value = useMemo<DemoState>(() => {
    const openReviewIds = initialOpenReviewIds.filter((id) => !reviewDecisions[id]);
    return {
      openReviewIds,
      openReviewCount: openReviewIds.length,
      reviewDecisions,
      resolveReview,
      caseNotes,
      setCaseNote,
      patternStatus,
      setPatternStatus,
      addedOffMail,
      addOffMail,
      localCorrections,
    };
  }, [
    initialOpenReviewIds,
    reviewDecisions,
    resolveReview,
    caseNotes,
    setCaseNote,
    patternStatus,
    setPatternStatus,
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
