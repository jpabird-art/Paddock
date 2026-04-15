import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const notification = await prisma.exerciseNotification.findUnique({
    where: { id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  if (notification.recipientId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.exerciseNotification.update({
    where: { id },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
