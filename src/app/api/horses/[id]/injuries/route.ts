import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { notifyVets } from "@/lib/notifications";
import { z } from "zod";

const createSchema = z.object({
  severity: z.enum(["MINOR", "MODERATE", "SEVERE"]),
  description: z.string().min(1),
  bodyLocation: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requirePermission("injury_report", "create");
  if (error) return error;

  const horse = await prisma.horse.findUnique({ where: { id } });
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
      horseId: id,
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
