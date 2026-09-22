import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  if (process.env.PADDOCK_SITE_MODE === "marketing") return NextResponse.json({ status: "ok", mode: "marketing" });

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: { status: "connected", latencyMs: dbLatencyMs },
      uptime: process.uptime(),
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        db: { status: "unreachable" },
      },
      { status: 503 }
    );
  }
}
