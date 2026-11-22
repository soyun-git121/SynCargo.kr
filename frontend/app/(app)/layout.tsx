import { Sidebar } from "@/components/app/sidebar";
import { getCurrentUser, getOpenReviews } from "@syncargo/backend/data";
import { DemoStateProvider } from "@/lib/demo-state";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, openReviews] = await Promise.all([getCurrentUser(), getOpenReviews()]);

  return (
    <DemoStateProvider initialOpenReviews={openReviews}>
      <Sidebar user={user} />
      <div className="min-h-screen pl-60">
        <main className="mx-auto max-w-[1200px]">{children}</main>
      </div>
    </DemoStateProvider>
  );
}
