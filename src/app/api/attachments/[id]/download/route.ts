import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { storage } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  const buffer = await storage.read(attachment.filePath);
  if (!buffer) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }

  const isImage = attachment.mimeType.startsWith("image/");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `${isImage ? "inline" : "attachment"}; filename="${attachment.fileName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
