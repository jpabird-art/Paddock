import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  feedType: z.string().min(1).optional(),
  quantityKg: z.number().positive().optional(),
  frequency: z.string().min(1).optional(),
  timeOfDay: z.string().optional(),
  specialNotes: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const plan = await prisma.feedingPlan.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Feeding plan not found" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("feeding_plan", "update");
  if (error) return error;

  const { id } = await params;

  const plan = await prisma.feedingPlan.findUnique({ where: { id } });
  if (!plan) {
    return NextResponse.json({ error: "Feeding plan not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.startDate) {
    data.startDate = new Date(parse.data.startDate);
  }
  if (parse.data.endDate) {
    data.endDate = new Date(parse.data.endDate);
  }

  const updated = await prisma.feedingPlan.update({
    where: { id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  return NextResponse.json(updated);
}
