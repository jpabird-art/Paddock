import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const dutyHistory = await prisma.dutyAssignment.findMany({
    where: { horseId: id },
    include: {
      assignedBy: { select: { id: true, name: true, serviceNumber: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(dutyHistory);
}
