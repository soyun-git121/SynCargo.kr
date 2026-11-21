import { Sidebar } from "@/components/app/sidebar";
import { TopBar } from "@/components/app/top-bar";
import { getCurrentUser, getOpenReviewIds } from "@/lib/data";
import { DemoStateProvider } from "@/lib/demo-state";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, openReviewIds] = await Promise.all([getCurrentUser(), getOpenReviewIds()]);

  return (
    <DemoStateProvider initialOpenReviewIds={openReviewIds}>
      <Sidebar user={user} />
      <div className="min-h-screen pl-60">
        <TopBar />
        <main className="mx-auto max-w-[1200px] px-8 py-8">{children}</main>
      </div>
    </DemoStateProvider>
  );
}
