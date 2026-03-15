import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  const { error } = await requireRole("ADMIN", "VET", "OFFICER");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;

  const injuries = await prisma.injuryReport.findMany({
    where,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true, dutyStation: true } },
      reportedBy: { select: { name: true, serviceNumber: true } },
      resolvedBy: { select: { name: true, serviceNumber: true } },
    },
    orderBy: { reportedAt: "desc" },
  });

  return NextResponse.json(injuries);
}
