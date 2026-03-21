import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { InspectionResult } from "@prisma/client";

const createSchema = z.object({
  inspectionScheduleId: z.string().optional(),
  horseId: z.string().min(1),
  result: z.nativeEnum(InspectionResult),
  findings: z.string().optional(),
  scheduledDate: z.string().min(1),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const inspections = await prisma.inspection.findMany({
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      inspector: { select: { id: true, name: true, serviceNumber: true } },
      schedule: { select: { id: true, name: true } },
    },
    orderBy: { scheduledDate: "desc" },
  });

  return NextResponse.json(inspections);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("inspection", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const inspection = await prisma.inspection.create({
    data: {
      inspectionScheduleId: parse.data.inspectionScheduleId,
      horseId: parse.data.horseId,
      inspectorId: session!.user.id,
      result: parse.data.result,
      findings: parse.data.findings,
      scheduledDate: new Date(parse.data.scheduledDate),
    },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      inspector: { select: { id: true, name: true, serviceNumber: true } },
      schedule: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(inspection, { status: 201 });
}
