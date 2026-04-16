import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Squadron } from "@prisma/client";
import { audit } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1),
  serviceNumber: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "VET", "FARRIER", "OFFICER", "TROOPER"]),
  squadron: z.nativeEnum(Squadron).nullable().optional(),
  rank: z.string().optional(),
}).refine(
  (data) => data.role === "VET" || data.squadron,
  { message: "Squadron is required for non-VET roles", path: ["squadron"] }
);

export async function GET() {
  const { error } = await requirePermission("user", "view");
  if (error) return error;

  const users = await prisma.user.findMany({
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
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("user", "create");
  if (error) return error;

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data", details: parse.error.errors }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { serviceNumber: parse.data.serviceNumber.toUpperCase() },
        { email: parse.data.email.toLowerCase() },
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that service number or email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parse.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parse.data.name,
      serviceNumber: parse.data.serviceNumber.toUpperCase(),
      email: parse.data.email.toLowerCase(),
      passwordHash,
      role: parse.data.role,
      squadron: parse.data.squadron ?? null,
      rank: parse.data.rank ?? null,
    },
    select: {
      id: true,
      name: true,
      serviceNumber: true,
      email: true,
      role: true,
      squadron: true,
      rank: true,
      isActive: true,
      createdAt: true,
    },
  });

  await audit({
    userId: session!.user.id,
    userRole: session!.user.role,
    entityType: "user",
    entityId: user.id,
    action: "create",
    after: { name: user.name, serviceNumber: user.serviceNumber, role: user.role, squadron: user.squadron },
  });

  return NextResponse.json(user, { status: 201 });
}
