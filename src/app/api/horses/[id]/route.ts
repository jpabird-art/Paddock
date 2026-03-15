import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  breed: z.string().min(1).optional(),
  colour: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),
  serviceEntryDate: z.string().optional(),
  heightHands: z.coerce.number().optional(),
  weightKg: z.coerce.number().optional(),
  maxRiderWeightKg: z.coerce.number().optional(),
  feedingNotes: z.string().optional(),
  dutyStation: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole();
  if (error) return error;

  const horse = await prisma.horse.findUnique({
    where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("ADMIN", "VET", "OFFICER");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id: params.id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = parse.data;
  const updated = await prisma.horse.update({
    where: { id: params.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      serviceEntryDate: data.serviceEntryDate
        ? new Date(data.serviceEntryDate)
        : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id: params.id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  // Soft delete
  await prisma.horse.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
