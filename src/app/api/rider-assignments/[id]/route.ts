import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  endDate: z.string().optional(),
  notes: z.string().optional(),
  suitabilityScore: z.number().int().min(1).max(5).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const assignment = await prisma.riderAssignment.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      rider: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Rider assignment not found" }, { status: 404 });
  }

  return NextResponse.json(assignment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("rider_assignment", "update");
  if (error) return error;

  const { id } = await params;

  const assignment = await prisma.riderAssignment.findUnique({ where: { id } });
  if (!assignment) {
    return NextResponse.json({ error: "Rider assignment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.endDate) {
    data.endDate = new Date(parse.data.endDate);
  }

  const updated = await prisma.riderAssignment.update({
    where: { id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      rider: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  return NextResponse.json(updated);
}
