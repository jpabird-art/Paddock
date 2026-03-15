import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { DutyBadge } from "@/components/horses/DutyBadge";

export default async function InjuriesPage({
  searchParams,
}: {
  searchParams: { status?: string; severity?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || !["ADMIN", "VET", "OFFICER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status;
  if (searchParams.severity) where.severity = searchParams.severity;

  const injuries = await prisma.injuryReport.findMany({
    where,
    include: {
      horse: {
        select: { id: true, name: true, regimentalNumber: true, dutyStation: true },
      },
      reportedBy: { select: { name: true, serviceNumber: true } },
      resolvedBy: { select: { name: true } },
    },
    orderBy: { reportedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Injury Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {injuries.length} report{injuries.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Status:</span>
          <FilterLink href="/injuries" label="All" isActive={!searchParams.status} />
          <FilterLink href="/injuries?status=OPEN" label="Open" isActive={searchParams.status === "OPEN"} />
          <FilterLink href="/injuries?status=UNDER_REVIEW" label="Under Review" isActive={searchParams.status === "UNDER_REVIEW"} />
          <FilterLink href="/injuries?status=RESOLVED" label="Resolved" isActive={searchParams.status === "RESOLVED"} />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-500">Severity:</span>
          <FilterLink
            href={searchParams.status ? `/injuries?status=${searchParams.status}` : "/injuries"}
            label="All"
            isActive={!searchParams.severity}
          />
          <FilterLink
            href={`/injuries?${searchParams.status ? "status=" + searchParams.status + "&" : ""}severity=MINOR`}
            label="Minor"
            isActive={searchParams.severity === "MINOR"}
          />
          <FilterLink
            href={`/injuries?${searchParams.status ? "status=" + searchParams.status + "&" : ""}severity=MODERATE`}
            label="Moderate"
            isActive={searchParams.severity === "MODERATE"}
          />
          <FilterLink
            href={`/injuries?${searchParams.status ? "status=" + searchParams.status + "&" : ""}severity=SEVERE`}
            label="Severe"
            isActive={searchParams.severity === "SEVERE"}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Horse</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Station</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Severity</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Reported By</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {injuries.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-500 py-10">
                  No injury reports found.
                </td>
              </tr>
            ) : (
              injuries.map((injury) => (
                <tr
                  key={injury.id}
                  className={
                    injury.status === "OPEN" && injury.severity === "SEVERE"
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(injury.reportedAt), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/horses/${injury.horse.id}`}
                      className="font-medium text-[#1a2744] hover:underline"
                    >
                      {injury.horse.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">
                      {injury.horse.regimentalNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DutyBadge station={injury.horse.dutyStation} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">{injury.bodyLocation}</td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={injury.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={injury.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {injury.reportedBy.name}
                    <div className="text-gray-400 font-mono">{injury.reportedBy.serviceNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/injuries/${injury.id}`}
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

function SeverityBadge({ severity }: { severity: string }) {
  const classes =
    severity === "SEVERE"
      ? "bg-red-100 text-red-700 border-red-200"
      : severity === "MODERATE"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-yellow-100 text-yellow-700 border-yellow-200";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${classes}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "OPEN"
      ? "bg-red-100 text-red-700 border-red-200"
      : status === "UNDER_REVIEW"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${classes}`}>
      {status.replace(/_/g, " ")}
    </span>
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
