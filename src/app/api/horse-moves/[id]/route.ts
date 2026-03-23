import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { isValidTransition } from "@/lib/move-transitions";
import { completeMoveForHorse } from "@/lib/horse-services";
import { MoveStatus } from "@prisma/client";

const updateSchema = z.object({
  fromLocationId: z.string().optional().nullable(),
  toLocationId: z.string().optional(),
  departureDate: z.string().optional(),
  arrivalDate: z.string().optional().nullable(),
  status: z.enum(["PLANNED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]).optional(),
  driverName: z.string().optional().nullable(),
  driverServiceNumber: z.string().optional().nullable(),
  boxGroomName: z.string().optional().nullable(),
  vehicleVRN: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  crew: z.array(z.object({
    name: z.string().min(1),
    serviceNumber: z.string().optional(),
    role: z.string().min(1),
  })).optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const move = await prisma.horseMove.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
      createdBy: { select: { name: true, serviceNumber: true } },
      updatedBy: { select: { name: true, serviceNumber: true } },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(move);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("horse_move", "update");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  // Fetch current move to validate state transition
  const existing = await prisma.horseMove.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newStatus = parse.data.status as MoveStatus | undefined;
  if (newStatus && !isValidTransition(existing.status, newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${existing.status} to ${newStatus}` },
      { status: 409 }
    );
  }

  const { departureDate, arrivalDate, ...rest } = parse.data;

  const updateData: Record<string, unknown> = {
    ...rest,
    updatedById: session!.user.id,
  };

  if (departureDate) updateData.departureDate = new Date(departureDate);
  if (arrivalDate !== undefined) updateData.arrivalDate = arrivalDate ? new Date(arrivalDate) : null;

  const move = await prisma.horseMove.update({
    where: { id },
    data: updateData,
    include: {
      horse: { select: { id: true, name: true } },
      toLocation: { select: { id: true } },
    },
  });

  // Only run side effects on the first transition INTO COMPLETED
  const transitionedToCompleted =
    newStatus === "COMPLETED" && existing.status !== "COMPLETED";

  if (transitionedToCompleted) {
    await completeMoveForHorse(move.horseId, move.toLocationId);
  }

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "horse_move",
    entityId: id,
    action: newStatus ? `status_${newStatus.toLowerCase()}` : "update",
    after: { status: newStatus, horseId: move.horseId },
  });

  return NextResponse.json(move);
}
