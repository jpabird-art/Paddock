import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";

const INTERVALS: Record<string, number | null> = {
  DENTAL_CHECK: 180,
  VET_CHECKUP: 365,
  VACCINATION: 365,
  FARRIERY: 42,
  CUSTOM: null,
};

export async function scheduleNextEvent(
  horseId: string,
  type: string,
  completedAt: Date
): Promise<void> {
  const interval = INTERVALS[type];
  if (interval === null) return;

  const nextDate = addDays(completedAt, interval);

  await prisma.healthEvent.create({
    data: {
      horseId,
      type,
      status: "SCHEDULED",
      scheduledAt: nextDate,
    },
  });
}

export async function seedInitialEvents(
  horseId: string,
  serviceEntryDate: Date
): Promise<void> {
  const types = ["DENTAL_CHECK", "VET_CHECKUP", "FARRIERY"];

  for (const type of types) {
    const interval = INTERVALS[type];
    if (!interval) continue;

    await prisma.healthEvent.create({
      data: {
        horseId,
        type,
        status: "SCHEDULED",
        scheduledAt: addDays(serviceEntryDate, interval),
      },
    });
  }
}

export async function markOverdueEvents(): Promise<number> {
  const now = new Date();

  const result = await prisma.healthEvent.updateMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lt: now },
    },
    data: {
      status: "OVERDUE",
    },
  });

  return result.count;
}
