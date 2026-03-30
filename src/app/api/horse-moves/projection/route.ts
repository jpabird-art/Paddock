import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function GET(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  if (!session || !["ADMIN", "OFFICER", "VET"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam + "T23:59:59.999Z") : new Date();

  // 1. All active horses with current location
  const horses = await prisma.horse.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      regimentalNumber: true,
      squadron: true,
      currentLocationId: true,
      currentLocation: { select: { id: true, name: true, code: true } },
    },
    orderBy: { name: "asc" },
  });

  // 2. All PLANNED/IN_TRANSIT moves with departureDate <= target, ordered desc
  const moves = await prisma.horseMove.findMany({
    where: {
      status: { in: ["PLANNED", "IN_TRANSIT"] },
      departureDate: { lte: targetDate },
      horse: { isActive: true },
    },
    select: {
      horseId: true,
      departureDate: true,
      status: true,
      toLocationId: true,
      toLocation: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ departureDate: "desc" }, { status: "asc" }], // IN_TRANSIT sorts before PLANNED
  });

  // 3. Build latest move per horse (first in desc order wins)
  const latestMoveByHorse = new Map<
    string,
    { toLocationId: string; toLocation: { id: string; name: string; code: string } }
  >();
  for (const move of moves) {
    if (!latestMoveByHorse.has(move.horseId)) {
      latestMoveByHorse.set(move.horseId, move);
    }
  }

  // 4. Compute projected location per horse and group by location
  const locationMap = new Map<
    string,
    {
      id: string;
      name: string;
      code: string;
      horses: { id: string; name: string; regimentalNumber: string; squadron: string | null; isMoving: boolean; currentLocationName: string | null }[];
    }
  >();
  const unlocated: { id: string; name: string; regimentalNumber: string; squadron: string | null }[] = [];
  let movingCount = 0;

  for (const horse of horses) {
    const move = latestMoveByHorse.get(horse.id);
    const projectedLocation = move ? move.toLocation : horse.currentLocation;
    const isMoving = move != null && move.toLocationId !== horse.currentLocationId;

    if (isMoving) movingCount++;

    if (!projectedLocation) {
      unlocated.push({
        id: horse.id,
        name: horse.name,
        regimentalNumber: horse.regimentalNumber,
        squadron: horse.squadron,
      });
      continue;
    }

    let group = locationMap.get(projectedLocation.id);
    if (!group) {
      group = {
        id: projectedLocation.id,
        name: projectedLocation.name,
        code: projectedLocation.code,
        horses: [],
      };
      locationMap.set(projectedLocation.id, group);
    }

    group.horses.push({
      id: horse.id,
      name: horse.name,
      regimentalNumber: horse.regimentalNumber,
      squadron: horse.squadron,
      isMoving,
      currentLocationName: horse.currentLocation?.name ?? null,
    });
  }

  // Sort locations by name, add totals
  const locations = Array.from(locationMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((loc) => ({
      ...loc,
      total: loc.horses.length,
      movingIn: loc.horses.filter((h) => h.isMoving).length,
    }));

  return NextResponse.json({
    date: dateParam ?? new Date().toISOString().substring(0, 10),
    locations,
    unlocated,
    summary: { total: horses.length, moving: movingCount },
  });
}
