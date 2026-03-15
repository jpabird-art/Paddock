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
    "/admin/:path*",
    "/api/horses/:path*",
    "/api/injuries/:path*",
    "/api/health-events/:path*",
    "/api/admin/:path*",
  ],
};
