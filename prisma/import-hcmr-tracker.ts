/**
 * Import script: HCMR Horse Tracker spreadsheet → Paddock database
 *
 * Reads: 20250117_HCMR_Horse_Tracker.xlsx
 * Imports: horses, locations, health events, feeding plans, health notes, vaccination records
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/import-hcmr-tracker.ts [path-to-xlsx]
 */

import { PrismaClient, Squadron, DutyStation, TaskReadiness, Sex, HorseRole } from "@prisma/client";
import * as XLSX from "xlsx";
import { addMonths } from "date-fns";

const prisma = new PrismaClient();

const XLSX_PATH = process.argv[2] || "/Users/jamesbird/Downloads/20250117_HCMR_Horse_Tracker.xlsx";

// ─── MAPPINGS ─────────────────────────────────────────────────

function parseSquadronDiv(raw: string | null): { squadron: Squadron | null; division: number | null; role: HorseRole | null } {
  if (!raw) return { squadron: null, division: null, role: null };
  const s = raw.trim();
  if (s === "LG 1Div") return { squadron: Squadron.THE_LIFE_GUARDS, division: 1, role: null };
  if (s === "LG 2Div") return { squadron: Squadron.THE_LIFE_GUARDS, division: 2, role: null };
  if (s === "RHGD 1Div") return { squadron: Squadron.THE_BLUES_AND_ROYALS, division: 1, role: null };
  if (s === "RHGD 2Div") return { squadron: Squadron.THE_BLUES_AND_ROYALS, division: 2, role: null };
  if (s === "RMT Sqn") return { squadron: null, division: null, role: HorseRole.RMT };
  // HDiv, Drum Horse, Coach, ETS, Retiring — no squadron mapping
  return { squadron: null, division: null, role: null };
}

function parseTaskReadiness(vetStatus: string | null): TaskReadiness {
  if (!vetStatus) return TaskReadiness.FULL_EXERCISE;
  const s = vetStatus.trim();
  if (s === "VFD") return TaskReadiness.FULL_EXERCISE;
  if (s === "VLD") return TaskReadiness.LIMITED_ROLE;
  // Casting and OTR
  return TaskReadiness.NON_TASKWORTHY;
}

function parseDutyStation(sqnRaw: string | null): DutyStation {
  if (!sqnRaw) return DutyStation.HYDE_PARK_BARRACKS;
  const s = sqnRaw.trim();
  if (s.includes("HCTW") || s === "RMT Sqn") return DutyStation.TRAINING_WING;
  return DutyStation.HYDE_PARK_BARRACKS;
}

const LOCATION_MAP: Record<string, string> = {
  "HPB": "HPB",
  "HCTW": "HCTW",
  "Lakeside Grass": "LAKESIDE_GRASS",
  "Lakeside Working": "LAKESIDE_WORKING",
  "Lilly Mill Farm": "LILLY_MILL",
  "DATR": "DATR",
  "DATR BEC": "DATR_BEC",
  "DATR VTS": "DATR_VTS",
  "DATR WTT": "WTT",
  "DATR Rehoming": "DATR",
  "Bell": "BELL_EQUINE",
  "RMAS": "RMAS",
  "Other": "OTHER",
};

const NEW_LOCATIONS = [
  { name: "Lakeside Grass", code: "LAKESIDE_GRASS" },
  { name: "Lakeside Working", code: "LAKESIDE_WORKING" },
  { name: "Lilly Mill Farm", code: "LILLY_MILL" },
  { name: "RMAS", code: "RMAS" },
  { name: "DATR BEC", code: "DATR_BEC" },
  { name: "DATR VTS", code: "DATR_VTS" },
  { name: "Other", code: "OTHER" },
];

function excelDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date((v - 25569) * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ─── MAIN ─────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${XLSX_PATH}...\n`);
  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true });

  // ─── 1. SEED NEW LOCATIONS ───────────────────────────────────
  console.log("1. Seeding new locations...");
  for (const loc of NEW_LOCATIONS) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  const allLocations = await prisma.location.findMany();
  const locationByCode = Object.fromEntries(allLocations.map((l) => [l.code, l.id]));
  console.log(`   ${allLocations.length} locations total.\n`);

  // ─── 2. PARSE WEIGHT SHEET ───────────────────────────────────
  console.log("2. Parsing Weight sheet...");
  const weightSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Weight"], { header: 1 });
  const weightByReg: Record<string, { weight: number; maxRider: number }> = {};
  for (let i = 1; i < weightSheet.length; i++) {
    const row = weightSheet[i] as unknown as unknown[];
    if (!row || !row[1]) continue;
    const reg = String(row[1]).trim();
    const w = num(row[3]);
    const mr = num(row[4]);
    if (reg && w) {
      weightByReg[reg] = { weight: w, maxRider: mr ?? Math.round(w * 0.15) };
    }
  }
  console.log(`   ${Object.keys(weightByReg).length} weight records.\n`);

  // ─── 3. PARSE FEED SHEET ────────────────────────────────────
  console.log("3. Parsing Feed sheet...");
  const feedSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Feed Sheet"], { header: 1 });
  interface FeedRecord {
    numFeeds: number | null;
    chaff: string;
    releve: string;
    cubes: string;
    balancer: string;
    equijewel: string;
    sugarbeet: string;
    recovery: string;
    supplement: string;
    notes: string;
    bcs: string;
  }
  const feedByReg: Record<string, FeedRecord> = {};
  // Header at row index 1 (row 2), data from index 2
  for (let i = 2; i < feedSheet.length; i++) {
    const row = feedSheet[i] as unknown as unknown[];
    if (!row || !row[1]) continue;
    const reg = String(row[1]).trim();
    feedByReg[reg] = {
      numFeeds: num(row[5]),
      chaff: str(row[6]),
      releve: str(row[7]),
      cubes: str(row[8]),
      balancer: str(row[9]),
      equijewel: str(row[10]),
      sugarbeet: str(row[11]),
      recovery: str(row[12]),
      supplement: str(row[13]),
      notes: str(row[14]),
      bcs: str(row[4]),
    };
  }
  console.log(`   ${Object.keys(feedByReg).length} feed records.\n`);

  // ─── 4. PARSE STRANGLES VACCINES ───────────────────────────
  console.log("4. Parsing Strangles Vaccines...");
  const vaxSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Strangles Vaccines "], { header: 1 });
  interface VaxRecord {
    first: Date | null;
    firstMuscle: string;
    second: Date | null;
    secondMuscle: string;
  }
  const vaxByReg: Record<string, VaxRecord> = {};
  for (let i = 1; i < vaxSheet.length; i++) {
    const row = vaxSheet[i] as unknown as unknown[];
    if (!row || !row[1]) continue;
    const reg = String(row[1]).trim();
    vaxByReg[reg] = {
      first: excelDate(row[3]),
      firstMuscle: str(row[4]),
      second: excelDate(row[5]),
      secondMuscle: str(row[6]),
    };
  }
  console.log(`   ${Object.keys(vaxByReg).length} vaccine records.\n`);

  // ─── 5. PARSE HCMR DETAILS AND CREATE HORSES ───────────────
  console.log("5. Importing horses from HCMR Details...");
  const detailsSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["HCMR Details"], { header: 1 });

  // Get admin user for authored records
  const admin = await prisma.user.findUnique({ where: { serviceNumber: "ADMIN001" } });
  if (!admin) throw new Error("ADMIN001 not found — run production seed first");

  let horsesCreated = 0;
  let horsesSkipped = 0;
  let healthEventsCreated = 0;
  let feedingPlansCreated = 0;
  let healthNotesCreated = 0;
  let medicationRecordsCreated = 0;

  // Data rows start at index 4 (row 5)
  for (let i = 4; i < detailsSheet.length; i++) {
    const row = detailsSheet[i] as unknown as unknown[];
    if (!row || !row[0] || !str(row[0])) continue;

    const horseName = str(row[0]);
    const regNum = str(row[1]);
    const sqnRaw = str(row[2]);
    const vetStatus = str(row[3]);
    const locationRaw = str(row[4]);
    const moveDate = excelDate(row[5]);
    const moveTo = str(row[6]);
    const dob = excelDate(row[7]);
    const lastDental = excelDate(row[8]);
    const dentalReview = num(row[9]); // months
    const dentalDue = excelDate(row[10]);
    const dentalReferral = str(row[12]);
    const cardiacReview = excelDate(row[13]);
    const vaxDue = excelDate(row[14]);
    const sedate = str(row[15]);
    const farriery = str(row[16]);
    const physioDue = excelDate(row[17]);
    const behavioural = str(row[18]);
    const fwecDue = str(row[19]);
    const passoutDate = excelDate(row[20]);
    const comments = str(row[21]);

    if (!regNum) {
      console.log(`   SKIP (no reg number): ${horseName}`);
      horsesSkipped++;
      continue;
    }

    // Check if horse already exists
    const existing = await prisma.horse.findUnique({ where: { regimentalNumber: regNum } });
    if (existing) {
      horsesSkipped++;
      continue;
    }

    // Parse squadron/division
    const { squadron, division, role } = parseSquadronDiv(sqnRaw);
    const taskReadiness = parseTaskReadiness(vetStatus);
    const dutyStation = parseDutyStation(sqnRaw);

    // Resolve location
    const locationCode = LOCATION_MAP[locationRaw] ?? null;
    const currentLocationId = locationCode ? locationByCode[locationCode] ?? null : null;

    // Get weight data
    const weight = weightByReg[regNum];

    // Create horse
    const horse = await prisma.horse.create({
      data: {
        name: horseName,
        regimentalNumber: regNum,
        breed: "Unknown", // not in this spreadsheet
        colour: "Unknown", // not in this spreadsheet
        dateOfBirth: dob ?? new Date("2018-01-01"), // fallback
        serviceEntryDate: passoutDate ?? new Date("2022-01-01"), // passout = service entry
        heightHands: 16.0, // not in this spreadsheet
        weightKg: weight?.weight ?? 580,
        maxRiderWeightKg: weight?.maxRider ?? 90,
        squadron,
        division,
        role,
        dutyStation,
        taskReadiness,
        currentLocationId,
        isActive: vetStatus !== "Casting",
      },
    });

    horsesCreated++;

    // ─── HEALTH EVENTS ──────────────────────────────────────

    // Last dental (completed)
    if (lastDental) {
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: "DENTAL_CHECK",
          status: "COMPLETED",
          scheduledAt: lastDental,
          completedAt: lastDental,
          notes: dentalReferral ? `Referral: ${dentalReferral}` : undefined,
        },
      });
      healthEventsCreated++;
    }

    // Dental due (scheduled)
    if (dentalDue) {
      const now = new Date();
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: "DENTAL_CHECK",
          status: dentalDue < now ? "OVERDUE" : "SCHEDULED",
          scheduledAt: dentalDue,
        },
      });
      healthEventsCreated++;
    }

    // Vaccination due
    if (vaxDue) {
      const now = new Date();
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: "VACCINATION",
          status: vaxDue < now ? "OVERDUE" : "SCHEDULED",
          scheduledAt: vaxDue,
          notes: "Annual vaccination",
        },
      });
      healthEventsCreated++;
    }

    // ─── STRANGLES VACCINES → MEDICATION RECORDS ────────────

    const vax = vaxByReg[regNum];
    if (vax) {
      if (vax.first) {
        await prisma.medicationRecord.create({
          data: {
            horseId: horse.id,
            administeredById: admin.id,
            medicationName: "Strangles Vaccine (1st)",
            dosage: "Standard",
            route: "IM",
            notes: vax.firstMuscle ? `Muscle: ${vax.firstMuscle}` : undefined,
            administeredAt: vax.first,
          },
        });
        medicationRecordsCreated++;
      }
      if (vax.second) {
        await prisma.medicationRecord.create({
          data: {
            horseId: horse.id,
            administeredById: admin.id,
            medicationName: "Strangles Vaccine (2nd)",
            dosage: "Standard",
            route: "IM",
            notes: vax.secondMuscle ? `Muscle: ${vax.secondMuscle}` : undefined,
            administeredAt: vax.second,
          },
        });
        medicationRecordsCreated++;
      }
    }

    // ─── FEEDING PLANS ──────────────────────────────────────

    const feed = feedByReg[regNum];
    if (feed) {
      const feedFreq = feed.numFeeds === 1 ? "ONCE_DAILY"
        : feed.numFeeds === 3 ? "THREE_TIMES_DAILY"
        : "TWICE_DAILY";

      // Build a comprehensive feed description
      const components: string[] = [];
      if (feed.chaff && feed.chaff !== "No Chaff") components.push(`Chaff: ${feed.chaff}`);
      if (feed.chaff === "No Chaff") components.push("No Chaff");
      if (feed.releve) components.push(`Re-Leve: ${feed.releve}`);
      if (feed.cubes) components.push(`Conditioning Cubes: ${feed.cubes}`);
      if (feed.balancer) components.push(`Essential Balancer: ${feed.balancer}g`);
      if (feed.equijewel) components.push(`EquiJewel: ${feed.equijewel}g`);
      if (feed.sugarbeet) components.push(`Sugar Beet: ${feed.sugarbeet}`);
      if (feed.recovery) components.push(`Re-Covery: ${feed.recovery}`);
      if (feed.supplement) components.push(`Supplement: ${feed.supplement}`);

      const specialNotes = [
        feed.bcs ? `BCS: ${feed.bcs}` : "",
        feed.notes ?? "",
        components.length > 0 ? `Components: ${components.join(", ")}` : "",
      ].filter(Boolean).join(". ");

      await prisma.feedingPlan.create({
        data: {
          horseId: horse.id,
          feedType: "HARD_FEED",
          quantityKg: 2.0, // standard ration
          frequency: feedFreq as "ONCE_DAILY" | "TWICE_DAILY" | "THREE_TIMES_DAILY",
          specialNotes: specialNotes || undefined,
          createdById: admin.id,
          isActive: true,
        },
      });
      feedingPlansCreated++;
    }

    // ─── HEALTH NOTES (welfare flags) ───────────────────────

    const notes: string[] = [];
    if (sedate) notes.push(`Sedation: ${sedate}`);
    if (farriery) notes.push(`Remedial Farriery: ${farriery}`);
    if (behavioural) notes.push(`Behavioural: ${behavioural}`);
    if (cardiacReview) notes.push(`Cardiac Review: ${cardiacReview.toISOString().substring(0, 10)}`);
    if (physioDue) notes.push(`Physio Due: ${physioDue.toISOString().substring(0, 10)}`);
    if (fwecDue) notes.push(`FWEC Due: ${fwecDue}`);
    if (comments) notes.push(`Notes: ${comments}`);

    if (notes.length > 0) {
      await prisma.healthNote.create({
        data: {
          horseId: horse.id,
          authorId: admin.id,
          content: `Imported from HCMR Horse Tracker:\n${notes.join("\n")}`,
        },
      });
      healthNotesCreated++;
    }

    if (horsesCreated % 25 === 0) {
      process.stdout.write(`   ${horsesCreated} horses...`);
      process.stdout.write("\r");
    }
  }

  console.log(`\n=== IMPORT COMPLETE ===`);
  console.log(`Horses created:      ${horsesCreated}`);
  console.log(`Horses skipped:      ${horsesSkipped} (duplicate reg or no reg number)`);
  console.log(`Health events:       ${healthEventsCreated}`);
  console.log(`Medication records:  ${medicationRecordsCreated}`);
  console.log(`Feeding plans:       ${feedingPlansCreated}`);
  console.log(`Health notes:        ${healthNotesCreated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
