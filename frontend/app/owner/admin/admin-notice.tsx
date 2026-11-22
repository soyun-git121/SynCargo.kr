/** 관리자 모드 상단 노란 안내 (R-10 ~ R-12 공통) */
export function AdminNotice() {
  return (
    <p className="rounded-lg bg-warning-soft px-3 py-2.5 text-[13px] font-medium text-warning">
      관리자 모드예요 · 여기서 바꾼 설정은 회사 전체에 바로 적용되고, 누가 언제 바꿨는지 기록이 남아요
    </p>
  );
}
