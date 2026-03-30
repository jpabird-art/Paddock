import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { seedInitialEvents } from "@/lib/health-scheduler";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { Squadron, DutyStation, TaskReadiness, Sex, HorseRole } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1),
  regimentalNumber: z.string().min(1),
  squadronNumber: z.string().optional(),
  breed: z.string().min(1),
  colour: z.string().min(1),
  dateOfBirth: z.string().min(1),
  serviceEntryDate: z.string().min(1),
  heightHands: z.coerce.number().positive(),
  weightKg: z.coerce.number().positive(),
  maxRiderWeightKg: z.coerce.number().positive(),
  squadron: z.nativeEnum(Squadron),
  dutyStation: z.nativeEnum(DutyStation),
  taskReadiness: z.nativeEnum(TaskReadiness).optional(),
  sex: z.nativeEnum(Sex).optional(),
  role: z.nativeEnum(HorseRole).optional(),
  division: z.coerce.number().min(1).max(2).optional(),
  currentLocationId: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const horses = await prisma.horse.findMany({
    where: { isActive: true },
    include: {
      injuryReports: {
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        select: { id: true, severity: true, status: true },
      },
      healthEvents: {
        where: { status: "OVERDUE" },
        select: { id: true, type: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(horses);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("horse", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const data = parse.data;

  const existing = await prisma.horse.findUnique({
    where: { regimentalNumber: data.regimentalNumber },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A horse with that regimental number already exists." },
      { status: 409 }
    );
  }

  const horse = await prisma.horse.create({
    data: {
      name: data.name,
      regimentalNumber: data.regimentalNumber,
      squadronNumber: data.squadronNumber,
      breed: data.breed,
      colour: data.colour,
      dateOfBirth: new Date(data.dateOfBirth),
      serviceEntryDate: new Date(data.serviceEntryDate),
      heightHands: data.heightHands,
      weightKg: data.weightKg,
      maxRiderWeightKg: data.maxRiderWeightKg,
      squadron: data.squadron,
      dutyStation: data.dutyStation,
      taskReadiness: data.taskReadiness,
      sex: data.sex,
      role: data.role,
      division: data.division,
      currentLocationId: data.currentLocationId,
    },
  });

  // Seed initial health events
  await seedInitialEvents(horse.id, horse.serviceEntryDate);

  // Log initial duty assignment
  if (session) {
    await prisma.dutyAssignment.create({
      data: {
        horseId: horse.id,
        assignedById: session.user.id,
        station: horse.dutyStation,
        notes: "Initial station assignment on intake.",
      },
    });
  }

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "horse",
    entityId: horse.id,
    action: "create",
    after: { name: horse.name, regimentalNumber: horse.regimentalNumber, squadron: horse.squadron, dutyStation: horse.dutyStation },
  });

  return NextResponse.json(horse, { status: 201 });
}
