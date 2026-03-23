import { prisma } from "@/lib/prisma";
import { HealthEventType, HealthEventStatus } from "@prisma/client";
import { addDays } from "date-fns";

const INTERVALS: Record<HealthEventType, number | null> = {
  DENTAL_CHECK: 180,
  VET_CHECKUP: 365,
  VACCINATION: 365,
  FARRIERY: 42,
  CUSTOM: null,
};

export async function scheduleNextEvent(
  horseId: string,
  type: HealthEventType,
  completedAt: Date
): Promise<void> {
  const interval = INTERVALS[type];
  if (interval === null) return;

  const nextDate = addDays(completedAt, interval);

  // Idempotency: don't create if a SCHEDULED event of this type already exists
  const existing = await prisma.healthEvent.findFirst({
    where: {
      horseId,
      type,
      status: HealthEventStatus.SCHEDULED,
    },
  });
  if (existing) return;

  await prisma.healthEvent.create({
    data: {
      horseId,
      type,
      status: HealthEventStatus.SCHEDULED,
      scheduledAt: nextDate,
    },
  });
}

export async function seedInitialEvents(
  horseId: string,
  serviceEntryDate: Date
): Promise<void> {
  const types: HealthEventType[] = [
    HealthEventType.DENTAL_CHECK,
    HealthEventType.VET_CHECKUP,
    HealthEventType.FARRIERY,
  ];

  for (const type of types) {
    const interval = INTERVALS[type];
    if (!interval) continue;

    await prisma.healthEvent.create({
      data: {
        horseId,
        type,
        status: HealthEventStatus.SCHEDULED,
        scheduledAt: addDays(serviceEntryDate, interval),
      },
    });
  }
}

export async function markOverdueEvents(): Promise<number> {
  const now = new Date();

  const result = await prisma.healthEvent.updateMany({
    where: {
      status: HealthEventStatus.SCHEDULED,
      scheduledAt: { lt: now },
    },
    data: {
      status: HealthEventStatus.OVERDUE,
    },
  });

  return result.count;
}
