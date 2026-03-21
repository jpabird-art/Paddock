import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { MoveStatusBadge } from "@/components/moves/MoveStatusBadge";

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
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getServerSession(authOptions);

  const { can: canFn } = await import("@/lib/permissions");
  if (!session || !canFn(session.user.role, "horse_move", "view")) {
    redirect("/dashboard");
  }

  const { status, q } = await searchParams;
  const canEdit = canFn(session.user.role, "horse_move", "create");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.horse = { name: { contains: q, mode: "insensitive" as const } };
  }

  const moves = await prisma.horseMove.findMany({
    where,
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { departureDate: "desc" },
  });

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
            {moves.length} move{moves.length !== 1 ? "s" : ""}
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

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Horse</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Driver</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">VRN</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Box Groom</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {moves.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-10">
                  No moves found.
                </td>
              </tr>
            ) : (
              moves.map((move) => (
                <tr key={move.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(move.departureDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/horses/${move.horse.id}`}
                      className="font-medium text-[#1a2744] hover:underline"
                    >
                      {move.horse.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">{move.horse.regimentalNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {move.fromLocation ? move.fromLocation.name : <span className="italic text-gray-400">Unknown</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">
                    {move.toLocation.name}
                  </td>
                  <td className="px-4 py-3">
                    <MoveStatusBadge status={move.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{move.driverName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{move.vehicleVRN ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{move.boxGroomName ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/moves/${move.id}`}
                      className="text-[#1a2744] hover:underline text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
