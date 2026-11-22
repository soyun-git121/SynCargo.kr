import { OwnerSidebar } from "@/components/app/owner-sidebar";
import { getOwnerUser } from "@syncargo/backend/data";

/** 대표 화면 (R-01 ~ R-12). 관리자 모드(/owner/admin/*)는 같은 틀에 어두운 사이드바. */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getOwnerUser();
  return (
    <>
      <OwnerSidebar user={user} />
      <div className="min-h-screen pl-60">
        <main className="mx-auto max-w-[1200px]">{children}</main>
      </div>
    </>
  );
}
