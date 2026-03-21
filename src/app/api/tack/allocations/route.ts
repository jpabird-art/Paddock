import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  tackItemId: z.string().min(1),
  horseId: z.string().min(1),
  fitNotes: z.string().optional(),
  startDate: z.string().min(1),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const allocations = await prisma.tackAllocation.findMany({
    include: {
      tackItem: { select: { id: true, type: true, identifier: true, condition: true } },
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(allocations);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("tack_allocation", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const allocation = await prisma.tackAllocation.create({
    data: {
      tackItemId: parse.data.tackItemId,
      horseId: parse.data.horseId,
      assignedById: session!.user.id,
      fitNotes: parse.data.fitNotes,
      startDate: new Date(parse.data.startDate),
    },
    include: {
      tackItem: { select: { id: true, type: true, identifier: true, condition: true } },
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  return NextResponse.json(allocation, { status: 201 });
}
