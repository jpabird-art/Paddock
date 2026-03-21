import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  condition: z.enum(["SERVICEABLE", "UNSERVICEABLE", "REPAIR_NEEDED"]).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const item = await prisma.tackItem.findUnique({
    where: { id },
    include: {
      allocations: {
        include: {
          horse: { select: { id: true, name: true, regimentalNumber: true } },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Tack item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("tack_item", "update");
  if (error) return error;

  const { id } = await params;

  const item = await prisma.tackItem.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Tack item not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const updated = await prisma.tackItem.update({
    where: { id },
    data: parse.data,
  });

  return NextResponse.json(updated);
}
