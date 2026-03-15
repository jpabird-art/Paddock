import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const { error } = await requireRole();
  if (error) return error;

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN", "OFFICER");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const { name, code, address, notes } = parse.data;
  const normalizedCode = code.toUpperCase().replace(/ /g, "_");

  const location = await prisma.location.create({
    data: { name, code: normalizedCode, address, notes },
  });

  return NextResponse.json(location, { status: 201 });
}
