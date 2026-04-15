import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { audit, snapshotDiff } from "@/lib/audit";
import { notifyRider } from "@/lib/exercise-notifications";
import { z } from "zod";

const patchSchema = z.object({
  riderId: z.string().min(1).optional(),
  exerciseName: z.string().min(1).optional(),
  timeSlot: z.string().regex(/^\d{4}$/).optional(),
  duration: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const assignment = await prisma.exerciseAssignment.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true, squadron: true, role: true } },
      rider: { select: { id: true, name: true, serviceNumber: true, rank: true } },
      assignedBy: { select: { id: true, name: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Exercise assignment not found" }, { status: 404 });
  }

  return NextResponse.json(assignment);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("exercise_assignment", "update");
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.exerciseAssignment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Exercise assignment not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const updated = await prisma.exerciseAssignment.update({
    where: { id },
    data: parse.data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true, squadron: true, role: true } },
      rider: { select: { id: true, name: true, serviceNumber: true, rank: true } },
      assignedBy: { select: { id: true, name: true } },
    },
  });

  const diff = snapshotDiff(
    { riderId: existing.riderId, exerciseName: existing.exerciseName, timeSlot: existing.timeSlot, duration: existing.duration, notes: existing.notes },
    { riderId: updated.riderId, exerciseName: updated.exerciseName, timeSlot: updated.timeSlot, duration: updated.duration, notes: updated.notes }
  );

  audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "exercise_assignment",
    entityId: id,
    action: "update",
    before: diff.before,
    after: diff.after,
  });

  // If rider changed, notify the new rider
  if (parse.data.riderId && parse.data.riderId !== existing.riderId) {
    notifyRider(id).catch(console.error);
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("exercise_assignment", "delete");
  if (error) return error;

  const { id } = await params;

  const existing = await prisma.exerciseAssignment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Exercise assignment not found" }, { status: 404 });
  }

  await prisma.exerciseAssignment.delete({ where: { id } });

  audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "exercise_assignment",
    entityId: id,
    action: "delete",
    before: {
      horseId: existing.horseId,
      riderId: existing.riderId,
      exerciseName: existing.exerciseName,
      date: existing.date.toISOString(),
      timeSlot: existing.timeSlot,
    },
  });

  return NextResponse.json({ success: true });
}
