import { passwordSchema } from "@/lib/account-security";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { Squadron } from "@prisma/client";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"]).optional(),
  squadron: z.nativeEnum(Squadron).nullable().optional(),
  rank: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  password: passwordSchema.optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requirePermission("user", "update");
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parse.data.name) data.name = parse.data.name;
  if (parse.data.email) data.email = parse.data.email.toLowerCase();
  if (parse.data.role) data.role = parse.data.role;
  if (parse.data.squadron !== undefined) data.squadron = parse.data.squadron;
  if (parse.data.rank !== undefined) data.rank = parse.data.rank;
  if (parse.data.isActive !== undefined) data.isActive = parse.data.isActive;

  if (parse.data.password) {
    data.passwordHash = await bcrypt.hash(parse.data.password, 12);
  }

  // Password changes and activation changes invalidate previously issued sessions.
  if (parse.data.password || parse.data.isActive !== undefined || parse.data.email !== undefined) data.sessionVersion = { increment: 1 };
  if (id === session!.user.id && (parse.data.isActive === false || (parse.data.role && parse.data.role !== "ADMIN"))) {
    return NextResponse.json({ error: "Another administrator must change your administrator access." }, { status: 400 });
  }
  const updated = await prisma.$transaction(async tx => {
    if (parse.data.password || parse.data.email || parse.data.isActive !== undefined) await tx.accountToken.deleteMany({ where: { userId: id } });
    return tx.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        serviceNumber: true,
        email: true,
        role: true,
        squadron: true,
        isActive: true,
        createdAt: true,
      },
    });
  });

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "user",
    entityId: id,
    action: parse.data.isActive !== undefined ? (parse.data.isActive ? "activate" : "deactivate") : "update",
    before: { role: user.role, squadron: user.squadron, isActive: user.isActive },
    after: { role: updated.role, squadron: updated.squadron, isActive: updated.isActive },
  });

  return NextResponse.json(updated);
}
