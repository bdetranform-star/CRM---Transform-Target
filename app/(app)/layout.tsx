import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Logo } from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex h-screen bg-secondary/40">
      <Sidebar logo={<Logo />} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userEmail={session?.user?.email} userName={session?.user?.name} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
