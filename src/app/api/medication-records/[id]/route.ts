import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const record = await prisma.medicationRecord.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      administeredBy: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Medication record not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("medication_record", "update");
  if (error) return error;

  const { id } = await params;

  const record = await prisma.medicationRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Medication record not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.medicationRecord.update({
    where: { id },
    data: { notes: parse.data.notes },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      administeredBy: { select: { id: true, name: true, serviceNumber: true } },
    },
  });

  return NextResponse.json(updated);
}
