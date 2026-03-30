import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { Squadron, TaskReadiness, Sex, HorseRole } from "@prisma/client";
import { deactivateHorse } from "@/lib/horse-services";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  squadronNumber: z.string().nullable().optional(),
  breed: z.string().min(1).optional(),
  colour: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  serviceEntryDate: z.string().optional(),
  heightHands: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  maxRiderWeightKg: z.coerce.number().positive().optional(),
  squadron: z.nativeEnum(Squadron).optional(),
  taskReadiness: z.nativeEnum(TaskReadiness).optional(),
  isActive: z.boolean().optional(),
  ancillaries: z.string().nullable().optional(),
  sex: z.nativeEnum(Sex).nullable().optional(),
  role: z.nativeEnum(HorseRole).nullable().optional(),
  division: z.coerce.number().min(1).max(2).nullable().optional(),
  currentLocationId: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requireAuth();
  if (error) return error;

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      healthEvents: {
        orderBy: { scheduledAt: "desc" },
      },
      healthNotes: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      injuryReports: {
        include: {
          reportedBy: { select: { name: true, serviceNumber: true } },
          resolvedBy: { select: { name: true, serviceNumber: true } },
        },
        orderBy: { reportedAt: "desc" },
      },
    },
  });

  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  return NextResponse.json(horse);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requirePermission("horse", "update");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const data = parse.data;

  const updated = await prisma.horse.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      serviceEntryDate: data.serviceEntryDate
        ? new Date(data.serviceEntryDate)
        : undefined,
    },
  });

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "horse",
    entityId: id,
    action: "update",
    before: { name: horse.name, squadron: horse.squadron, isActive: horse.isActive },
    after: { name: updated.name, squadron: updated.squadron, isActive: updated.isActive },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requirePermission("horse", "delete");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  await deactivateHorse(id);

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "horse",
    entityId: id,
    action: "soft_delete",
    before: { name: horse.name, isActive: true },
    after: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
