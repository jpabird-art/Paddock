import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { checkAccountRequest } from "@/lib/account-request";
import { sendAccountLink } from "@/lib/account-tokens";
import { emailEnabled } from "@/lib/email";
import { audit } from "@/lib/audit";

const inputSchema = z.union([
  z.object({ userId: z.string().min(1) }),
  z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254),
    serviceNumber: z.string().trim().regex(/^[a-zA-Z0-9_-]{2,32}$/),
    role: z.enum(["ADMIN", "OFFICER", "TROOPER", "VET", "FARRIER"]) }),
]);
export async function POST(request: Request) {
  const { error, session } = await requirePermission("user", "create");
  if (error) return error;
  const requestError = checkAccountRequest(request);
  if (requestError) return requestError;
  if (!emailEnabled) return NextResponse.json({ error: "Email is not configured. Ask the Paddock operator to enable invitations." }, { status: 503 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, email, role and a username of 2–32 letters, numbers, hyphens or underscores." }, { status: 400 });
  const input = parsed.data;
  let user;
  try {
    user = "userId" in input
      ? await prisma.user.findUnique({ where: { id: input.userId } })
      : await prisma.user.create({ data: { ...input, email: input.email.toLowerCase(), serviceNumber: input.serviceNumber.toUpperCase(), passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "That username or email already exists. Use Send password link beside the existing user." }, { status: 409 });
    throw error;
  }
  if (!user?.isActive) return NextResponse.json({ error: "Active user not found" }, { status: 404 });
  const sent = await sendAccountLink(user, "invite");
  if (!sent) return NextResponse.json({ error: "The account exists, but the email could not be sent. Retry with Send password link in the user list." }, { status: 503 });
  await audit({ userId: session!.user.id, userRole: session!.user.role, entityType: "user", entityId: user.id, action: "invitation_sent" });
  return NextResponse.json({ message: "Invitation sent. The recipient can choose their own password." });
}
