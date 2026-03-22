import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { locationToDutyStation } from "@/lib/location-mapping";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { groupId } = await params;

  const moves = await prisma.horseMove.findMany({
    where: { groupId },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
    },
    orderBy: { horse: { name: "asc" } },
  });

  if (moves.length === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  return NextResponse.json(moves);
}

const updateSchema = z.object({
  status: z.enum(["PLANNED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { error, session } = await requirePermission("horse_move", "update");
  if (error) return error;

  const { groupId } = await params;
  const body = await request.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const moves = await prisma.horseMove.findMany({
    where: { groupId },
    select: { id: true, horseId: true, toLocationId: true },
  });

  if (moves.length === 0) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (parse.data.status === "COMPLETED") {
    // Fetch destination locations for duty station mapping
    const toLocationIds = [...new Set(moves.map((m) => m.toLocationId))];
    const locations = await prisma.location.findMany({
      where: { id: { in: toLocationIds } },
      select: { id: true, code: true },
    });
    const locationMap = new Map(locations.map((l) => [l.id, l.code]));
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.horseMove.updateMany({
        where: { groupId },
        data: { status: "COMPLETED", updatedById: session!.user.id },
      });

      for (const m of moves) {
        const code = locationMap.get(m.toLocationId);
        const mappedStation = code ? locationToDutyStation(code) : null;

        const horseUpdate: Record<string, unknown> = { currentLocationId: m.toLocationId };
        if (mappedStation) {
          horseUpdate.dutyStation = mappedStation;
        }

        await tx.horse.update({
          where: { id: m.horseId },
          data: horseUpdate,
        });

        if (mappedStation) {
          await tx.dutyAssignment.updateMany({
            where: { horseId: m.horseId, endDate: null },
            data: { endDate: now },
          });

          await tx.dutyAssignment.create({
            data: {
              horseId: m.horseId,
              assignedById: session!.user.id,
              station: mappedStation,
              startDate: now,
              notes: `Assigned via group move completion to ${code}.`,
            },
          });
        }
      }
    });
  } else {
    await prisma.horseMove.updateMany({
      where: { groupId },
      data: { status: parse.data.status, updatedById: session!.user.id },
    });
  }

  for (const m of moves) {
    await audit({
      userId: session?.user.id,
      userRole: session?.user.role,
      entityType: "horse_move",
      entityId: m.id,
      action: `group_status_${parse.data.status.toLowerCase()}`,
      after: { status: parse.data.status, groupId, horseId: m.horseId },
    });
  }

  return NextResponse.json({ message: `Updated ${moves.length} moves to ${parse.data.status}` });
}
