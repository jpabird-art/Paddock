import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { z } from "zod";

const createSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireRole();
  if (error) return error;

  const notes = await prisma.healthNote.findMany({
    where: { horseId: params.id },
    include: {
      author: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireRole("ADMIN", "VET");
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

  const note = await prisma.healthNote.create({
    data: {
      horseId: params.id,
      authorId: session!.user.id,
      content: parse.data.content,
    },
    include: {
      author: { select: { name: true, role: true } },
    },
  });

  return NextResponse.json(note, { status: 201 });
}
