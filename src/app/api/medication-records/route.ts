import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { MedicationRoute } from "@prisma/client";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  horseId: z.string().min(1),
  medicationName: z.string().min(1),
  dosage: z.string().min(1),
  route: z.nativeEnum(MedicationRoute),
  batchNumber: z.string().optional(),
  withdrawalDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const records = await prisma.medicationRecord.findMany({
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      administeredBy: { select: { id: true, name: true, serviceNumber: true } },
    },
    orderBy: { administeredAt: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("medication_record", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const data: Record<string, unknown> = {
    horseId: parse.data.horseId,
    administeredById: session!.user.id,
    medicationName: parse.data.medicationName,
    dosage: parse.data.dosage,
    route: parse.data.route,
    batchNumber: parse.data.batchNumber,
    withdrawalDays: parse.data.withdrawalDays,
    notes: parse.data.notes,
  };

  if (parse.data.withdrawalDays) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parse.data.withdrawalDays);
    data.withdrawalEndDate = endDate;
  }

  const record = await prisma.medicationRecord.create({
    data: data as Parameters<typeof prisma.medicationRecord.create>[0]["data"],
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      administeredBy: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "medication_record",
    entityId: record.id,
    action: "create",
    after: { horseId: record.horseId, medicationName: record.medicationName, dosage: record.dosage },
  });

  return NextResponse.json(record, { status: 201 });
}
