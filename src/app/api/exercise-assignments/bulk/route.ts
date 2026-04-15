import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notifyRiders } from "@/lib/exercise-notifications";
import { z } from "zod";

const bulkSchema = z.object({
  date: z.string().min(1),
  timeSlot: z.string().regex(/^\d{4}$/, "Time slot must be 4 digits e.g. 0630"),
  exerciseName: z.string().min(1),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
  assignments: z
    .array(
      z.object({
        horseId: z.string().min(1),
        riderId: z.string().min(1),
      })
    )
    .min(1, "At least one horse-rider pair is required"),
});

export async function POST(request: Request) {
  const { error, session } = await requirePermission("exercise_assignment", "create");
  if (error) return error;

  const body = await request.json();
  const parse = bulkSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const { date, timeSlot, exerciseName, duration, notes, assignments } = parse.data;
  const dateObj = new Date(date);
  const userId = session!.user.id;

  // Create all assignments in a transaction
  const created = await prisma.$transaction(
    assignments.map((a) =>
      prisma.exerciseAssignment.create({
        data: {
          horseId: a.horseId,
          riderId: a.riderId,
          assignedById: userId,
          exerciseName,
          date: dateObj,
          timeSlot,
          duration,
          notes,
        },
      })
    )
  );

  // Audit each assignment
  for (const assignment of created) {
    audit({
      userId,
      userRole: session!.user.role,
      entityType: "exercise_assignment",
      entityId: assignment.id,
      action: "create",
      after: {
        horseId: assignment.horseId,
        riderId: assignment.riderId,
        exerciseName,
        date,
        timeSlot,
      },
      metadata: { bulk: true },
    });
  }

  // Fire-and-forget notifications for all riders
  notifyRiders(created.map((a) => a.id)).catch(console.error);

  return NextResponse.json({ created: created.length, ids: created.map((a) => a.id) }, { status: 201 });
}
