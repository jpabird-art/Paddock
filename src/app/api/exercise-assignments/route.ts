import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { notifyRider } from "@/lib/exercise-notifications";
import { z } from "zod";
import { startOfWeek, endOfWeek } from "date-fns";

const createSchema = z.object({
  horseId: z.string().min(1),
  riderId: z.string().min(1),
  exerciseName: z.string().min(1),
  date: z.string().min(1),
  timeSlot: z.string().regex(/^\d{4}$/, "Time slot must be 4 digits e.g. 0630"),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const horseInclude = {
  select: { id: true, name: true, regimentalNumber: true, squadron: true, role: true },
};
const riderInclude = {
  select: { id: true, name: true, serviceNumber: true, rank: true },
};
const assignedByInclude = {
  select: { id: true, name: true },
};

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const weekOf = searchParams.get("weekOf");
  const horseId = searchParams.get("horseId");
  const riderId = searchParams.get("riderId");

  const where: Record<string, unknown> = {};

  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: d, lt: nextDay };
  } else if (weekOf) {
    const d = new Date(weekOf);
    where.date = {
      gte: startOfWeek(d, { weekStartsOn: 1 }),
      lte: endOfWeek(d, { weekStartsOn: 1 }),
    };
  }

  const squadron = searchParams.get("squadron");
  if (squadron) {
    where.horse = { squadron };
  }

  if (horseId) where.horseId = horseId;
  if (riderId) where.riderId = riderId;

  const assignments = await prisma.exerciseAssignment.findMany({
    where,
    include: {
      horse: horseInclude,
      rider: riderInclude,
      assignedBy: assignedByInclude,
    },
    orderBy: [{ timeSlot: "asc" }, { horse: { name: "asc" } }],
  });

  return NextResponse.json(assignments);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("exercise_assignment", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const assignment = await prisma.exerciseAssignment.create({
    data: {
      horseId: parse.data.horseId,
      riderId: parse.data.riderId,
      assignedById: session!.user.id,
      exerciseName: parse.data.exerciseName,
      date: new Date(parse.data.date),
      timeSlot: parse.data.timeSlot,
      duration: parse.data.duration,
      notes: parse.data.notes,
    },
    include: {
      horse: horseInclude,
      rider: riderInclude,
      assignedBy: assignedByInclude,
    },
  });

  audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "exercise_assignment",
    entityId: assignment.id,
    action: "create",
    after: {
      horseId: assignment.horseId,
      riderId: assignment.riderId,
      exerciseName: assignment.exerciseName,
      date: parse.data.date,
      timeSlot: assignment.timeSlot,
    },
  });

  // Fire-and-forget notification
  notifyRider(assignment.id).catch(console.error);

  return NextResponse.json(assignment, { status: 201 });
}
