import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { HealthEventStatus, HealthEventType } from "@prisma/client";

const createSchema = z.object({
  type: z.nativeEnum(HealthEventType),
  scheduledAt: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireAuth();
  if (error) return error;

  const events = await prisma.healthEvent.findMany({
    where: { horseId: id },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requirePermission("health_event", "create");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const event = await prisma.healthEvent.create({
    data: {
      horseId: id,
      type: parse.data.type,
      scheduledAt: new Date(parse.data.scheduledAt),
      notes: parse.data.notes,
      status: HealthEventStatus.SCHEDULED,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
