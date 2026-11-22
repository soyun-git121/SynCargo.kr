import { Sidebar } from "@/components/app/sidebar";
import { getCurrentUser } from "@syncargo/backend/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Sidebar user={user} />
      <div className="min-h-screen pl-60">
        <main className="mx-auto max-w-[1200px]">{children}</main>
      </div>
    </>
  );
}
