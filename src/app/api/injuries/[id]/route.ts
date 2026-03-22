import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { audit } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED"]).optional(),
  resolutionNote: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await requirePermission("injury_report", "view");
  if (error) return error;

  const injury = await prisma.injuryReport.findUnique({
    where: { id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, session } = await requirePermission("injury_report", "update");
  if (error) return error;

  const injury = await prisma.injuryReport.findUnique({
    where: { id },
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
    where: { id },
    data,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true, taskReadiness: true } },
      reportedBy: { select: { name: true, serviceNumber: true } },
      resolvedBy: { select: { name: true, serviceNumber: true } },
    },
  });

  // Auto-downgrade task readiness when injury is reopened (not RESOLVED)
  if (parse.data.status && parse.data.status !== "RESOLVED" && updated.horse) {
    const horse = updated.horse;
    if (injury.severity === "SEVERE" && horse.taskReadiness !== "NON_TASKWORTHY") {
      await prisma.horse.update({
        where: { id: injury.horseId },
        data: { taskReadiness: "NON_TASKWORTHY" },
      });
    } else if (injury.severity === "MODERATE" && horse.taskReadiness === "FULL_EXERCISE") {
      await prisma.horse.update({
        where: { id: injury.horseId },
        data: { taskReadiness: "LIMITED_ROLE" },
      });
    }
  }

  await audit({
    userId: session?.user.id,
    userRole: session?.user.role,
    entityType: "injury_report",
    entityId: id,
    action: parse.data.status === "RESOLVED" ? "resolve" : "update",
    before: { status: injury.status },
    after: { status: updated.status },
  });

  return NextResponse.json(updated);
}
