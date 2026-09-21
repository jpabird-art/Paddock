/**
 * Permanently deletes every horse record and everything hanging off it.
 *
 * This is irreversible. Take a database dump first:
 *   pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
 *
 * Guards: the script refuses to run unless PURGE_CONFIRM is set to the exact
 * string "DELETE ALL HORSE DATA".
 *
 * Scope:
 *   default              — horses and all dependent records; users, locations
 *                          and tack inventory are kept.
 *   PURGE_USERS=1        — also deletes every user except the one named by
 *                          KEEP_SERVICE_NUMBER (required when set).
 *   PURGE_LOCATIONS=1    — also deletes locations.
 *   PURGE_TACK=1         — also deletes the tack inventory itself.
 *
 * Usage:
 *   PURGE_CONFIRM="DELETE ALL HORSE DATA" npm run purge
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONFIRMATION = "DELETE ALL HORSE DATA";

async function main() {
  if (process.env.PURGE_CONFIRM !== CONFIRMATION) {
    console.error(
      `Refusing to run. Set PURGE_CONFIRM="${CONFIRMATION}" to confirm this irreversible deletion.`
    );
    process.exit(1);
  }

  const purgeUsers = process.env.PURGE_USERS === "1";
  const keepServiceNumber = process.env.KEEP_SERVICE_NUMBER?.trim().toUpperCase();

  if (purgeUsers && !keepServiceNumber) {
    console.error(
      "PURGE_USERS=1 requires KEEP_SERVICE_NUMBER so at least one administrator survives."
    );
    process.exit(1);
  }

  const horses = await prisma.horse.count();
  console.log(`Purging ${horses} horse record(s) and all dependent data...\n`);

  const deleted: [string, number][] = [];

  // Ordered so that children go before their parents.
  deleted.push(["Audit logs", (await prisma.auditLog.deleteMany({})).count]);
  deleted.push(["Attachments", (await prisma.attachment.deleteMany({})).count]);
  deleted.push(["Inspections", (await prisma.inspection.deleteMany({})).count]);
  deleted.push([
    "Inspection schedules",
    (await prisma.inspectionSchedule.deleteMany({})).count,
  ]);
  deleted.push(["Tack allocations", (await prisma.tackAllocation.deleteMany({})).count]);
  deleted.push(["Medication records", (await prisma.medicationRecord.deleteMany({})).count]);
  deleted.push(["Feeding plans", (await prisma.feedingPlan.deleteMany({})).count]);
  deleted.push(["Farrier records", (await prisma.farrierRecord.deleteMany({})).count]);
  deleted.push([
    "Exercise notifications",
    (await prisma.exerciseNotification.deleteMany({})).count,
  ]);
  deleted.push(["Exercise assignments", (await prisma.exerciseAssignment.deleteMany({})).count]);
  deleted.push(["Horse moves", (await prisma.horseMove.deleteMany({})).count]);
  deleted.push(["Duty assignments", (await prisma.dutyAssignment.deleteMany({})).count]);
  deleted.push(["Injury notifications", (await prisma.injuryNotification.deleteMany({})).count]);
  deleted.push(["Injury reports", (await prisma.injuryReport.deleteMany({})).count]);
  deleted.push(["Health notes", (await prisma.healthNote.deleteMany({})).count]);
  deleted.push(["Health events", (await prisma.healthEvent.deleteMany({})).count]);
  deleted.push(["Horses", (await prisma.horse.deleteMany({})).count]);

  if (process.env.PURGE_TACK === "1") {
    deleted.push(["Tack items", (await prisma.tackItem.deleteMany({})).count]);
  }

  if (purgeUsers) {
    deleted.push([
      "Users",
      (await prisma.user.deleteMany({ where: { serviceNumber: { not: keepServiceNumber } } }))
        .count,
    ]);
  }

  if (process.env.PURGE_LOCATIONS === "1") {
    deleted.push(["Locations", (await prisma.location.deleteMany({})).count]);
  }

  for (const [label, count] of deleted) {
    console.log(`  ${label}: ${count}`);
  }

  const remaining = {
    horses: await prisma.horse.count(),
    users: await prisma.user.count(),
    locations: await prisma.location.count(),
  };

  console.log(
    `\nRemaining — horses: ${remaining.horses}, users: ${remaining.users}, locations: ${remaining.locations}`
  );

  if (remaining.horses > 0) {
    console.error("Horses still present. Investigate before treating the purge as complete.");
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
