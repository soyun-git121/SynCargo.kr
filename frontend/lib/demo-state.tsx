"use client";

/**
 * 시연용 클라이언트 상태. 새로고침하면 초기화된다(의도된 동작).
 * 검토 확정, 화주 메모 저장, 반복 조건 "맞아요", 메일 밖 정보 입력을 여기서만 처리한다.
 * 나중에 서버 저장으로 바꿀 때는 각 액션을 Server Action / API 호출로 교체한다.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CorrectionLog, HandoverReason, OffMailInfo, ReviewItem } from "@syncargo/backend/types";

export type ReviewDecision =
  | { kind: "link"; shipperId: string; caseId: string | null }
  | { kind: "new_case"; shipperName: string }
  | { kind: "exclude" };

/** 이번 세션에서 사람이 고친 기록 (검토함 > 수정 이력 맨 위에 붙음) */
export type LocalCorrection = Omit<CorrectionLog, "companyId" | "correctedBy"> & { correctedByName: string };

type OpenReview = { id: string; type: ReviewItem["type"] };

/** 이번 세션에서 '인계 요청'을 누른 인계 (W-12 보낸 인계 맨 위, 대표 R-07에 승인 대기로 보임) */
export interface LocalHandover {
  id: string;
  fromName: string;
  toUserId: string;
  toName: string;
  shipperIds: string[];
  shipperNames: string[];
  caseIds: string[];
  reason: HandoverReason;
  periodStart: string;
  periodEnd: string | null;
  requestedAt: string;
}

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
  /** 반복 조건 문구 수정 (id → 새 문구) */
  patternTexts: Record<string, string>;
  /** 직접 추가한 반복 조건 */
  addedPatterns: { id: string; shipperId: string; text: string; createdAt: string }[];
  savePattern: (
    p: { id?: string; shipperId: string; text: string },
    correction: Omit<LocalCorrection, "id" | "correctedAt">,
  ) => void;
  confirmPattern: (patternId: string, correction: Omit<LocalCorrection, "id" | "correctedAt">) => void;

  /** 화주 변경 이력 중 확정한 항목 + 고친 '바뀐 값' (id → 값) */
  confirmedChangeIds: string[];
  changeAfter: Record<string, string>;
  confirmChange: (changeId: string, after: string | null, correction: Omit<LocalCorrection, "id" | "correctedAt">) => void;

  /** 이번 세션에서 입력·수정한 메일 밖 정보 (id 기준으로 서버 값을 덮어씀) */
  savedOffMail: Record<string, OffMailInfo>;
  saveOffMail: (info: Omit<OffMailInfo, "id" | "createdAt"> & { id?: string; createdAt?: string }) => void;

  /** 인계 */
  localHandovers: LocalHandover[];
  requestHandover: (h: Omit<LocalHandover, "id" | "requestedAt">) => string;
  /** 대표가 승인한 인계 id → 승인 시각 */
  approvedHandovers: Record<string, string>;
  approveHandover: (id: string) => void;
  /** 대표가 담당자를 지정한 인계·화주 (key → 사용자 id) */
  assignedOwners: Record<string, string>;
  assignOwner: (key: string, userId: string) => void;
  /** 인계 '중요 사항 · 챙길 일': 체크 · 문구 수정 · 직접 추가 */
  handoverNoteDone: Record<string, boolean>;
  toggleHandoverNote: (id: string) => void;
  handoverNoteTexts: Record<string, string>;
  addedHandoverNotes: { id: string; shipperId: string; title: string }[];
  saveHandoverNote: (n: { id?: string; shipperId: string; title: string }) => void;
  /** 인계 화주 요약 수정 (화주 id → 문구) */
  handoverSummaries: Record<string, string>;
  saveHandoverSummary: (shipperId: string, text: string) => void;

  /** 메일 읽기 범위: 관리자 모드(R-10)에서 바꾼 허용 여부 → 실무자 W-15에 바로 반영 */
  mailboxAllowed: Record<string, boolean>;
  companySyncFrom: string | null;
  saveCompanyMailScope: (allowed: Record<string, boolean>, syncFrom: string) => void;
  /** W-15 '저장하고 홈으로' → 연결 순서 3단계 완료 */
  mailSetupDone: boolean;
  finishMailSetup: () => void;

  localCorrections: LocalCorrection[];
  /** 값 수정 등 사람이 고친 내용을 수정 이력에 남김 */
  addCorrection: (c: Omit<LocalCorrection, "id" | "correctedAt">) => void;
  /** 원문 보기에서 고친 추출 값 (itemId → 새 값) */
  editedValues: Record<string, string>;
  editValue: (itemId: string, value: string, correction: Omit<LocalCorrection, "id" | "correctedAt">) => void;
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
  const [savedOffMail, setSavedOffMail] = useState<Record<string, OffMailInfo>>({});
  const [localCorrections, setLocalCorrections] = useState<LocalCorrection[]>([]);

  const pushCorrection = useCallback((c: Omit<LocalCorrection, "id" | "correctedAt">) => {
    setLocalCorrections((prev) => [{ ...c, id: `local-${Date.now()}`, correctedAt: demoNow() }, ...prev]);
  }, []);

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const editValue = useCallback<DemoState["editValue"]>(
    (itemId, v, correction) => {
      setEditedValues((prev) => ({ ...prev, [itemId]: v }));
      pushCorrection(correction);
    },
    [pushCorrection],
  );

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

  const [patternTexts, setPatternTexts] = useState<Record<string, string>>({});
  const [addedPatterns, setAddedPatterns] = useState<DemoState["addedPatterns"]>([]);
  const savePattern = useCallback<DemoState["savePattern"]>(
    (p, correction) => {
      if (p.id) {
        const id = p.id;
        setPatternTexts((prev) => ({ ...prev, [id]: p.text }));
        setConfirmedPatternIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      } else {
        setAddedPatterns((prev) => [...prev, { id: `local-p-${Date.now()}`, shipperId: p.shipperId, text: p.text, createdAt: demoNow() }]);
      }
      pushCorrection(correction);
    },
    [pushCorrection],
  );

  const confirmPattern = useCallback<DemoState["confirmPattern"]>(
    (patternId, correction) => {
      setConfirmedPatternIds((prev) => (prev.includes(patternId) ? prev : [...prev, patternId]));
      pushCorrection(correction);
    },
    [pushCorrection],
  );

  const [confirmedChangeIds, setConfirmedChangeIds] = useState<string[]>([]);
  const [changeAfter, setChangeAfter] = useState<Record<string, string>>({});
  const confirmChange = useCallback<DemoState["confirmChange"]>(
    (changeId, after, correction) => {
      setConfirmedChangeIds((prev) => (prev.includes(changeId) ? prev : [...prev, changeId]));
      if (after !== null) setChangeAfter((prev) => ({ ...prev, [changeId]: after }));
      pushCorrection(correction);
    },
    [pushCorrection],
  );

  const [localHandovers, setLocalHandovers] = useState<LocalHandover[]>([]);
  const requestHandover = useCallback<DemoState["requestHandover"]>((h) => {
    const id = `local-h-${Date.now()}`;
    setLocalHandovers((prev) => [{ ...h, id, requestedAt: demoNow() }, ...prev]);
    return id;
  }, []);
  const [approvedHandovers, setApprovedHandovers] = useState<Record<string, string>>({});
  const approveHandover = useCallback((id: string) => setApprovedHandovers((prev) => ({ ...prev, [id]: demoNow() })), []);
  const [assignedOwners, setAssignedOwners] = useState<Record<string, string>>({});
  const assignOwner = useCallback((key: string, userId: string) => setAssignedOwners((prev) => ({ ...prev, [key]: userId })), []);
  const [handoverNoteDone, setHandoverNoteDone] = useState<Record<string, boolean>>({});
  const toggleHandoverNote = useCallback((id: string) => setHandoverNoteDone((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const [handoverNoteTexts, setHandoverNoteTexts] = useState<Record<string, string>>({});
  const [addedHandoverNotes, setAddedHandoverNotes] = useState<DemoState["addedHandoverNotes"]>([]);
  const saveHandoverNote = useCallback<DemoState["saveHandoverNote"]>((n) => {
    if (n.id) {
      const id = n.id;
      setHandoverNoteTexts((prev) => ({ ...prev, [id]: n.title }));
    } else {
      setAddedHandoverNotes((prev) => [...prev, { id: `local-n-${Date.now()}`, shipperId: n.shipperId, title: n.title }]);
    }
  }, []);
  const [handoverSummaries, setHandoverSummaries] = useState<Record<string, string>>({});
  const saveHandoverSummary = useCallback(
    (shipperId: string, text: string) => setHandoverSummaries((prev) => ({ ...prev, [shipperId]: text })),
    [],
  );

  const [mailboxAllowed, setMailboxAllowed] = useState<Record<string, boolean>>({});
  const [companySyncFrom, setCompanySyncFrom] = useState<string | null>(null);
  const saveCompanyMailScope = useCallback((allowed: Record<string, boolean>, syncFrom: string) => {
    setMailboxAllowed(allowed);
    setCompanySyncFrom(syncFrom);
  }, []);
  const [mailSetupDone, setMailSetupDone] = useState(false);
  const finishMailSetup = useCallback(() => setMailSetupDone(true), []);

  const saveOffMail = useCallback<DemoState["saveOffMail"]>((info) => {
    const id = info.id ?? `local-o-${Date.now()}`;
    setSavedOffMail((prev) => ({ ...prev, [id]: { ...info, id, createdAt: info.createdAt ?? demoNow() } }));
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
      patternTexts,
      addedPatterns,
      savePattern,
      confirmedChangeIds,
      changeAfter,
      confirmChange,
      savedOffMail,
      saveOffMail,
      localHandovers,
      requestHandover,
      approvedHandovers,
      approveHandover,
      assignedOwners,
      assignOwner,
      handoverNoteDone,
      toggleHandoverNote,
      handoverNoteTexts,
      addedHandoverNotes,
      saveHandoverNote,
      handoverSummaries,
      saveHandoverSummary,
      mailboxAllowed,
      companySyncFrom,
      saveCompanyMailScope,
      mailSetupDone,
      finishMailSetup,
      localCorrections,
      addCorrection: pushCorrection,
      editedValues,
      editValue,
    };
  }, [
    initialOpenReviews,
    reviewDecisions,
    resolveReview,
    shipperMemos,
    saveShipperMemo,
    confirmedPatternIds,
    confirmPattern,
    patternTexts,
    addedPatterns,
    savePattern,
    confirmedChangeIds,
    changeAfter,
    confirmChange,
    savedOffMail,
    saveOffMail,
    localHandovers,
    requestHandover,
    approvedHandovers,
    approveHandover,
    assignedOwners,
    assignOwner,
    handoverNoteDone,
    toggleHandoverNote,
    handoverNoteTexts,
    addedHandoverNotes,
    saveHandoverNote,
    handoverSummaries,
    saveHandoverSummary,
    mailboxAllowed,
    companySyncFrom,
    saveCompanyMailScope,
    mailSetupDone,
    finishMailSetup,
    localCorrections,
    pushCorrection,
    editedValues,
    editValue,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoState(): DemoState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemoState must be used inside <DemoStateProvider>");
  return v;
}
