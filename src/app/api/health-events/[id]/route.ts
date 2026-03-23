import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { scheduleNextEvent } from "@/lib/health-scheduler";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "OVERDUE", "COMPLETED"]).optional(),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
  performedBy: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requirePermission("health_event", "update");
  if (error) return error;

  const event = await prisma.healthEvent.findUnique({
    where: { id },
  });
  if (!event) {
    return NextResponse.json({ error: "Health event not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };

  if (parse.data.status === "COMPLETED" && parse.data.completedAt) {
    data.completedAt = new Date(parse.data.completedAt);
  } else if (parse.data.status === "COMPLETED") {
    data.completedAt = new Date();
  }

  const updated = await prisma.healthEvent.update({
    where: { id },
    data,
  });

  // Schedule next occurrence only on the first transition into COMPLETED
  const transitionedToCompleted =
    parse.data.status === "COMPLETED" && event.status !== "COMPLETED";

  if (transitionedToCompleted) {
    const completedAt = (data.completedAt as Date) ?? new Date();
    await scheduleNextEvent(event.horseId, event.type, completedAt);
  }

  return NextResponse.json(updated);
}
