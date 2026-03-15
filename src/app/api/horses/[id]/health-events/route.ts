import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  type: z.string().min(1),
  scheduledAt: z.string().min(1),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole();
  if (error) return error;

  const events = await prisma.healthEvent.findMany({
    where: { horseId: params.id },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("ADMIN", "VET", "OFFICER");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id: params.id } });
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
      horseId: params.id,
      type: parse.data.type,
      scheduledAt: new Date(parse.data.scheduledAt),
      notes: parse.data.notes,
      status: "SCHEDULED",
    },
  });

  return NextResponse.json(event, { status: 201 });
}
