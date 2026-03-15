import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, subMonths, subYears } from "date-fns";

const prisma = new PrismaClient();

async function main() {
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
    },
  });

  console.log("Users created.");

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
      feedingNotes: "High-energy mix, 3x daily. Supplemented with electrolytes in summer.",
      dutyStation: "KINGS_LIFE_GUARD",
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
      feedingNotes: "Standard military ration. Hay ad lib overnight.",
      dutyStation: "KINGS_LIFE_GUARD",
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
      feedingNotes: "Joint supplement added daily. Reduced grain due to age.",
      dutyStation: "KINGS_LIFE_GUARD",
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
      feedingNotes: "Lucerne chaff added to slow eating. Regular mineral block.",
      dutyStation: "TRAINING_WING",
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
      feedingNotes: "In training programme. Increased feed during intensive work periods.",
      dutyStation: "TRAINING_WING",
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
      feedingNotes: "Sensitive digestion. Gradual feed changes only. No sudden diet shifts.",
      dutyStation: "TRAINING_WING",
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
      feedingNotes: "Senior horse mix. Beet pulp added for fibre. Arthritis supplement daily.",
      dutyStation: "HYDE_PARK_BARRACKS",
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
      feedingNotes: "Standard ration. Good doer – monitor weight carefully.",
      dutyStation: "HYDE_PARK_BARRACKS",
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
      feedingNotes: "High energy needs. Feed 4x daily during ceremonial season.",
      dutyStation: "HYDE_PARK_BARRACKS",
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
      feedingNotes: "Young horse on graduated programme. Oats limited until full fitness.",
      dutyStation: "WINTER_TRAINING",
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
      feedingNotes: "Large frame. Increased roughage. Daily hoof supplement.",
      dutyStation: "WINTER_TRAINING",
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
      feedingNotes: "Competition-level feed during display season. Standard otherwise.",
      dutyStation: "WINTER_TRAINING",
    },
  ];

  const createdHorses: { id: string; serviceEntryDate: Date; name: string }[] = [];

  for (const horseData of horsesData) {
    const existing = await prisma.horse.findUnique({
      where: { regimentalNumber: horseData.regimentalNumber },
    });

    if (!existing) {
      const horse = await prisma.horse.create({ data: horseData });
      createdHorses.push({ id: horse.id, serviceEntryDate: horse.serviceEntryDate, name: horse.name });
    } else {
      createdHorses.push({ id: existing.id, serviceEntryDate: existing.serviceEntryDate, name: existing.name });
    }
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
          type: "DENTAL_CHECK",
          status: "COMPLETED",
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
          type: "DENTAL_CHECK",
          status: isOverdue ? "OVERDUE" : "SCHEDULED",
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
          type: "VET_CHECKUP",
          status: "COMPLETED",
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
          type: "VET_CHECKUP",
          status: isOverdue ? "OVERDUE" : "SCHEDULED",
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
          type: "FARRIERY",
          status: "COMPLETED",
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
          type: "FARRIERY",
          status: isOverdue ? "OVERDUE" : "SCHEDULED",
          scheduledAt: lastFarriery,
        },
      });
    }
  }

  console.log("Health events seeded.");

  // Create 2 open injury reports
  const sovereignHorse = createdHorses.find((h) => h.name === "Sovereign");
  const templarHorse = createdHorses.find((h) => h.name === "Templar");

  if (sovereignHorse) {
    const existing = await prisma.injuryReport.findFirst({
      where: { horseId: sovereignHorse.id, status: "OPEN" },
    });
    if (!existing) {
      const injury1 = await prisma.injuryReport.create({
        data: {
          horseId: sovereignHorse.id,
          reportedById: trooper1.id,
          severity: "MODERATE",
          status: "OPEN",
          description: "Swelling observed on right foreleg, below knee. Horse showing slight lameness at trot. Possible soft tissue injury following yesterday's ceremonial duty.",
          bodyLocation: "Right Foreleg",
        },
      });

      // Notify vets
      await prisma.injuryNotification.create({
        data: {
          injuryReportId: injury1.id,
          recipientId: vet.id,
        },
      });
      await prisma.injuryNotification.create({
        data: {
          injuryReportId: injury1.id,
          recipientId: admin.id,
        },
      });
    }
  }

  if (templarHorse) {
    const existing = await prisma.injuryReport.findFirst({
      where: { horseId: templarHorse.id, status: "OPEN" },
    });
    if (!existing) {
      const injury2 = await prisma.injuryReport.create({
        data: {
          horseId: templarHorse.id,
          reportedById: trooper2.id,
          severity: "MINOR",
          status: "UNDER_REVIEW",
          description: "Minor abrasion to left shoulder, approximately 5cm. Caused by ill-fitting breast collar during last parade. Wound clean but requires monitoring.",
          bodyLocation: "Left Shoulder",
        },
      });

      await prisma.injuryNotification.create({
        data: {
          injuryReportId: injury2.id,
          recipientId: vet.id,
        },
      });
    }
  }

  console.log("Injury reports created.");
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
