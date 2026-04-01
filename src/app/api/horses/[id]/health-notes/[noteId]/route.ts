import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const { error } = await requirePermission("health_note", "delete");
  if (error) return error;

  const { id, noteId } = await params;

  const note = await prisma.healthNote.findUnique({ where: { id: noteId } });
  if (!note || note.horseId !== id) {
    return NextResponse.json({ error: "Health note not found" }, { status: 404 });
  }

  await prisma.healthNote.delete({ where: { id: noteId } });

  return NextResponse.json({ success: true });
}
