import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { FeedType, FeedFrequency } from "@prisma/client";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  horseId: z.string().min(1),
  feedType: z.nativeEnum(FeedType),
  quantityKg: z.number().positive(),
  frequency: z.nativeEnum(FeedFrequency),
  timeOfDay: z.string().optional(),
  specialNotes: z.string().optional(),
  startDate: z.string().min(1),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const plans = await prisma.feedingPlan.findMany({
    where: { isActive: true },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(plans);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("feeding_plan", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const plan = await prisma.feedingPlan.create({
    data: {
      horseId: parse.data.horseId,
      feedType: parse.data.feedType,
      quantityKg: parse.data.quantityKg,
      frequency: parse.data.frequency,
      timeOfDay: parse.data.timeOfDay,
      specialNotes: parse.data.specialNotes,
      startDate: new Date(parse.data.startDate),
      createdById: session!.user.id,
    },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "feeding_plan",
    entityId: plan.id,
    action: "create",
    after: { horseId: plan.horseId, feedType: plan.feedType },
  });

  return NextResponse.json(plan, { status: 201 });
}
