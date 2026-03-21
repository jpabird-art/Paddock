import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  horseId: z.string().min(1),
  riderId: z.string().min(1),
  suitabilityScore: z.number().int().min(1).max(5).optional(),
  startDate: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const assignments = await prisma.riderAssignment.findMany({
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      rider: { select: { id: true, name: true, serviceNumber: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const { error } = await requirePermission("rider_assignment", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const assignment = await prisma.riderAssignment.create({
    data: {
      horseId: parse.data.horseId,
      riderId: parse.data.riderId,
      suitabilityScore: parse.data.suitabilityScore,
      startDate: new Date(parse.data.startDate),
      notes: parse.data.notes,
    },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      rider: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
