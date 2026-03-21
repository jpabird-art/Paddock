import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  frequencyDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("inspection_schedule", "update");
  if (error) return error;

  const { id } = await params;

  const schedule = await prisma.inspectionSchedule.findUnique({ where: { id } });
  if (!schedule) {
    return NextResponse.json({ error: "Inspection schedule not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.inspectionSchedule.update({
    where: { id },
    data: parse.data,
  });

  return NextResponse.json(updated);
}
