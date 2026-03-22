import {
  PrismaClient,
  DutyStation,
  FeedType,
  FeedFrequency,
  MedicationRoute,
  InspectionResult,
  HealthEventStatus,
  HealthEventType,
  InjurySeverity,
  InjuryStatus,
  TackType,
  TackCondition,
  Squadron,
  TaskReadiness,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths, subYears } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR: Seed script cannot run in production. Set SEED_FORCE=1 to override.");
    if (!process.env.SEED_FORCE) process.exit(1);
  }

  console.log("Seeding database...");

  // Create users
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { serviceNumber: "ADMIN001" },
    update: {},
    create: {
      name: "Major James Hartley",
      serviceNumber: "ADMIN001",
      email: "j.hartley@hcmr.mod.uk",
      passwordHash,
      role: "ADMIN",
      squadron: Squadron.THE_LIFE_GUARDS,
    },
  });

  const vet = await prisma.user.upsert({
    where: { serviceNumber: "VET001" },
    update: {},
    create: {
      name: "Capt Sarah Chen",
      serviceNumber: "VET001",
      email: "s.chen@hcmr.mod.uk",
      passwordHash,
      role: "VET",
      squadron: null,
    },
  });

  const officer = await prisma.user.upsert({
    where: { serviceNumber: "OFF001" },
    update: {},
    create: {
      name: "Lt Col Robert Pemberton",
      serviceNumber: "OFF001",
      email: "r.pemberton@hcmr.mod.uk",
      passwordHash,
      role: "OFFICER",
      squadron: Squadron.THE_BLUES_AND_ROYALS,
    },
  });

  const trooper1 = await prisma.user.upsert({
    where: { serviceNumber: "TRP001" },
    update: {},
    create: {
      name: "Tpr Daniel Walsh",
      serviceNumber: "TRP001",
      email: "d.walsh@hcmr.mod.uk",
      passwordHash,
      role: "TROOPER",
      squadron: Squadron.THE_LIFE_GUARDS,
    },
  });

  const trooper2 = await prisma.user.upsert({
    where: { serviceNumber: "TRP002" },
    update: {},
    create: {
      name: "Tpr Emily Brooks",
      serviceNumber: "TRP002",
      email: "e.brooks@hcmr.mod.uk",
      passwordHash,
      role: "TROOPER",
      squadron: Squadron.THE_BLUES_AND_ROYALS,
    },
  });

  console.log("Users created.");

  // ─── LOCATIONS ──────────────────────────────────────────────────────
  const locationsData = [
    { name: "Hyde Park Barracks", code: "HPB" },
    { name: "Household Cavalry Training Wing", code: "HCTW" },
    { name: "Working Livery", code: "WORKING_LIVERY" },
    { name: "Winter Training Troop", code: "WTT" },
    { name: "Defence Animal Training Regiment", code: "DATR" },
    { name: "Grass", code: "GRASS" },
    { name: "Bell Equine Hospital", code: "BELL_EQUINE" },
  ];

  for (const loc of locationsData) {
    await prisma.location.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  console.log("Locations seeded.");

  // Horse data
  const horsesData = [
    {
      name: "Sovereign",
      regimentalNumber: "HCMR-001",
      breed: "Irish Draught",
      colour: "Black",
      dateOfBirth: new Date("2015-04-12"),
      serviceEntryDate: new Date("2018-09-01"),
      heightHands: 16.2,
      weightKg: 580,
      maxRiderWeightKg: 95,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Monty",
      regimentalNumber: "HCMR-002",
      breed: "Hanoverian",
      colour: "Bay",
      dateOfBirth: new Date("2016-06-22"),
      serviceEntryDate: new Date("2019-03-15"),
      heightHands: 16.1,
      weightKg: 560,
      maxRiderWeightKg: 90,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Wellington",
      regimentalNumber: "HCMR-003",
      breed: "Thoroughbred Cross",
      colour: "Grey",
      dateOfBirth: new Date("2014-03-08"),
      serviceEntryDate: new Date("2017-06-01"),
      heightHands: 16.3,
      weightKg: 595,
      maxRiderWeightKg: 100,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Hercules",
      regimentalNumber: "HCMR-004",
      breed: "Cleveland Bay",
      colour: "Bay",
      dateOfBirth: new Date("2017-02-14"),
      serviceEntryDate: new Date("2020-04-10"),
      heightHands: 16.2,
      weightKg: 610,
      maxRiderWeightKg: 100,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Ramrod",
      regimentalNumber: "HCMR-005",
      breed: "Irish Draught",
      colour: "Black",
      dateOfBirth: new Date("2018-07-30"),
      serviceEntryDate: new Date("2021-08-01"),
      heightHands: 16.0,
      weightKg: 545,
      maxRiderWeightKg: 88,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Sable",
      regimentalNumber: "HCMR-006",
      breed: "Warmblood",
      colour: "Black",
      dateOfBirth: new Date("2016-11-05"),
      serviceEntryDate: new Date("2019-10-20"),
      heightHands: 16.1,
      weightKg: 570,
      maxRiderWeightKg: 92,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Churchill",
      regimentalNumber: "HCMR-007",
      breed: "Irish Draught",
      colour: "Grey",
      dateOfBirth: new Date("2013-09-18"),
      serviceEntryDate: new Date("2016-05-01"),
      heightHands: 16.2,
      weightKg: 600,
      maxRiderWeightKg: 98,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Parade",
      regimentalNumber: "HCMR-008",
      breed: "Hanoverian",
      colour: "Bay",
      dateOfBirth: new Date("2015-12-01"),
      serviceEntryDate: new Date("2018-11-15"),
      heightHands: 16.0,
      weightKg: 555,
      maxRiderWeightKg: 90,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Templar",
      regimentalNumber: "HCMR-009",
      breed: "Thoroughbred Cross",
      colour: "Chestnut",
      dateOfBirth: new Date("2017-08-20"),
      serviceEntryDate: new Date("2020-07-01"),
      heightHands: 16.1,
      weightKg: 540,
      maxRiderWeightKg: 87,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Gallant",
      regimentalNumber: "HCMR-010",
      breed: "Cleveland Bay",
      colour: "Bay",
      dateOfBirth: new Date("2019-01-15"),
      serviceEntryDate: new Date("2022-03-01"),
      heightHands: 15.3,
      weightKg: 520,
      maxRiderWeightKg: 85,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Ironside",
      regimentalNumber: "HCMR-011",
      breed: "Irish Draught",
      colour: "Black",
      dateOfBirth: new Date("2018-04-08"),
      serviceEntryDate: new Date("2021-01-15"),
      heightHands: 16.3,
      weightKg: 625,
      maxRiderWeightKg: 102,
      squadron: Squadron.THE_LIFE_GUARDS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
    {
      name: "Valiant",
      regimentalNumber: "HCMR-012",
      breed: "Warmblood",
      colour: "Bay",
      dateOfBirth: new Date("2016-05-25"),
      serviceEntryDate: new Date("2019-06-10"),
      heightHands: 16.2,
      weightKg: 575,
      maxRiderWeightKg: 93,
      squadron: Squadron.THE_BLUES_AND_ROYALS,
      dutyStation: DutyStation.HYDE_PARK_BARRACKS,
      taskReadiness: TaskReadiness.FULLY_FIT,
    },
  ];

  // Look up HPB location for currentLocationId
  const hpbLocation = await prisma.location.findUnique({ where: { code: "HPB" } });
  if (!hpbLocation) throw new Error("HPB location not found — ensure locations are seeded first");

  const createdHorses: { id: string; serviceEntryDate: Date; name: string }[] = [];

  for (const horseData of horsesData) {
    const dataWithLocation = { ...horseData, currentLocationId: hpbLocation.id };
    const horse = await prisma.horse.upsert({
      where: { regimentalNumber: horseData.regimentalNumber },
      update: {
        dutyStation: horseData.dutyStation,
        taskReadiness: horseData.taskReadiness ?? TaskReadiness.FULLY_FIT,
        currentLocationId: hpbLocation.id,
      },
      create: dataWithLocation,
    });
    createdHorses.push({ id: horse.id, serviceEntryDate: horse.serviceEntryDate, name: horse.name });
  }

  console.log(`${createdHorses.length} horses ready.`);

  // Seed health events for each horse
  for (const horse of createdHorses) {
    const existingEvents = await prisma.healthEvent.count({ where: { horseId: horse.id } });
    if (existingEvents > 0) continue;

    const entry = horse.serviceEntryDate;
    const now = new Date("2026-03-15");

    // DENTAL_CHECK: every 180 days
    // Seed past completed events and next scheduled
    const dentalEvents = [];
    let dentalDate = new Date(entry);
    while (dentalDate < now) {
      dentalEvents.push(new Date(dentalDate));
      dentalDate = addDays(dentalDate, 180);
    }
    // Create completed past events
    for (let i = 0; i < dentalEvents.length - 1; i++) {
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.DENTAL_CHECK,
          status: HealthEventStatus.COMPLETED,
          scheduledAt: dentalEvents[i],
          completedAt: addDays(dentalEvents[i], 1),
          notes: "Routine dental check completed.",
          performedBy: "Capt Sarah Chen",
        },
      });
    }
    // Last past one - overdue or upcoming
    if (dentalEvents.length > 0) {
      const lastDental = dentalEvents[dentalEvents.length - 1];
      const isOverdue = lastDental < now;
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.DENTAL_CHECK,
          status: isOverdue ? HealthEventStatus.OVERDUE : HealthEventStatus.SCHEDULED,
          scheduledAt: lastDental,
        },
      });
    }

    // VET_CHECKUP: every 365 days
    const vetEvents = [];
    let vetDate = new Date(entry);
    while (vetDate < now) {
      vetEvents.push(new Date(vetDate));
      vetDate = addDays(vetDate, 365);
    }
    for (let i = 0; i < vetEvents.length - 1; i++) {
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.VET_CHECKUP,
          status: HealthEventStatus.COMPLETED,
          scheduledAt: vetEvents[i],
          completedAt: addDays(vetEvents[i], 2),
          notes: "Annual veterinary examination completed.",
          performedBy: "Capt Sarah Chen",
        },
      });
    }
    if (vetEvents.length > 0) {
      const lastVet = vetEvents[vetEvents.length - 1];
      const isOverdue = lastVet < now;
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.VET_CHECKUP,
          status: isOverdue ? HealthEventStatus.OVERDUE : HealthEventStatus.SCHEDULED,
          scheduledAt: lastVet,
        },
      });
    }

    // FARRIERY: every 42 days
    const farrieryEvents = [];
    let farrierDate = new Date(entry);
    while (farrierDate < now) {
      farrieryEvents.push(new Date(farrierDate));
      farrierDate = addDays(farrierDate, 42);
    }
    for (let i = 0; i < farrieryEvents.length - 1; i++) {
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.FARRIERY,
          status: HealthEventStatus.COMPLETED,
          scheduledAt: farrieryEvents[i],
          completedAt: addDays(farrieryEvents[i], 1),
          notes: "Shoeing and hoof trimming completed.",
          performedBy: "Regimental Farrier",
        },
      });
    }
    if (farrieryEvents.length > 0) {
      const lastFarriery = farrieryEvents[farrieryEvents.length - 1];
      const isOverdue = lastFarriery < now;
      await prisma.healthEvent.create({
        data: {
          horseId: horse.id,
          type: HealthEventType.FARRIERY,
          status: isOverdue ? HealthEventStatus.OVERDUE : HealthEventStatus.SCHEDULED,
          scheduledAt: lastFarriery,
        },
      });
    }
  }

  console.log("Health events seeded.");

  // ─── Reference date ──────────────────────────────────────────────────
  const now = new Date("2026-03-15");

  // Helper to find horse by name
  const horseByName = (name: string) => {
    const h = createdHorses.find((h) => h.name === name);
    if (!h) throw new Error(`Horse ${name} not found`);
    return h;
  };

  // Clear any existing open injuries and create 3 resolved ones for demo
  await prisma.injuryNotification.deleteMany({});
  await prisma.injuryReport.deleteMany({});

  const resolvedInjuries = [
    {
      horseId: horseByName("Sovereign").id,
      reportedById: trooper1.id,
      severity: InjurySeverity.MODERATE,
      status: InjuryStatus.RESOLVED,
      description: "Swelling observed on right foreleg, below knee. Horse showed slight lameness at trot. Soft tissue injury following ceremonial duty.",
      bodyLocation: "Right Foreleg",
      reportedAt: subDays(now, 45),
      resolvedAt: subDays(now, 20),
      resolvedById: vet.id,
      resolutionNote: "Swelling resolved after 3 weeks box rest and cold hosing. Full soundness confirmed at trot-up.",
    },
    {
      horseId: horseByName("Templar").id,
      reportedById: trooper2.id,
      severity: InjurySeverity.MINOR,
      status: InjuryStatus.RESOLVED,
      description: "Minor abrasion to left shoulder, approximately 5cm. Caused by ill-fitting breast collar during last parade. Wound clean.",
      bodyLocation: "Left Shoulder",
      reportedAt: subDays(now, 30),
      resolvedAt: subDays(now, 14),
      resolvedById: vet.id,
      resolutionNote: "Healed cleanly. Breast collar refitted by saddler.",
    },
    {
      horseId: horseByName("Wellington").id,
      reportedById: trooper1.id,
      severity: InjurySeverity.MINOR,
      status: InjuryStatus.RESOLVED,
      description: "Small cut to right hind coronet band, likely from overreach during schooling.",
      bodyLocation: "Right Hind",
      reportedAt: subDays(now, 60),
      resolvedAt: subDays(now, 42),
      resolvedById: vet.id,
      resolutionNote: "Healed without complication. Overreach boots now fitted for schooling sessions.",
    },
  ];

  for (const injury of resolvedInjuries) {
    await prisma.injuryReport.create({ data: injury });
  }

  console.log("Resolved injury reports created.");

  // ─── 1. DUTY ASSIGNMENTS (historical + current at HPB) ──────────────
  // Clear and re-seed for demo consistency
  await prisma.dutyAssignment.deleteMany({});

  const dutyAssignmentsData = [
    // Sovereign: TRAINING_WING 2018-09 -> 2020-01, then HPB from 2020-01
    {
      horseId: horseByName("Sovereign").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2018-09-01"),
      endDate: new Date("2020-01-15"),
      notes: "Initial training assignment upon entry to service",
    },
    {
      horseId: horseByName("Sovereign").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2020-01-15"),
      notes: "Posted to Hyde Park Barracks after completing training",
    },
    // Monty: TRAINING_WING 2019-03 -> 2020-09, then HPB from 2020-09
    {
      horseId: horseByName("Monty").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2019-03-15"),
      endDate: new Date("2020-09-01"),
      notes: "Initial training period",
    },
    {
      horseId: horseByName("Monty").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2020-09-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Wellington: TRAINING_WING 2017-06 -> 2019-03, then HPB from 2019-03
    {
      horseId: horseByName("Wellington").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2017-06-01"),
      endDate: new Date("2019-03-01"),
      notes: "Initial training assignment",
    },
    {
      horseId: horseByName("Wellington").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2019-03-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Hercules: TRAINING_WING 2020-04 -> 2022-06, then HPB from 2022-06
    {
      horseId: horseByName("Hercules").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2020-04-10"),
      endDate: new Date("2022-06-01"),
      notes: "Initial training period",
    },
    {
      horseId: horseByName("Hercules").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2022-06-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Ramrod: TRAINING_WING 2021-08 -> 2023-04, then HPB from 2023-04
    {
      horseId: horseByName("Ramrod").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2021-08-01"),
      endDate: new Date("2023-04-01"),
      notes: "Initial training period",
    },
    {
      horseId: horseByName("Ramrod").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2023-04-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Sable: TRAINING_WING 2019-10 -> 2021-06, then HPB from 2021-06
    {
      horseId: horseByName("Sable").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2019-10-20"),
      endDate: new Date("2021-06-01"),
      notes: "Training assignment",
    },
    {
      horseId: horseByName("Sable").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2021-06-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Churchill: HPB from 2016-05 (long-serving)
    {
      horseId: horseByName("Churchill").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2016-05-01"),
      notes: "Posted to Hyde Park Barracks on entry to service",
    },
    // Parade: HPB from 2018-11
    {
      horseId: horseByName("Parade").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2018-11-15"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Templar: TRAINING_WING 2020-07 -> 2022-01, then HPB from 2022-01
    {
      horseId: horseByName("Templar").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2020-07-01"),
      endDate: new Date("2022-01-01"),
      notes: "Initial training period",
    },
    {
      horseId: horseByName("Templar").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2022-01-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Gallant: TRAINING_WING 2022-03 -> 2024-01, then HPB from 2024-01
    {
      horseId: horseByName("Gallant").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2022-03-01"),
      endDate: new Date("2024-01-01"),
      notes: "Training programme",
    },
    {
      horseId: horseByName("Gallant").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2024-01-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Ironside: TRAINING_WING 2021-01 -> 2023-06, then HPB from 2023-06
    {
      horseId: horseByName("Ironside").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2021-01-15"),
      endDate: new Date("2023-06-01"),
      notes: "Training assignment",
    },
    {
      horseId: horseByName("Ironside").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2023-06-01"),
      notes: "Posted to Hyde Park Barracks",
    },
    // Valiant: TRAINING_WING 2019-06 -> 2021-03, then HPB from 2021-03
    {
      horseId: horseByName("Valiant").id,
      assignedById: admin.id,
      station: DutyStation.TRAINING_WING,
      startDate: new Date("2019-06-10"),
      endDate: new Date("2021-03-01"),
      notes: "Training period",
    },
    {
      horseId: horseByName("Valiant").id,
      assignedById: admin.id,
      station: DutyStation.HYDE_PARK_BARRACKS,
      startDate: new Date("2021-03-01"),
      notes: "Posted to Hyde Park Barracks",
    },
  ];

  for (const da of dutyAssignmentsData) {
    await prisma.dutyAssignment.create({ data: da });
  }
  console.log("Duty assignments seeded.");

  // ─── 2. RIDER ASSIGNMENTS ───────────────────────────────────────────
  const existingRiderAssignments = await prisma.riderAssignment.count();
  if (existingRiderAssignments === 0) {
    const riderAssignmentsData = [
      // Tpr Daniel Walsh assigned to Sovereign (current)
      {
        horseId: horseByName("Sovereign").id,
        riderId: trooper1.id,
        suitabilityScore: 4,
        startDate: new Date("2024-06-01"),
        notes: "Primary rider for ceremonial duties",
      },
      // Tpr Emily Brooks assigned to Monty (current)
      {
        horseId: horseByName("Monty").id,
        riderId: trooper2.id,
        suitabilityScore: 5,
        startDate: new Date("2024-03-15"),
        notes: "Excellent pairing, strong bond",
      },
      // Tpr Daniel Walsh previously assigned to Hercules (historical)
      {
        horseId: horseByName("Hercules").id,
        riderId: trooper1.id,
        suitabilityScore: 3,
        startDate: new Date("2023-01-01"),
        endDate: new Date("2024-05-31"),
        notes: "Transferred to Sovereign for ceremonial duties",
      },
      // Tpr Emily Brooks assigned to Templar (current)
      {
        horseId: horseByName("Templar").id,
        riderId: trooper2.id,
        suitabilityScore: 4,
        startDate: new Date("2025-01-10"),
        notes: "Secondary mount for Hyde Park duties",
      },
    ];

    for (const ra of riderAssignmentsData) {
      await prisma.riderAssignment.create({ data: ra });
    }
    console.log("Rider assignments seeded.");
  } else {
    console.log("Rider assignments already exist, skipping.");
  }

  // ─── 3. FEEDING PLANS ───────────────────────────────────────────────
  const existingFeedingPlans = await prisma.feedingPlan.count();
  if (existingFeedingPlans === 0) {
    const feedingPlansData = [
      // Sovereign
      {
        horseId: horseByName("Sovereign").id,
        feedType: FeedType.HIGH_ENERGY_MIX,
        quantityKg: 3.5,
        frequency: FeedFrequency.THREE_TIMES_DAILY,
        timeOfDay: "0600, 1200, 1800",
        specialNotes: "Supplemented with electrolytes in summer",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      {
        horseId: horseByName("Sovereign").id,
        feedType: FeedType.HAY,
        quantityKg: 8.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: "Ad lib overnight",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      // Monty
      {
        horseId: horseByName("Monty").id,
        feedType: FeedType.HARD_FEED,
        quantityKg: 3.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0600, 1800",
        specialNotes: null,
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      {
        horseId: horseByName("Monty").id,
        feedType: FeedType.HAY,
        quantityKg: 9.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: "Ad lib overnight",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      // Wellington
      {
        horseId: horseByName("Wellington").id,
        feedType: FeedType.OTHER,
        quantityKg: 2.5,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0600, 1800",
        specialNotes: "Joint supplement added daily. Reduced grain due to age.",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-06-01"),
      },
      {
        horseId: horseByName("Wellington").id,
        feedType: FeedType.HAY,
        quantityKg: 10.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: "High fibre content. Ad lib overnight.",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-06-01"),
      },
      {
        horseId: horseByName("Wellington").id,
        feedType: FeedType.BEET_PULP,
        quantityKg: 1.0,
        frequency: FeedFrequency.ONCE_DAILY,
        timeOfDay: "1200",
        specialNotes: "Soaked before feeding. Good for fibre and hydration.",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-06-01"),
      },
      // Hercules
      {
        horseId: horseByName("Hercules").id,
        feedType: FeedType.HARD_FEED,
        quantityKg: 3.5,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0600, 1800",
        specialNotes: "Lucerne chaff added to slow eating",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      {
        horseId: horseByName("Hercules").id,
        feedType: FeedType.HAY,
        quantityKg: 9.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: "Regular mineral block access",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      // Ramrod
      {
        horseId: horseByName("Ramrod").id,
        feedType: FeedType.HIGH_ENERGY_MIX,
        quantityKg: 4.0,
        frequency: FeedFrequency.THREE_TIMES_DAILY,
        timeOfDay: "0600, 1200, 1800",
        specialNotes: "Increased feed during intensive work periods",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-03-01"),
      },
      {
        horseId: horseByName("Ramrod").id,
        feedType: FeedType.HAY,
        quantityKg: 8.0,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: null,
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-03-01"),
      },
      // Sable
      {
        horseId: horseByName("Sable").id,
        feedType: FeedType.OTHER,
        quantityKg: 2.5,
        frequency: FeedFrequency.THREE_TIMES_DAILY,
        timeOfDay: "0600, 1200, 1800",
        specialNotes: "Sensitive digestion. Gradual feed changes only. No sudden diet shifts.",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
      {
        horseId: horseByName("Sable").id,
        feedType: FeedType.HAY,
        quantityKg: 8.5,
        frequency: FeedFrequency.TWICE_DAILY,
        timeOfDay: "0800, 2000",
        specialNotes: "High quality meadow hay only",
        isActive: true,
        createdById: admin.id,
        startDate: new Date("2024-01-01"),
      },
    ];

    for (const fp of feedingPlansData) {
      await prisma.feedingPlan.create({ data: fp });
    }
    console.log("Feeding plans seeded.");
  } else {
    console.log("Feeding plans already exist, skipping.");
  }

  // ─── 4. MEDICATION RECORDS ──────────────────────────────────────────
  const existingMedicationRecords = await prisma.medicationRecord.count();
  if (existingMedicationRecords === 0) {
    const medicationRecordsData = [
      // Sovereign: Phenylbutazone (Bute), 5 days ago
      {
        horseId: horseByName("Sovereign").id,
        administeredById: vet.id,
        medicationName: "Phenylbutazone",
        dosage: "2g",
        route: MedicationRoute.ORAL,
        batchNumber: "PB-2026-0142",
        withdrawalDays: 7,
        withdrawalEndDate: addDays(subDays(now, 5), 7),
        notes: "Administered for mild lameness following ceremonial duty",
        administeredAt: subDays(now, 5),
      },
      // Templar: Dexamethasone, 10 days ago
      {
        horseId: horseByName("Templar").id,
        administeredById: vet.id,
        medicationName: "Dexamethasone",
        dosage: "20mg",
        route: MedicationRoute.IV,
        batchNumber: "DX-2026-0088",
        withdrawalDays: 14,
        withdrawalEndDate: addDays(subDays(now, 10), 14),
        notes: "Anti-inflammatory treatment",
        administeredAt: subDays(now, 10),
      },
      // Wellington: Equivac 2in1, 30 days ago
      {
        horseId: horseByName("Wellington").id,
        administeredById: vet.id,
        medicationName: "Equivac 2in1",
        dosage: "1ml",
        route: MedicationRoute.IM,
        batchNumber: "EV-2026-0201",
        withdrawalDays: 0,
        withdrawalEndDate: subDays(now, 30),
        notes: "Annual vaccination",
        administeredAt: subDays(now, 30),
      },
    ];

    for (const mr of medicationRecordsData) {
      await prisma.medicationRecord.create({ data: mr });
    }
    console.log("Medication records seeded.");
  } else {
    console.log("Medication records already exist, skipping.");
  }

  // ─── 5. TACK ITEMS + TACK ALLOCATIONS ──────────────────────────────
  const existingTackItems = await prisma.tackItem.count();
  if (existingTackItems === 0) {
    // Create saddles
    const saddles = [];
    for (let i = 1; i <= 6; i++) {
      const saddle = await prisma.tackItem.create({
        data: {
          type: TackType.SADDLE,
          identifier: `SDG-00${i}`,
          brand: "George Parker",
          condition: TackCondition.SERVICEABLE,
          notes: `Military saddle #${i}`,
        },
      });
      saddles.push(saddle);
    }

    // Create bridles (6 serviceable + 1 needing repair)
    const bridles = [];
    for (let i = 1; i <= 6; i++) {
      const bridle = await prisma.tackItem.create({
        data: {
          type: TackType.BRIDLE,
          identifier: `BDL-00${i}`,
          brand: "Saddlers Row",
          condition: TackCondition.SERVICEABLE,
          notes: `Standard bridle #${i}`,
        },
      });
      bridles.push(bridle);
    }
    const bridleRepair = await prisma.tackItem.create({
      data: {
        type: TackType.BRIDLE,
        identifier: "BDL-007",
        brand: "Saddlers Row",
        condition: TackCondition.REPAIR_NEEDED,
        notes: "Browband stitching coming loose. Sent for repair.",
      },
    });

    // Create breastplates
    const breastplates = [];
    for (let i = 1; i <= 3; i++) {
      const breastplate = await prisma.tackItem.create({
        data: {
          type: TackType.BREASTPLATE,
          identifier: `BRP-00${i}`,
          brand: "George Parker",
          condition: TackCondition.SERVICEABLE,
          notes: `Breastplate #${i}`,
        },
      });
      breastplates.push(breastplate);
    }

    console.log("Tack items seeded.");

    // Tack allocations
    const tackAllocationsData = [
      // Saddles
      { tackItemId: saddles[0].id, horseId: horseByName("Sovereign").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      { tackItemId: saddles[1].id, horseId: horseByName("Monty").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      { tackItemId: saddles[2].id, horseId: horseByName("Wellington").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      // Bridles
      { tackItemId: bridles[0].id, horseId: horseByName("Sovereign").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      { tackItemId: bridles[1].id, horseId: horseByName("Monty").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      { tackItemId: bridles[2].id, horseId: horseByName("Wellington").id, assignedById: admin.id, startDate: new Date("2024-01-15") },
      // Breastplate to Sovereign
      {
        tackItemId: breastplates[0].id,
        horseId: horseByName("Sovereign").id,
        assignedById: admin.id,
        startDate: new Date("2024-01-15"),
        fitNotes: "Adjusted for ceremonial duties",
      },
    ];

    for (const ta of tackAllocationsData) {
      await prisma.tackAllocation.create({ data: ta });
    }
    console.log("Tack allocations seeded.");
  } else {
    console.log("Tack items already exist, skipping.");
  }

  // ─── 6. INSPECTION SCHEDULES + INSPECTIONS ──────────────────────────
  const existingInspectionSchedules = await prisma.inspectionSchedule.count();
  if (existingInspectionSchedules === 0) {
    const weeklyStable = await prisma.inspectionSchedule.create({
      data: {
        name: "Weekly Stable Inspection",
        description: "Routine weekly check of stable conditions, horse welfare, and equipment",
        frequencyDays: 7,
        isActive: true,
        createdById: admin.id,
      },
    });

    const monthlyKit = await prisma.inspectionSchedule.create({
      data: {
        name: "Monthly Kit Inspection",
        description: "Monthly inspection of all tack and equipment for serviceability",
        frequencyDays: 30,
        isActive: true,
        createdById: admin.id,
      },
    });

    const quarterlyFitness = await prisma.inspectionSchedule.create({
      data: {
        name: "Quarterly Fitness Assessment",
        description: "Comprehensive fitness and condition assessment for all horses",
        frequencyDays: 90,
        isActive: true,
        createdById: admin.id,
      },
    });

    console.log("Inspection schedules seeded.");

    // Create inspection records
    const inspectionsData = [
      // Weekly stable inspection for Sovereign, PASS, 3 days ago
      {
        inspectionScheduleId: weeklyStable.id,
        horseId: horseByName("Sovereign").id,
        inspectorId: officer.id,
        result: InspectionResult.PASS,
        findings: null,
        scheduledDate: subDays(now, 3),
        completedAt: subDays(now, 3),
      },
      // Weekly stable inspection for Monty, ADVISORY, 3 days ago
      {
        inspectionScheduleId: weeklyStable.id,
        horseId: horseByName("Monty").id,
        inspectorId: officer.id,
        result: InspectionResult.ADVISORY,
        findings: "Bedding requires replacement",
        scheduledDate: subDays(now, 3),
        completedAt: subDays(now, 3),
      },
      // Monthly kit inspection for Sovereign, PASS, 2 weeks ago
      {
        inspectionScheduleId: monthlyKit.id,
        horseId: horseByName("Sovereign").id,
        inspectorId: officer.id,
        result: InspectionResult.PASS,
        findings: null,
        scheduledDate: subDays(now, 14),
        completedAt: subDays(now, 14),
      },
      // Quarterly fitness for Wellington, PASS, 1 month ago
      {
        inspectionScheduleId: quarterlyFitness.id,
        horseId: horseByName("Wellington").id,
        inspectorId: officer.id,
        result: InspectionResult.PASS,
        findings: "Good condition for age. Monitor left hind",
        scheduledDate: subMonths(now, 1),
        completedAt: subMonths(now, 1),
      },
    ];

    for (const insp of inspectionsData) {
      await prisma.inspection.create({ data: insp });
    }
    console.log("Inspections seeded.");
  } else {
    console.log("Inspection schedules already exist, skipping.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
