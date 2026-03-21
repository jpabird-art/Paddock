import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("location", "update");
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const data = { ...parse.data };
  if (data.code) {
    data.code = data.code.toUpperCase().replace(/ /g, "_");
  }

  const location = await prisma.location.update({
    where: { id },
    data,
  });

  return NextResponse.json(location);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("location", "delete");
  if (error) return error;

  const { id } = await params;

  const location = await prisma.location.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(location);
}
