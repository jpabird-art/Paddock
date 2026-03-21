import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  result: z.enum(["PASS", "FAIL", "ADVISORY"]).optional(),
  findings: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      inspector: { select: { id: true, name: true, serviceNumber: true } },
      schedule: { select: { id: true, name: true } },
    },
  });

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  return NextResponse.json(inspection);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("inspection", "update");
  if (error) return error;

  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.completedAt) {
    data.completedAt = new Date(parse.data.completedAt);
  }

  const updated = await prisma.inspection.update({
    where: { id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      inspector: { select: { id: true, name: true, serviceNumber: true } },
      schedule: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
