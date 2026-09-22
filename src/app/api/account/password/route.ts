import { NextResponse } from "next/server";
import { z } from "zod";
import { passwordSchema } from "@/lib/account-security";
import { redeemAccountToken } from "@/lib/account-tokens";
import { checkAccountRequest } from "@/lib/account-request";
export async function POST(request: Request) {
  const error = checkAccountRequest(request);
  if (error) return error;
  const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: passwordSchema }).safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Use a valid link and a password of at least 12 characters (maximum 72 UTF-8 bytes)." }, { status: 400 });
  const ok = await redeemAccountToken(input.data.token, input.data.password);
  return NextResponse.json(ok ? { message: "Password saved. You can now sign in." } : { error: "This link has expired or already been used. Request a new password link." }, { status: ok ? 200 : 400 });
}
