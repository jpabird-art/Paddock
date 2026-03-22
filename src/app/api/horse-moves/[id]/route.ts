import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { locationToDutyStation } from "@/lib/location-mapping";

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

  if (parse.data.status === "COMPLETED") {
    const toLocation = await prisma.location.findUnique({
      where: { id: move.toLocationId },
      select: { code: true },
    });

    const mappedStation = toLocation ? locationToDutyStation(toLocation.code) : null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Always update currentLocationId
      const horseUpdate: Record<string, unknown> = { currentLocationId: move.toLocationId };

      // If destination maps to a DutyStation, update that too
      if (mappedStation) {
        horseUpdate.dutyStation = mappedStation;
      }

      await tx.horse.update({
        where: { id: move.horseId },
        data: horseUpdate,
      });

      // Manage DutyAssignment history when station changes
      if (mappedStation) {
        await tx.dutyAssignment.updateMany({
          where: { horseId: move.horseId, endDate: null },
          data: { endDate: now },
        });

        await tx.dutyAssignment.create({
          data: {
            horseId: move.horseId,
            assignedById: session!.user.id,
            station: mappedStation,
            startDate: now,
            notes: `Assigned via move completion to ${toLocation!.code}.`,
          },
        });
      }
    });
  }

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "horse_move",
    entityId: id,
    action: parse.data.status ? `status_${parse.data.status.toLowerCase()}` : "update",
    after: { status: parse.data.status, horseId: move.horseId },
  });

  return NextResponse.json(move);
}
