import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { DutyBadge } from "@/components/horses/DutyBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HorseSearchFilter } from "@/components/horses/HorseSearchFilter";

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: { q?: string; station?: string };
}) {
  const session = await getServerSession(authOptions);
  const { can: canFn } = await import("@/lib/permissions");
  const role = session?.user?.role ?? "TROOPER";
  const canCreate = canFn(role, "horse", "create");

  const where: Record<string, unknown> = { isActive: true };
  if (searchParams.station && searchParams.station !== "ALL") {
    where.dutyStation = searchParams.station;
  }
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" as const } },
      { regimentalNumber: { contains: searchParams.q, mode: "insensitive" as const } },
      { breed: { contains: searchParams.q, mode: "insensitive" as const } },
    ];
  }

  const horses = await prisma.horse.findMany({
    where,
    include: {
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horse Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {horses.length} horse{horses.length !== 1 ? "s" : ""} listed
          </p>
        </div>
        {canCreate && (
          <Link
            href="/horses/new"
            className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#243560] transition-colors"
          >
            + Add Horse
          </Link>
        )}
      </div>

      <HorseSearchFilter
        currentQ={searchParams.q ?? ""}
        currentStation={searchParams.station ?? "ALL"}
      />

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Reg. No.</TableHead>
              <TableHead className="font-semibold text-gray-700">Breed</TableHead>
              <TableHead className="font-semibold text-gray-700">Colour</TableHead>
              <TableHead className="font-semibold text-gray-700">Squadron</TableHead>
              <TableHead className="font-semibold text-gray-700">Station</TableHead>
              <TableHead className="font-semibold text-gray-700">Height</TableHead>
              <TableHead className="font-semibold text-gray-700">Alerts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {horses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-10">
                  No horses found.
                </TableCell>
              </TableRow>
            ) : (
              horses.map((horse) => (
                <TableRow key={horse.id} className="hover:bg-gray-50">
                  <TableCell>
                    <Link
                      href={`/horses/${horse.id}`}
                      className="font-semibold text-[#1a2744] hover:underline"
                    >
                      {horse.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {horse.regimentalNumber}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{horse.breed}</TableCell>
                  <TableCell className="text-sm text-gray-700">{horse.colour}</TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {horse.squadron === "THE_LIFE_GUARDS" ? "The Life Guards" : horse.squadron === "THE_BLUES_AND_ROYALS" ? "The Blues and Royals" : "—"}
                  </TableCell>
                  <TableCell>
                    <DutyBadge station={horse.dutyStation} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {horse.heightHands}hh
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {horse.injuryReports.length > 0 && (
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200 font-medium">
                          {horse.injuryReports.length} injury
                        </span>
                      )}
                      {horse.healthEvents.length > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200 font-medium">
                          {horse.healthEvents.length} overdue
                        </span>
                      )}
                      {horse.injuryReports.length === 0 && horse.healthEvents.length === 0 && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
