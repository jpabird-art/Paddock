import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED"]).optional(),
  resolutionNote: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole("ADMIN", "VET", "OFFICER");
  if (error) return error;

  const injury = await prisma.injuryReport.findUnique({
    where: { id: params.id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true, dutyStation: true } },
      reportedBy: { select: { name: true, serviceNumber: true, role: true } },
      resolvedBy: { select: { name: true, serviceNumber: true, role: true } },
      notifications: {
        include: {
          recipient: { select: { name: true, role: true } },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!injury) {
    return NextResponse.json({ error: "Injury report not found" }, { status: 404 });
  }

  return NextResponse.json(injury);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireRole("ADMIN", "VET");
  if (error) return error;

  const injury = await prisma.injuryReport.findUnique({
    where: { id: params.id },
  });
  if (!injury) {
    return NextResponse.json({ error: "Injury report not found" }, { status: 404 });
  }

  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parse.data };

  if (parse.data.status === "RESOLVED") {
    data.resolvedById = session!.user.id;
    data.resolvedAt = new Date();
  }

  const updated = await prisma.injuryReport.update({
    where: { id: params.id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      reportedBy: { select: { name: true, serviceNumber: true } },
      resolvedBy: { select: { name: true, serviceNumber: true } },
    },
  });

  return NextResponse.json(updated);
}
