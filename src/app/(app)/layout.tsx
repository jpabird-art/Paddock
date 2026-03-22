import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden">
      <MobileNav user={session.user} />
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
