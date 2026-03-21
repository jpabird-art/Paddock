import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  frequencyDays: z.number().int().positive(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const schedules = await prisma.inspectionSchedule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("inspection_schedule", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const schedule = await prisma.inspectionSchedule.create({
    data: {
      name: parse.data.name,
      description: parse.data.description,
      frequencyDays: parse.data.frequencyDays,
      createdById: session!.user.id,
    },
  });

  return NextResponse.json(schedule, { status: 201 });
}
