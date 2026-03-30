import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { TaskReadinessBadge } from "@/components/horses/TaskReadinessBadge";
import { Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HorseSearchFilter } from "@/components/horses/HorseSearchFilter";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";

export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string; squadron?: string; readiness?: string; page?: string; pageSize?: string }>;
}) {
  const { q, location, squadron, readiness, ...paginationRaw } = await searchParams;
  const pagination = parsePagination(paginationRaw);
  const session = await getServerSession(authOptions);
  const { can: canFn } = await import("@/lib/permissions");
  const role = session?.user?.role ?? "TROOPER";
  const canCreate = canFn(role, "horse", "create");

  // Default non-vet users to their own squadron
  const userSquadron = session?.user?.squadron ?? null;
  const effectiveSquadron = squadron !== undefined
    ? squadron
    : (role !== "VET" && userSquadron ? userSquadron : "ALL");

  const where: Record<string, unknown> = { isActive: true };
  if (location && location !== "ALL") {
    where.currentLocationId = location;
  }
  if (effectiveSquadron && effectiveSquadron !== "ALL") {
    where.squadron = effectiveSquadron;
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

  const [horses, totalItems, locations] = await Promise.all([
    prisma.horse.findMany({
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
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.horse.count({ where }),
    prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const meta = paginationMeta(pagination, totalItems);

  // Build export URL preserving current filters
  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (location && location !== "ALL") exportParams.set("location", location);
  if (effectiveSquadron && effectiveSquadron !== "ALL") exportParams.set("squadron", effectiveSquadron);
  if (readiness && readiness !== "ALL") exportParams.set("readiness", readiness);
  const exportQs = exportParams.toString();
  const exportUrl = `/api/horses/export${exportQs ? `?${exportQs}` : ""}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horse Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalItems} horse{totalItems !== 1 ? "s" : ""} listed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          {canCreate && (
            <Link
              href="/horses/new"
              className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#243560] transition-colors"
            >
              + Add Horse
            </Link>
          )}
        </div>
      </div>

      <HorseSearchFilter
        currentQ={q ?? ""}
        currentSquadron={effectiveSquadron}
        currentReadiness={readiness ?? "ALL"}
        currentLocation={location ?? "ALL"}
        locations={locations.map((l) => ({ value: l.id, label: l.name }))}
      />

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>

          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">Name</TableHead>
              <TableHead className="font-semibold text-gray-700">Reg. No.</TableHead>
              <TableHead className="font-semibold text-gray-700">Squadron</TableHead>
              <TableHead className="font-semibold text-gray-700">Role</TableHead>
              <TableHead className="font-semibold text-gray-700">Div</TableHead>
              <TableHead className="font-semibold text-gray-700">Location</TableHead>
              <TableHead className="font-semibold text-gray-700">Readiness</TableHead>
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
                  <TableCell className="text-sm text-gray-700">
                    {horse.squadron === "THE_LIFE_GUARDS" ? "Life Guards" : horse.squadron === "THE_BLUES_AND_ROYALS" ? "Blues & Royals" : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {horse.role ? { CHARGER: "Charger", CAV_BLACK: "Cav Black", GREY: "Grey", STANDARD: "Standard", COMP: "Comp", RMT: "RMT" }[horse.role] : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {horse.division ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {horse.currentLocation?.name ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <TaskReadinessBadge readiness={horse.taskReadiness} />
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
        <Pagination
          meta={meta}
          basePath="/horses"
          searchParams={{
            q,
            location: location !== "ALL" ? location : undefined,
            squadron: effectiveSquadron !== "ALL" ? effectiveSquadron : undefined,
            readiness: readiness !== "ALL" ? readiness : undefined,
          }}
        />
      </div>
    </div>
  );
}
