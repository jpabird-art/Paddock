import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MovesTable } from "@/components/moves/MovesTable";
import type { MoveEntry } from "@/components/moves/MovesTable";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Planned", value: "PLANNED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function FilterLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
        isActive
          ? "bg-[#1a2744] text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function MovesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; pageSize?: string }>;
}) {
  const session = await getServerSession(authOptions);

  const { can: canFn } = await import("@/lib/permissions");
  if (!session || !canFn(session.user.role, "horse_move", "view")) {
    redirect("/dashboard");
  }

  const { status, q, ...paginationRaw } = await searchParams;
  const pagination = parsePagination(paginationRaw);
  const canEdit = canFn(session.user.role, "horse_move", "create");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.horse = { name: { contains: q, mode: "insensitive" as const } };
  }

  const [moves, totalItems] = await Promise.all([
    prisma.horseMove.findMany({
      where,
      include: {
        horse: { select: { id: true, name: true, regimentalNumber: true } },
        fromLocation: { select: { id: true, name: true, code: true } },
        toLocation: { select: { id: true, name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: [{ departureDate: "desc" }, { groupId: "asc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.horseMove.count({ where }),
  ]);
  const meta = paginationMeta(pagination, totalItems);

  // Build grouped entries: collapse moves with the same groupId into one entry
  const entries: MoveEntry[] = [];
  const groupMap = new Map<string, MoveEntry & { type: "group" }>();

  for (const move of moves) {
    const serialized = {
      id: move.id,
      departureDate: move.departureDate.toISOString(),
      arrivalDate: move.arrivalDate?.toISOString() ?? null,
      status: move.status,
      vehicleVRN: move.vehicleVRN,
      driverName: move.driverName,
      name: move.name,
      groupId: move.groupId,
      crew: move.crew as { name: string; role: string }[] | null,
      horse: move.horse,
      fromLocation: move.fromLocation,
      toLocation: move.toLocation,
      createdBy: move.createdBy,
    };

    if (move.groupId) {
      const existing = groupMap.get(move.groupId);
      if (existing) {
        existing.moves.push(serialized);
      } else {
        const group: MoveEntry & { type: "group" } = {
          type: "group",
          groupId: move.groupId,
          name: move.name,
          moves: [serialized],
        };
        groupMap.set(move.groupId, group);
        entries.push(group);
      }
    } else {
      entries.push({ type: "single", move: serialized });
    }
  }

  const buildFilterHref = (statusVal: string) => {
    const params = new URLSearchParams();
    if (statusVal) params.set("status", statusVal);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/moves${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Horse Moves</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalItems} move{totalItems !== 1 ? "s" : ""}
          </p>
        </div>
        {canEdit && (
          <Link
            href="/moves/new"
            className="bg-[#1a2744] hover:bg-[#243560] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            New Move
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Status:</span>
          {STATUS_FILTERS.map((f) => (
            <FilterLink
              key={f.value}
              href={buildFilterHref(f.value)}
              label={f.label}
              isActive={(status ?? "") === f.value}
            />
          ))}
        </div>
        <form method="GET" action="/moves" className="flex gap-2 items-center">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search horse name..."
            className="border border-gray-200 rounded-md px-3 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30"
          />
        </form>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <MovesTable entries={entries} />
        <Pagination
          meta={meta}
          basePath="/moves"
          searchParams={{ status, q }}
        />
      </div>
    </div>
  );
}
