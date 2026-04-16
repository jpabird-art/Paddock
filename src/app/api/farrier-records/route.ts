import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  horseId: z.string().min(1),
  serviceDate: z.string().min(1),
  shoeType: z.string().optional(),
  hoofCondition: z.string().optional(),
  farrierName: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const horseId = searchParams.get("horseId");

  const where: Record<string, unknown> = {};
  if (horseId) where.horseId = horseId;

  const records = await prisma.farrierRecord.findMany({
    where,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { serviceDate: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("farrier_record", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const record = await prisma.farrierRecord.create({
    data: {
      horseId: parse.data.horseId,
      serviceDate: new Date(parse.data.serviceDate),
      shoeType: parse.data.shoeType || null,
      hoofCondition: parse.data.hoofCondition || null,
      farrierName: parse.data.farrierName || null,
      notes: parse.data.notes || null,
      createdById: session!.user.id,
    },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "farrier_record",
    entityId: record.id,
    action: "create",
    after: {
      horseId: record.horseId,
      serviceDate: parse.data.serviceDate,
      shoeType: record.shoeType,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
