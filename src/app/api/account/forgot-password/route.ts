import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendAccountLink } from "@/lib/account-tokens";
import { checkAccountRequest } from "@/lib/account-request";
import { emailEnabled } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { hashAccountToken } from "@/lib/account-security";

export async function POST(request: Request) {
  const error = checkAccountRequest(request);
  if (error) return error;
  if (!emailEnabled) return NextResponse.json({ error: "Email recovery is unavailable. Contact your Paddock administrator." }, { status: 503 });
  const input = z.object({ email: z.string().trim().email().max(254) }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  const email = input.data.email.toLowerCase();
  const allowed = rateLimit(`reset:${hashAccountToken(email)}`, 3, 3600000).allowed;
  if (allowed) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.isActive) await sendAccountLink(user, "reset");
  }
  return NextResponse.json({ message: "If an active account matches that email, a password link will be sent. Check your inbox and spam folder." });
}
