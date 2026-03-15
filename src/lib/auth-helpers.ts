import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireRole(...roles: string[]) {
  const session = await getSession();

  if (!session || !session.user) {
    return {
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
      session: null,
    };
  }

  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
