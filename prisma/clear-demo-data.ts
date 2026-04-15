import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing demo data from production database...\n");

  // Delete in order respecting foreign keys
  const results: [string, number][] = [];

  results.push(["Audit logs", (await prisma.auditLog.deleteMany({})).count]);
  results.push(["Attachments", (await prisma.attachment.deleteMany({})).count]);
  results.push(["Inspections", (await prisma.inspection.deleteMany({})).count]);
  results.push(["Inspection schedules", (await prisma.inspectionSchedule.deleteMany({})).count]);
  results.push(["Tack allocations", (await prisma.tackAllocation.deleteMany({})).count]);
  results.push(["Tack items", (await prisma.tackItem.deleteMany({})).count]);
  results.push(["Medication records", (await prisma.medicationRecord.deleteMany({})).count]);
  results.push(["Feeding plans", (await prisma.feedingPlan.deleteMany({})).count]);
  results.push(["Exercise assignments", (await prisma.exerciseAssignment.deleteMany({})).count]);
  results.push(["Exercise notifications", (await prisma.exerciseNotification.deleteMany({})).count]);
  results.push(["Horse moves", (await prisma.horseMove.deleteMany({})).count]);
  results.push(["Duty assignments", (await prisma.dutyAssignment.deleteMany({})).count]);
  results.push(["Injury notifications", (await prisma.injuryNotification.deleteMany({})).count]);
  results.push(["Injury reports", (await prisma.injuryReport.deleteMany({})).count]);
  results.push(["Health notes", (await prisma.healthNote.deleteMany({})).count]);
  results.push(["Health events", (await prisma.healthEvent.deleteMany({})).count]);
  results.push(["Horses", (await prisma.horse.deleteMany({})).count]);

  // Delete all users EXCEPT ADMIN001
  results.push([
    "Users removed",
    (await prisma.user.deleteMany({ where: { serviceNumber: { not: "ADMIN001" } } })).count,
  ]);

  for (const [label, count] of results) {
    if (count > 0) console.log(`  ${label}: ${count} deleted`);
  }

  // Update ADMIN001 to real details
  const admin = await prisma.user.update({
    where: { serviceNumber: "ADMIN001" },
    data: {
      name: "Capt James Bird",
      email: "james.bird118@mod.gov.uk",
      rank: "Capt",
    },
  });
  console.log(`\nAdmin account updated: ${admin.name} (${admin.email})`);

  // Verify locations remain
  const locations = await prisma.location.findMany({ select: { name: true, code: true } });
  console.log(`Locations preserved: ${locations.length}`);
  locations.forEach((l) => console.log(`  - ${l.name} (${l.code})`));

  console.log("\nDatabase is clean. Admin account and locations only.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
