import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HorseForm } from "@/components/horses/HorseForm";

export default async function NewHorsePage() {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "VET", "OFFICER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Horse</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Register a new horse to the regimental fleet
        </p>
      </div>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <HorseForm mode="create" locations={locations} />
      </div>
    </div>
  );
}
