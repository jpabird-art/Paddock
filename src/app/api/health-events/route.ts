import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { error } = await requireRole();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const events = await prisma.healthEvent.findMany({
    where,
    include: {
      horse: {
        select: { id: true, name: true, regimentalNumber: true, dutyStation: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(events);
}
