import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, differenceInYears } from "date-fns";
import { DutyBadge } from "@/components/horses/DutyBadge";
import { MoveStatusBadge } from "@/components/moves/MoveStatusBadge";
import { HealthEventBadge } from "@/components/health/HealthEventBadge";
import { InjuryReportForm } from "@/components/injuries/InjuryReportForm";
import { HorseHealthNotes } from "@/components/horses/HorseHealthNotes";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default async function HorseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "TROOPER";
  const canEdit = ["ADMIN", "VET", "OFFICER"].includes(role);

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      healthEvents: {
        orderBy: { scheduledAt: "desc" },
      },
      healthNotes: {
        include: { author: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
      },
      injuryReports: {
        include: {
          reportedBy: { select: { name: true, serviceNumber: true } },
          resolvedBy: { select: { name: true, serviceNumber: true } },
        },
        orderBy: { reportedAt: "desc" },
      },
      moves: {
        include: {
          fromLocation: { select: { name: true, code: true } },
          toLocation: { select: { name: true, code: true } },
        },
        orderBy: { departureDate: "desc" },
      },
    },
  });

  if (!horse) notFound();

  const age = differenceInYears(new Date(), new Date(horse.dateOfBirth));
  const serviceYears = differenceInYears(new Date(), new Date(horse.serviceEntryDate));

  const openInjuries = horse.injuryReports.filter(
    (i) => i.status === "OPEN" || i.status === "UNDER_REVIEW"
  );
  const overdueEvents = horse.healthEvents.filter((e) => e.status === "OVERDUE");

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{horse.name}</h1>
              <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {horse.regimentalNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DutyBadge station={horse.dutyStation} />
              {openInjuries.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full border border-red-200 font-medium">
                  {openInjuries.length} open injury
                </span>
              )}
              {overdueEvents.length > 0 && (
                <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-200 font-medium">
                  {overdueEvents.length} overdue check
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InjuryReportForm horseId={horse.id} horseName={horse.name} />
          {canEdit && (
            <Link
              href={`/horses/${horse.id}/edit`}
              className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="health-schedule">
            Health Schedule
            {overdueEvents.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {overdueEvents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="health-notes">Health Notes</TabsTrigger>
          <TabsTrigger value="injuries">
            Injuries
            {openInjuries.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {openInjuries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="moves">Move History</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-white rounded-lg border shadow-sm p-6 mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoField label="Breed" value={horse.breed} />
              <InfoField label="Colour" value={horse.colour} />
              <InfoField
                label="Date of Birth"
                value={`${format(new Date(horse.dateOfBirth), "dd MMM yyyy")} (${age} yrs)`}
              />
              <InfoField
                label="Service Entry"
                value={`${format(new Date(horse.serviceEntryDate), "dd MMM yyyy")} (${serviceYears} yrs service)`}
              />
              <InfoField label="Height" value={`${horse.heightHands} hh`} />
              <InfoField label="Weight" value={`${horse.weightKg} kg`} />
              <InfoField
                label="Max Rider Weight"
                value={`${horse.maxRiderWeightKg} kg`}
              />
              <InfoField label="Duty Station" value={<DutyBadge station={horse.dutyStation} />} />
            </div>
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Feeding Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{horse.feedingNotes}</p>
            </div>
          </div>
        </TabsContent>

        {/* Health Schedule Tab */}
        <TabsContent value="health-schedule">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-3">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Health Events</h2>
            </div>
            {horse.healthEvents.length === 0 ? (
              <p className="text-sm text-gray-500 p-6 text-center">No health events recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Scheduled</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Completed</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {horse.healthEvents.map((event) => (
                    <tr key={event.id} className={event.status === "OVERDUE" ? "bg-red-50" : ""}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {event.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(event.scheduledAt), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {event.completedAt
                          ? format(new Date(event.completedAt), "dd MMM yyyy")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <HealthEventBadge status={event.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {event.performedBy ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Health Notes Tab */}
        <TabsContent value="health-notes">
          <div className="mt-3">
            <HorseHealthNotes
              horseId={horse.id}
              initialNotes={horse.healthNotes.map((n) => ({
                id: n.id,
                content: n.content,
                createdAt: n.createdAt.toISOString(),
                author: n.author,
              }))}
              canAdd={["ADMIN", "VET"].includes(role)}
            />
          </div>
        </TabsContent>

        {/* Injuries Tab */}
        <TabsContent value="injuries">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-3">
            {horse.injuryReports.length === 0 ? (
              <p className="text-sm text-gray-500 p-6 text-center">No injury reports.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Location</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Severity</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Reported By</th>
                    {canEdit && <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {horse.injuryReports.map((injury) => (
                    <tr key={injury.id}>
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(injury.reportedAt), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {injury.bodyLocation}
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            injury.status === "OPEN"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : injury.status === "UNDER_REVIEW"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-green-100 text-green-700 border-green-200"
                          }`}
                        >
                          {injury.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {injury.reportedBy.name}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <Link
                            href={`/injuries/${injury.id}`}
                            className="text-[#1a2744] hover:underline text-xs font-medium"
                          >
                            View
                          </Link>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Move History Tab */}
        <TabsContent value="moves">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden mt-3">
            {horse.moves.length === 0 ? (
              <p className="text-sm text-gray-500 p-6 text-center">No move history recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Driver</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">VRN</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {horse.moves.map((move) => (
                    <tr key={move.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {format(new Date(move.departureDate), "dd MMM yyyy")}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
