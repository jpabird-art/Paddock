import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  endDate: z.string().optional(),
  fitNotes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("tack_allocation", "update");
  if (error) return error;

  const { id } = await params;

  const allocation = await prisma.tackAllocation.findUnique({ where: { id } });
  if (!allocation) {
    return NextResponse.json({ error: "Tack allocation not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };
  if (parse.data.endDate) {
    data.endDate = new Date(parse.data.endDate);
  }

  const updated = await prisma.tackAllocation.update({
    where: { id },
    data,
    include: {
      tackItem: { select: { id: true, type: true, identifier: true, condition: true } },
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  return NextResponse.json(updated);
}
