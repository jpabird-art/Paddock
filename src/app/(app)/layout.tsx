import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { getSiteConfig } from "@/lib/site-config";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const { orgName } = getSiteConfig();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-brand-mist overflow-hidden">
      <MobileNav user={session.user} orgName={orgName} />
      <Sidebar user={session.user} orgName={orgName} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
          {process.env.PADDOCK_DEMO === "true" && <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">Demonstration Paddock — all sample people, horses and activity are fictional.</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
