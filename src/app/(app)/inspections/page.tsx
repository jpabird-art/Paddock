import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const RESULT_CLASSES: Record<string, string> = {
  PASS: "bg-green-100 text-green-700 border-green-200",
  FAIL: "bg-red-100 text-red-700 border-red-200",
  ADVISORY: "bg-amber-100 text-amber-700 border-amber-200",
};

export default async function InspectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !can(session.user.role, "inspection", "view")) {
    redirect("/dashboard");
  }

  const [inspections, schedules] = await Promise.all([
    prisma.inspection.findMany({
      include: {
        horse: { select: { id: true, name: true, regimentalNumber: true } },
        inspector: { select: { name: true } },
        schedule: { select: { name: true } },
      },
      orderBy: { scheduledDate: "desc" },
      take: 100,
    }),
    prisma.inspectionSchedule.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {inspections.length} inspection record{inspections.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Schedules summary */}
      {schedules.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 px-4 py-2 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              <span className="text-gray-400 text-xs ml-2">
                every {s.frequencyDays} days
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Horse</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Schedule</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Result</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Findings</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Inspector</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-10">
                  No inspections recorded.
                </td>
              </tr>
            ) : (
              inspections.map((insp) => (
                <tr
                  key={insp.id}
                  className={
                    insp.result === "FAIL"
                      ? "bg-red-50 hover:bg-red-100"
                      : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3 text-gray-600">
                    {format(new Date(insp.scheduledDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/horses/${insp.horse.id}`}
                      className="font-medium text-[#1a2744] hover:underline"
                    >
                      {insp.horse.name}
                    </Link>
                    <div className="text-xs text-gray-400 font-mono">
                      {insp.horse.regimentalNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {insp.schedule?.name ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        RESULT_CLASSES[insp.result] ?? "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {insp.result}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">
                    {insp.findings ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {insp.inspector.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {insp.completedAt
                      ? format(new Date(insp.completedAt), "dd MMM yyyy")
                      : "\u2014"}
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
