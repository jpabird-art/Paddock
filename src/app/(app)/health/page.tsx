import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { DutyBadge } from "@/components/horses/DutyBadge";
import { HealthEventBadge } from "@/components/health/HealthEventBadge";
import { HealthCompleteButton } from "@/components/health/HealthCompleteButton";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { parsePagination, paginationMeta } from "@/lib/pagination";
import { Pagination } from "@/components/ui/pagination";

const EVENT_TYPE_LABELS: Record<string, string> = {
  DENTAL_CHECK: "Dental Check",
  VET_CHECKUP: "Vet Checkup",
  VACCINATION: "Vaccination",
  FARRIERY: "Farriery",
  CUSTOM: "Custom",
};

export default async function HealthPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; page?: string; pageSize?: string }>;
}) {
  const { status, type, ...paginationRaw } = await searchParams;
  const pagination = parsePagination(paginationRaw);
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "TROOPER";
  const canComplete = ["ADMIN", "VET"].includes(role);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [events, totalItems, overdueCount, scheduledCount] = await Promise.all([
    prisma.healthEvent.findMany({
      where,
      include: {
        horse: {
          select: {
            id: true,
            name: true,
            regimentalNumber: true,
            dutyStation: true,
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.healthEvent.count({ where }),
    prisma.healthEvent.count({ where: { status: "OVERDUE" } }),
    prisma.healthEvent.count({ where: { status: "SCHEDULED" } }),
  ]);
  const meta = paginationMeta(pagination, totalItems);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Fleet-wide health event calendar
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
          <span className="text-red-800 font-semibold text-sm">{overdueCount}</span>
          <span className="text-red-600 text-sm ml-1.5">overdue</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
          <span className="text-blue-800 font-semibold text-sm">{scheduledCount}</span>
          <span className="text-blue-600 text-sm ml-1.5">scheduled</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <FilterLink href="/health" label="All" isActive={!status} />
        <FilterLink href="/health?status=OVERDUE" label="Overdue" isActive={status === "OVERDUE"} />
        <FilterLink href="/health?status=SCHEDULED" label="Scheduled" isActive={status === "SCHEDULED"} />
        <FilterLink href="/health?status=COMPLETED" label="Completed" isActive={status === "COMPLETED"} />
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Horse</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Station</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Event Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Scheduled</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Completed</th>
              {canComplete && (
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.length === 0 ? (
              <tr>
                <td
                  colSpan={canComplete ? 7 : 6}
                  className="text-center text-gray-500 py-10"
                >
                  No health events found.
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className={
                    event.status === "OVERDUE"
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/horses/${event.horse.id}`}
                      className="font-medium text-[#1a2744] hover:underline"
                    >
                      {event.horse.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">
                      {event.horse.regimentalNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DutyBadge station={event.horse.dutyStation} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {EVENT_TYPE_LABELS[event.type] ?? event.type}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(event.scheduledAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <HealthEventBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {event.completedAt
                      ? format(new Date(event.completedAt), "dd MMM yyyy")
                      : "—"}
                  </td>
                  {canComplete && (
                    <td className="px-4 py-3">
                      {event.status !== "COMPLETED" && (
                        <HealthCompleteButton
                          eventId={event.id}
                          performedBy={session?.user?.name ?? ""}
                        />
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          meta={meta}
          basePath="/health"
          searchParams={{ status, type }}
        />
      </div>
    </div>
  );
}

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
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#1a2744] text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}
