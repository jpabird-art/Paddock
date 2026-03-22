import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

function escapeCSV(value: string | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const SQUADRON_LABELS: Record<string, string> = {
  THE_LIFE_GUARDS: "The Life Guards",
  THE_BLUES_AND_ROYALS: "The Blues and Royals",
};

const READINESS_LABELS: Record<string, string> = {
  FULL_EXERCISE: "Full Exercise",
  LIMITED_ROLE: "Limited Role",
  NON_TASKWORTHY: "Non-taskworthy",
};

const STATION_LABELS: Record<string, string> = {
  KINGS_LIFE_GUARD: "King's Life Guard",
  TRAINING_WING: "Training Wing",
  HYDE_PARK_BARRACKS: "Hyde Park Barracks",
  WINTER_TRAINING: "Winter Training",
};

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const station = searchParams.get("station");
  const squadron = searchParams.get("squadron");
  const readiness = searchParams.get("readiness");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { isActive: true };
  if (station && station !== "ALL") {
    where.dutyStation = station;
  }
  if (squadron && squadron !== "ALL") {
    where.squadron = squadron;
  }
  if (readiness && readiness !== "ALL") {
    where.taskReadiness = readiness;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" as const } },
      { regimentalNumber: { contains: q, mode: "insensitive" as const } },
      { breed: { contains: q, mode: "insensitive" as const } },
    ];
  }

  const horses = await prisma.horse.findMany({
    where,
    include: {
      riderAssignments: {
        where: { endDate: null },
        include: { rider: { select: { name: true, serviceNumber: true } } },
        take: 1,
      },
      injuryReports: {
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        select: { id: true },
      },
      healthEvents: {
        where: { status: "OVERDUE" },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const headers = [
    "Name",
    "Regimental Number",
    "Squadron Number",
    "Squadron",
    "Duty Station",
    "Breed",
    "Colour",
    "Date of Birth",
    "Service Entry Date",
    "Height (hh)",
    "Weight (kg)",
    "Max Rider Weight (kg)",
    "Task Readiness",
    "Current Rider",
    "Open Injuries",
    "Overdue Health Events",
  ];

  const rows = horses.map((h) => {
    const rider = h.riderAssignments[0]?.rider;
    return [
      escapeCSV(h.name),
      escapeCSV(h.regimentalNumber),
      escapeCSV(h.squadronNumber),
      escapeCSV(h.squadron ? SQUADRON_LABELS[h.squadron] ?? h.squadron : ""),
      escapeCSV(h.dutyStation ? STATION_LABELS[h.dutyStation] ?? h.dutyStation : ""),
      escapeCSV(h.breed),
      escapeCSV(h.colour),
      escapeCSV(h.dateOfBirth.toISOString().substring(0, 10)),
      escapeCSV(h.serviceEntryDate.toISOString().substring(0, 10)),
      String(h.heightHands),
      String(h.weightKg),
      String(h.maxRiderWeightKg),
      escapeCSV(READINESS_LABELS[h.taskReadiness] ?? h.taskReadiness),
      escapeCSV(rider ? `${rider.name} (${rider.serviceNumber})` : ""),
      String(h.injuryReports.length),
      String(h.healthEvents.length),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().substring(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hcmr-horse-roster-${date}.csv"`,
    },
  });
}
