import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { notifyVets } from "@/lib/notifications";
import { z } from "zod";

const createSchema = z.object({
  severity: z.enum(["MINOR", "MODERATE", "SEVERE"]),
  description: z.string().min(1),
  bodyLocation: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireRole();
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id: params.id } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = createSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const injury = await prisma.injuryReport.create({
    data: {
      horseId: params.id,
      reportedById: session!.user.id,
      severity: parse.data.severity,
      description: parse.data.description,
      bodyLocation: parse.data.bodyLocation,
      status: "OPEN",
    },
  });

  // Notify all vets and admins
  await notifyVets(injury.id);

  return NextResponse.json(injury, { status: 201 });
}
