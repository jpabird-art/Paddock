import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { randomUUID } from "crypto";

const createSchema = z.object({
  horseIds: z.array(z.string().min(1)).min(1, "Select at least one horse"),
  fromLocationId: z.string().optional().nullable(),
  toLocationId: z.string().min(1),
  departureDate: z.string().min(1),
  arrivalDate: z.string().optional().nullable(),
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

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const moves = await prisma.horseMove.findMany({
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
      createdBy: { select: { name: true, serviceNumber: true } },
    },
    orderBy: { departureDate: "desc" },
  });

  return NextResponse.json(moves);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("horse_move", "create");
  if (error) return error;

  const body = await request.json();

  // Backward compat: accept single horseId
  if (body.horseId && !body.horseIds) {
    body.horseIds = [body.horseId];
  }

  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const { horseIds, fromLocationId, toLocationId, departureDate, arrivalDate, driverName, driverServiceNumber, boxGroomName, vehicleVRN, notes, crew } = parse.data;

  const groupId = horseIds.length > 1 ? randomUUID() : null;

  const sharedData = {
    fromLocationId: fromLocationId ?? null,
    toLocationId,
    departureDate: new Date(departureDate),
    arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
    driverName: driverName ?? null,
    driverServiceNumber: driverServiceNumber ?? null,
    boxGroomName: boxGroomName ?? null,
    vehicleVRN: vehicleVRN ?? null,
    notes: notes ?? null,
    crew: crew ?? undefined,
    groupId,
    createdById: session!.user.id,
  };

  const moves = await prisma.$transaction(
    horseIds.map((horseId) =>
      prisma.horseMove.create({
        data: { horseId, ...sharedData },
      })
    )
  );

  return NextResponse.json(moves.length === 1 ? moves[0] : moves, { status: 201 });
}
