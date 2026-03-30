import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";
import { Shield, AlertTriangle, Calendar, Activity, Pill, MapPin } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "TROOPER";

  const [totalHorses, locationCounts, overdueEvents, openInjuries, activeWithdrawals] =
    await Promise.all([
      prisma.horse.count({ where: { isActive: true } }),
      prisma.location.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }).then(async (locs) => {
        const counts = await Promise.all(
          locs.map(async (loc) => ({
            ...loc,
            count: await prisma.horse.count({
              where: { isActive: true, currentLocationId: loc.id },
            }),
          }))
        );
        return counts;
      }),
      prisma.healthEvent.findMany({
        where: { status: "OVERDUE" },
        include: {
          horse: {
            select: {
              id: true,
              name: true,
              regimentalNumber: true,
              currentLocation: { select: { name: true } },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      }),
      prisma.injuryReport.findMany({
        where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
        include: {
          horse: {
            select: {
              id: true,
              name: true,
              regimentalNumber: true,
              currentLocation: { select: { name: true } },
            },
          },
          reportedBy: { select: { name: true } },
        },
        orderBy: { reportedAt: "desc" },
        take: 10,
      }),
      prisma.medicationRecord.findMany({
        where: { withdrawalEndDate: { gt: new Date() } },
        include: {
          horse: { select: { id: true, name: true, regimentalNumber: true } },
        },
        orderBy: { withdrawalEndDate: "asc" },
        take: 10,
      }),
    ]);

  const canSeeFullInjuries = can(role, "injury_report", "update");
  const canSeeOverdue = can(role, "health_event", "update");

  // Only show locations that have horses
  const activeLocations = locationCounts.filter((l) => l.count > 0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Household Cavalry Mounted Regiment — Fleet Overview
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#1a2744]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="bg-[#1a2744]/10 rounded-full p-2">
                <Shield className="h-5 w-5 text-[#1a2744]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalHorses}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Horses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeLocations.map((loc) => (
          <Card key={loc.id} className="border-l-4 border-l-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 rounded-full p-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{loc.count}</div>
                  <div className="text-xs text-gray-500 font-medium">{loc.name}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue health events */}
        {canSeeOverdue && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Overdue Health Events
                {overdueEvents.length > 0 && (
                  <span className="ml-auto bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {overdueEvents.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueEvents.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No overdue health events.
                </p>
              ) : (
                <div className="divide-y">
                  {overdueEvents.map((event) => (
                    <div key={event.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/horses/${event.horse.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-[#1a2744] hover:underline"
                          >
                            {event.horse.name}
                          </Link>
                          <span className="text-xs text-gray-400 font-mono">
                            {event.horse.regimentalNumber}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {event.type.replace(/_/g, " ")} — due{" "}
                          {format(new Date(event.scheduledAt), "dd MMM yyyy")}
                        </div>
                      </div>
                      {event.horse.currentLocation && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                          {event.horse.currentLocation.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-3 border-t mt-2">
                <Link
                  href="/health"
                  className="text-xs text-[#1a2744] hover:underline font-medium"
                >
                  View all health events →
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open injuries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Open Injury Reports
              {openInjuries.length > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {openInjuries.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openInjuries.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No open injury reports.
              </p>
            ) : (
              <div className="divide-y">
                {openInjuries.map((injury) => (
                  <div key={injury.id} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {canSeeFullInjuries ? (
                            <Link
                              href={`/injuries/${injury.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-[#1a2744] hover:underline"
                            >
                              {injury.horse.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {injury.horse.name}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 font-mono">
                            {injury.horse.regimentalNumber}
                          </span>
                        </div>
                        {canSeeFullInjuries ? (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {injury.bodyLocation} — reported by {injury.reportedBy.name}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {injury.bodyLocation} — {injury.status.replace(/_/g, " ")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            injury.severity === "SEVERE"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : injury.severity === "MODERATE"
                              ? "bg-orange-100 text-orange-700 border-orange-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {injury.severity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {canSeeFullInjuries && (
              <div className="pt-3 border-t mt-2">
                <Link
                  href="/injuries"
                  className="text-xs text-[#1a2744] hover:underline font-medium"
                >
                  View all injury reports →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active medication withdrawals */}
        {canSeeOverdue && activeWithdrawals.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Pill className="h-4 w-4 text-purple-500" />
                Active Withdrawals
                <span className="ml-auto bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {activeWithdrawals.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {activeWithdrawals.map((med) => (
                  <div key={med.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/horses/${med.horse.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-[#1a2744] hover:underline"
                        >
                          {med.horse.name}
                        </Link>
                        <span className="text-xs text-gray-400 font-mono">
                          {med.horse.regimentalNumber}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {med.medicationName} — withdrawal ends{" "}
                        {format(new Date(med.withdrawalEndDate!), "dd MMM yyyy")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        {!canSeeOverdue && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Fleet Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active horses</span>
                  <span className="font-medium">{totalHorses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Open injuries</span>
                  <span className="font-medium text-amber-600">{openInjuries.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Overdue health events</span>
                  <span className="font-medium text-red-600">{overdueEvents.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
