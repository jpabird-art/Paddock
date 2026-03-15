import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "VET", "OFFICER", "TROOPER"]).optional(),
  rank: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parse.data.name) data.name = parse.data.name;
  if (parse.data.email) data.email = parse.data.email.toLowerCase();
  if (parse.data.role) data.role = parse.data.role;
  if (parse.data.rank !== undefined) data.rank = parse.data.rank;
  if (parse.data.isActive !== undefined) data.isActive = parse.data.isActive;
  if (parse.data.password) {
    data.passwordHash = await bcrypt.hash(parse.data.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      name: true,
      serviceNumber: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(updated);
}
