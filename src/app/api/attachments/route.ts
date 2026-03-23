import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, requireAuth } from "@/lib/permissions";
import { storage } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf", "application/msword", "application/vnd.openxmlformats"];

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const horseId = searchParams.get("horseId");
  const injuryReportId = searchParams.get("injuryReportId");

  const where: Record<string, unknown> = {};
  if (horseId) where.horseId = horseId;
  if (injuryReportId) where.injuryReportId = injuryReportId;

  const attachments = await prisma.attachment.findMany({
    where,
    include: {
      uploadedBy: { select: { id: true, name: true, serviceNumber: true } },
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission("attachment", "create");
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string | null;
  const horseId = formData.get("horseId") as string | null;
  const injuryReportId = formData.get("injuryReportId") as string | null;

  if (!file || !category) {
    return NextResponse.json({ error: "File and category are required" }, { status: 400 });
  }

  const validCategories = ["PASSPORT", "INJURY_PHOTO", "VET_CERTIFICATE", "DOCUMENT", "OTHER"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  if (!ALLOWED_MIME_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const relativePath = await storage.write(file.name, buffer);

  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.name,
      filePath: relativePath,
      mimeType: file.type,
      fileSizeBytes: file.size,
      category: category as "PASSPORT" | "INJURY_PHOTO" | "VET_CERTIFICATE" | "DOCUMENT" | "OTHER",
      description: description || undefined,
      uploadedById: session!.user.id,
      horseId: horseId || undefined,
      injuryReportId: injuryReportId || undefined,
    },
    include: {
      uploadedBy: { select: { id: true, name: true, serviceNumber: true } },
      horse: { select: { id: true, name: true, regimentalNumber: true } },
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
