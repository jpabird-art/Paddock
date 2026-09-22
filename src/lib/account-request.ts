import { NextResponse } from "next/server";
import { accountOrigin } from "@/lib/account-security";
import { rateLimit } from "@/lib/rate-limit";

export function checkAccountRequest(request: Request) {
  if (process.env.PADDOCK_SITE_MODE === "marketing") return NextResponse.json({ error: "Not available" }, { status: 404 });
  if (request.headers.get("origin") !== accountOrigin()) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`account:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } });
  return null;
}
