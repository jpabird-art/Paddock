import { prisma } from "@/lib/prisma";
import { MoveStatus } from "@prisma/client";
import type { DutyStation, Prisma } from "@prisma/client";

/**
 * Soft-delete a horse and cascade to all active related records.
 * Runs in a single transaction for atomicity.
 */
export async function deactivateHorse(horseId: string): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    prisma.horse.update({
      where: { id: horseId },
      data: { isActive: false },
    }),
    prisma.dutyAssignment.updateMany({
      where: { horseId, endDate: null },
      data: { endDate: now },
    }),
    prisma.riderAssignment.updateMany({
      where: { horseId, endDate: null },
      data: { endDate: now },
    }),
    prisma.feedingPlan.updateMany({
      where: { horseId, isActive: true },
      data: { isActive: false, endDate: now },
    }),
    prisma.tackAllocation.updateMany({
      where: { horseId, endDate: null },
      data: { endDate: now },
    }),
    prisma.horseMove.updateMany({
      where: { horseId, status: MoveStatus.PLANNED },
      data: { status: MoveStatus.CANCELLED },
    }),
  ]);
}

/**
 * Record a duty station change: close the current assignment and open a new one.
 * Must be called inside a Prisma interactive transaction.
 */
export async function reassignDutyStation(
  tx: Prisma.TransactionClient,
  horseId: string,
  fromStation: DutyStation,
  toStation: DutyStation,
  assignedById: string
): Promise<void> {
  const now = new Date();

  await tx.dutyAssignment.updateMany({
    where: { horseId, endDate: null },
    data: { endDate: now },
  });

  await tx.dutyAssignment.create({
    data: {
      horseId,
      assignedById,
      station: toStation,
      startDate: now,
      notes: `Reassigned from ${fromStation} to ${toStation}.`,
    },
  });
}

/**
 * Handle side effects when a move transitions to COMPLETED for the first time:
 * update the horse's current location.
 */
export async function completeMoveForHorse(
  horseId: string,
  toLocationId: string
): Promise<void> {
  await prisma.horse.update({
    where: { id: horseId },
    data: { currentLocationId: toLocationId },
  });
}
