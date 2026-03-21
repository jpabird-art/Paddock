import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["SADDLE", "BRIDLE", "BREASTPLATE", "GIRTH", "NUMNAH", "OTHER"]),
  identifier: z.string().min(1),
  brand: z.string().optional(),
  condition: z.enum(["SERVICEABLE", "UNSERVICEABLE", "REPAIR_NEEDED"]),
  notes: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.tackItem.findMany({
    where: { isActive: true },
    include: {
      allocations: {
        where: { endDate: null },
        include: {
          horse: { select: { id: true, name: true, regimentalNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { error } = await requirePermission("tack_item", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const item = await prisma.tackItem.create({
    data: {
      type: parse.data.type,
      identifier: parse.data.identifier,
      brand: parse.data.brand,
      condition: parse.data.condition,
      notes: parse.data.notes,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
