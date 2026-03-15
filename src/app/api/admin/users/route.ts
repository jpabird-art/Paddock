import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  serviceNumber: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "VET", "OFFICER", "TROOPER"]),
  rank: z.string().optional(),
});

export async function GET() {
  const { error } = await requireRole("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      serviceNumber: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { error } = await requireRole("ADMIN");
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
      rank: parse.data.rank ?? null,
    },
    select: {
      id: true,
      name: true,
      serviceNumber: true,
      email: true,
      role: true,
      rank: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
