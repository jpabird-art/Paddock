/**
 * Production seed — creates the initial admin account and real locations only.
 * No demo horses, no fake users.
 *
 * Usage: SEED_FORCE=1 npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-production.ts
 */

import { PrismaClient, Squadron } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Running production seed...");

  // ─── ADMIN ACCOUNT ─────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { serviceNumber: "ADMIN001" },
    update: {},
    create: {
      name: "Capt James Bird",
      serviceNumber: "ADMIN001",
      email: "james.bird118@mod.gov.uk",
      passwordHash,
      role: "ADMIN",
      squadron: Squadron.THE_LIFE_GUARDS,
      rank: "Capt",
    },
  });
  console.log(`Admin account ready: ${admin.serviceNumber} (${admin.name})`);
  console.log(">>> IMPORTANT: Change the default password immediately after first login. <<<");

  // ─── LOCATIONS ─────────────────────────────────────────────
  const locations = [
    { name: "Hyde Park Barracks", code: "HPB" },
    { name: "Household Cavalry Training Wing", code: "HCTW" },
    { name: "Working Livery", code: "WORKING_LIVERY" },
    { name: "Winter Training Troop", code: "WTT" },
    { name: "Defence Animal Training Regiment", code: "DATR" },
    { name: "Grass", code: "GRASS" },
    { name: "Bell Equine Hospital", code: "BELL_EQUINE" },
  ];

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  console.log(`${locations.length} locations seeded.`);

  console.log("\nProduction seed complete. Add users and horses through the app.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
