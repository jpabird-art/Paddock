import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { storage } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requirePermission("attachment", "create");
  if (error) return error;

  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, select: { id: true } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed for profile pictures" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const relativePath = await storage.write(file.name, buffer);

  // Create attachment record and update horse.photoUrl in a transaction
  const attachment = await prisma.$transaction(async (tx) => {
    const att = await tx.attachment.create({
      data: {
        fileName: file.name,
        filePath: relativePath,
        mimeType: file.type,
        fileSizeBytes: file.size,
        category: "OTHER",
        description: "Profile picture",
        uploadedById: session!.user.id,
        horseId: id,
      },
    });

    await tx.horse.update({
      where: { id },
      data: { photoUrl: `/api/attachments/${att.id}/download` },
    });

    return att;
  });

  return NextResponse.json({
    attachmentId: attachment.id,
    photoUrl: `/api/attachments/${attachment.id}/download`,
  }, { status: 201 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requirePermission("attachment", "create");
  if (error) return error;

  const { id } = await params;

  const horse = await prisma.horse.findUnique({ where: { id }, select: { id: true, photoUrl: true } });
  if (!horse) {
    return NextResponse.json({ error: "Horse not found" }, { status: 404 });
  }

  await prisma.horse.update({
    where: { id },
    data: { photoUrl: null },
  });

  return NextResponse.json({ message: "Profile picture removed" });
}
