import { prisma } from "@/lib/prisma";
import { MoveStatus } from "@prisma/client";

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
