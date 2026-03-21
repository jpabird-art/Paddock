import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
  ],
};
