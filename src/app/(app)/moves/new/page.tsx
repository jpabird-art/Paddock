import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HorseMoveForm } from "@/components/moves/HorseMoveForm";

export default async function NewMovePage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    redirect("/moves");
  }

  const [horses, locations] = await Promise.all([
    prisma.horse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, regimentalNumber: true, squadron: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Horse Move</h1>
        <p className="text-sm text-gray-500 mt-0.5">Log a horse movement between locations</p>
      </div>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <HorseMoveForm mode="create" horses={horses} locations={locations} />
      </div>
    </div>
  );
}
