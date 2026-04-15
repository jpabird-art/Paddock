import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RidingBoardClient } from "@/components/riding-board/RidingBoardClient";

export default async function RidingBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role;
  if (!can(role, "exercise_assignment", "view")) {
    redirect("/dashboard");
  }

  const canEdit = can(role, "exercise_assignment", "create");
  const { date } = await searchParams;

  const [horses, users] = await Promise.all([
    prisma.horse.findMany({
      where: { isActive: true },
      select: { id: true, name: true, regimentalNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, serviceNumber: true, rank: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <RidingBoardClient
      horses={horses}
      users={users}
      canEdit={canEdit}
      initialDate={date}
    />
  );
}
