/**
 * First-run bootstrap for a new Paddock instance.
 *
 * Creates a single administrator account from environment variables so a new
 * tenant deployment has somebody who can sign in and create everybody else.
 * It creates no horses and no sample data.
 *
 * Required:
 *   BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_SERVICE_NUMBER,
 *   BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD
 *
 * Optional:
 *   BOOTSTRAP_ADMIN_RANK, BOOTSTRAP_ADMIN_SQUADRON (THE_LIFE_GUARDS | THE_BLUES_AND_ROYALS)
 *   BOOTSTRAP_LOCATIONS — comma-separated "Name:CODE" pairs
 *
 * Usage:
 *   npm run bootstrap
 */

import { PrismaClient, Squadron } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function parseSquadron(raw: string | undefined): Squadron | null {
  if (!raw) return null;
  const value = raw.trim().toUpperCase();
  if (value in Squadron) return Squadron[value as keyof typeof Squadron];
  console.error(`Unknown squadron "${raw}". Valid values: ${Object.keys(Squadron).join(", ")}`);
  process.exit(1);
}

function parseLocations(raw: string | undefined): { name: string; code: string }[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((pair) => {
      const [name, code] = pair.split(":");
      return { name: name?.trim() ?? "", code: (code ?? name)?.trim().toUpperCase() ?? "" };
    })
    .filter((loc) => loc.name && loc.code);
}

async function main() {
  const name = required("BOOTSTRAP_ADMIN_NAME");
  const serviceNumber = required("BOOTSTRAP_ADMIN_SERVICE_NUMBER").toUpperCase();
  const email = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const password = required("BOOTSTRAP_ADMIN_PASSWORD");

  if (password.length < 12) {
    console.error("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.count();
  if (existing > 0 && !process.env.BOOTSTRAP_FORCE) {
    console.log(
      `Database already has ${existing} user(s). Nothing to do. Set BOOTSTRAP_FORCE=1 to upsert anyway.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { serviceNumber },
    update: {},
    create: {
      name,
      serviceNumber,
      email,
      passwordHash,
      role: "ADMIN",
      squadron: parseSquadron(process.env.BOOTSTRAP_ADMIN_SQUADRON),
      rank: process.env.BOOTSTRAP_ADMIN_RANK?.trim() || null,
    },
  });

  console.log(`Administrator ready: ${admin.serviceNumber} (${admin.name})`);
  console.log(">>> Change this password after the first sign-in. <<<");

  const locations = parseLocations(process.env.BOOTSTRAP_LOCATIONS);
  for (const location of locations) {
    await prisma.location.upsert({
      where: { code: location.code },
      update: {},
      create: location,
    });
  }
  if (locations.length > 0) {
    console.log(`${locations.length} location(s) created.`);
  }

  console.log("\nBootstrap complete. Add users, locations and horses through the application.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
