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

const ROLE_LABELS: Record<string, string> = {
  CHARGER: "Charger",
  CAV_BLACK: "Cav Black",
  GREY: "Grey",
  STANDARD: "Standard",
  COMP: "Comp",
  RMT: "RMT",
};

const SEX_LABELS: Record<string, string> = {
  GELDING: "Gelding",
  MARE: "Mare",
};

const READINESS_LABELS: Record<string, string> = {
  FULL_EXERCISE: "Full Exercise",
  LIMITED_ROLE: "Limited Role",
  NON_TASKWORTHY: "Non-taskworthy",
};

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("location");
  const squadron = searchParams.get("squadron");
  const readiness = searchParams.get("readiness");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { isActive: true };
  if (locationId && locationId !== "ALL") {
    where.currentLocationId = locationId;
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
      currentLocation: { select: { name: true } },
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
    "Location",
    "Sex",
    "Role",
    "Division",
    "Breed",
    "Colour",
    "Date of Birth",
    "Service Entry Date",
    "Height (hh)",
    "Weight (kg)",
    "Max Rider Weight (kg)",
    "Task Readiness",
    "Open Injuries",
    "Overdue Health Events",
  ];

  const rows = horses.map((h) => {
    return [
      escapeCSV(h.name),
      escapeCSV(h.regimentalNumber),
      escapeCSV(h.squadronNumber),
      escapeCSV(h.squadron ? SQUADRON_LABELS[h.squadron] ?? h.squadron : ""),
      escapeCSV(h.currentLocation?.name ?? ""),
      escapeCSV(h.sex ? SEX_LABELS[h.sex] ?? h.sex : ""),
      escapeCSV(h.role ? ROLE_LABELS[h.role] ?? h.role : ""),
      h.division ? String(h.division) : "",
      escapeCSV(h.breed),
      escapeCSV(h.colour),
      escapeCSV(h.dateOfBirth.toISOString().substring(0, 10)),
      escapeCSV(h.serviceEntryDate.toISOString().substring(0, 10)),
      String(h.heightHands),
      String(h.weightKg),
      String(h.maxRiderWeightKg),
      escapeCSV(READINESS_LABELS[h.taskReadiness] ?? h.taskReadiness),
      String(h.injuryReports.length),
      String(h.healthEvents.length),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().substring(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paddock-horse-roster-${date}.csv"`,
    },
  });
}
