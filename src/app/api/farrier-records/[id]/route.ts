import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  serviceDate: z.string().optional(),
  shoeType: z.string().optional(),
  hoofCondition: z.string().optional(),
  farrierName: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("farrier_record", "update");
  if (error) return error;

  const { id } = await params;

  const record = await prisma.farrierRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Farrier record not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.serviceDate) {
    data.serviceDate = new Date(parse.data.serviceDate);
  }

  const updated = await prisma.farrierRecord.update({
    where: { id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "farrier_record",
    entityId: id,
    action: "update",
    before: { shoeType: record.shoeType, hoofCondition: record.hoofCondition },
    after: { shoeType: updated.shoeType, hoofCondition: updated.hoofCondition },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("farrier_record", "delete");
  if (error) return error;

  const { id } = await params;

  const record = await prisma.farrierRecord.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Farrier record not found" }, { status: 404 });
  }

  await prisma.farrierRecord.delete({ where: { id } });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "farrier_record",
    entityId: id,
    action: "delete",
    before: { horseId: record.horseId, shoeType: record.shoeType },
  });

  return NextResponse.json({ success: true });
}
