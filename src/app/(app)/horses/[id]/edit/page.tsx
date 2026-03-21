import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { HorseForm } from "@/components/horses/HorseForm";

export default async function EditHorsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const { can: canFn } = await import("@/lib/permissions");
  if (!session || !canFn(session.user.role, "horse", "update")) {
    redirect("/dashboard");
  }

  const [horse, locations] = await Promise.all([
    prisma.horse.findUnique({ where: { id } }),
    prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!horse) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Horse — {horse.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Update regimental details for {horse.regimentalNumber}
        </p>
      </div>
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <HorseForm
          mode="edit"
          locations={locations}
          initialData={{
            id: horse.id,
            name: horse.name,
            regimentalNumber: horse.regimentalNumber,
            breed: horse.breed,
            colour: horse.colour,
            dateOfBirth: horse.dateOfBirth.toISOString(),
            serviceEntryDate: horse.serviceEntryDate.toISOString(),
            heightHands: horse.heightHands,
            weightKg: horse.weightKg,
            maxRiderWeightKg: horse.maxRiderWeightKg,
            squadron: horse.squadron ?? undefined,
            dutyStation: horse.dutyStation,
          }}
        />
      </div>
    </div>
  );
}
