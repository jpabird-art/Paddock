import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Rate-limited paths (pre-auth, so we handle them before withAuth)
const RATE_LIMITED_PATHS = ["/api/auth/callback", "/api/auth/csrf", "/api/auth/mfa/check"];

// 10 login attempts per IP per 15-minute window
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function handleRateLimit(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  if (request.method !== "POST") return null;
  if (!RATE_LIMITED_PATHS.some((p) => path.startsWith(p))) return null;

  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(ip, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    );
  }

  return null;
}

// Wrap withAuth so we can intercept rate-limited routes first
const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default function middleware(request: NextRequest) {
  // Rate limit check runs before auth
  const rateLimitResponse = handleRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  // Auth check for protected routes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (authMiddleware as any)(request, {} as any);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/horses/:path*",
    "/health/:path*",
    "/injuries/:path*",
    "/moves/:path*",
    "/tack/:path*",
    "/inspections/:path*",
    "/admin/:path*",
    "/security/:path*",
    "/api/horses/:path*",
    "/api/injuries/:path*",
    "/api/health-events/:path*",
    "/api/horse-moves/:path*",
    "/api/rider-assignments/:path*",
    "/api/feeding-plans/:path*",
    "/api/medication-records/:path*",
    "/api/tack/:path*",
    "/api/inspections/:path*",
    "/api/attachments/:path*",
    "/api/admin/:path*",
    "/api/auth/mfa/setup",
    "/api/auth/mfa/verify",
    "/api/auth/mfa/disable",
  ],
};
