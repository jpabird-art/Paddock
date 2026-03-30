import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format, differenceInYears } from "date-fns";
import { TaskReadinessBadge } from "@/components/horses/TaskReadinessBadge";
import { MoveStatusBadge } from "@/components/moves/MoveStatusBadge";
import { HealthEventBadge } from "@/components/health/HealthEventBadge";
import { InjuryReportForm } from "@/components/injuries/InjuryReportForm";
import { HorseHealthNotes } from "@/components/horses/HorseHealthNotes";
import { HorseFeedingPlans } from "@/components/horses/HorseFeedingPlans";
import { HorseMedicationRecords } from "@/components/horses/HorseMedicationRecords";
import { HorseRiderHistory } from "@/components/horses/HorseRiderHistory";
import { HorseTackAllocations } from "@/components/horses/HorseTackAllocations";
import { HorseInspections } from "@/components/horses/HorseInspections";
import { HorseAttachments } from "@/components/horses/HorseAttachments";
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

  const canEditHorse = can(role, "horse", "update");
  const canManageHealth = can(role, "health_note", "create");
  const canManageFeeding = can(role, "feeding_plan", "create");
  const canManageMedication = can(role, "medication_record", "create");
  const canManageRiders = can(role, "rider_assignment", "create");
  const canManageTack = can(role, "tack_allocation", "create");
  const canManageInspections = can(role, "inspection", "create");
  const canUploadAttachments = can(role, "attachment", "create");
  const canDeleteAttachments = can(role, "attachment", "delete");
  const canReportInjury = can(role, "injury_report", "create");
  const canViewInjuryDetail = can(role, "injury_report", "update");

  const horse = await prisma.horse.findUnique({
    where: { id },
    include: {
      currentLocation: { select: { id: true, name: true, code: true } },
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
      feedingPlans: {
        where: { isActive: true },
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      medicationRecords: {
        include: { administeredBy: { select: { name: true } } },
        orderBy: { administeredAt: "desc" },
      },
      riderAssignments: {
        include: { rider: { select: { name: true, serviceNumber: true } } },
        orderBy: { startDate: "desc" },
      },
      tackAllocations: {
        include: {
          tackItem: { select: { type: true, identifier: true, brand: true, condition: true } },
        },
        orderBy: { startDate: "desc" },
      },
      inspections: {
        include: {
          inspector: { select: { name: true } },
          schedule: { select: { name: true } },
        },
        orderBy: { scheduledDate: "desc" },
      },
      attachments: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!horse) notFound();

  // Fetch users list for rider assignment dropdown
  const users = canManageRiders
    ? await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true, serviceNumber: true },
        orderBy: { name: "asc" },
      })
    : [];

  const age = differenceInYears(new Date(), new Date(horse.dateOfBirth));
  const serviceYears = differenceInYears(new Date(), new Date(horse.serviceEntryDate));

  const openInjuries = horse.injuryReports.filter(
    (i) => i.status === "OPEN" || i.status === "UNDER_REVIEW"
  );
  const overdueEvents = horse.healthEvents.filter((e) => e.status === "OVERDUE");

  const currentRider = horse.riderAssignments.find((r) => !r.endDate);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {horse.photoUrl ? (
            <img
              src={horse.photoUrl}
              alt={horse.name}
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg object-cover border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              <span className="text-2xl lg:text-3xl font-bold text-gray-300">{horse.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{horse.name}</h1>
              <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {horse.regimentalNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {horse.squadron && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full border border-indigo-200 font-medium">
                  {horse.squadron === "THE_LIFE_GUARDS" ? "The Life Guards" : "The Blues and Royals"}
                </span>
              )}
              {horse.currentLocation && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  {horse.currentLocation.name}
                </span>
              )}
              <TaskReadinessBadge readiness={horse.taskReadiness} />
              {currentRider && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                  Rider: {currentRider.rider.name}
                </span>
              )}
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
          {canReportInjury && (
            <InjuryReportForm horseId={horse.id} horseName={horse.name} />
          )}
          {canEditHorse && (
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
        <TabsList className="bg-gray-100 flex-wrap h-auto gap-0.5 p-1">
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
          <TabsTrigger value="feeding">Feeding Plans</TabsTrigger>
          <TabsTrigger value="medication">Medication</TabsTrigger>
          <TabsTrigger value="injuries">
            Injuries
            {openInjuries.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {openInjuries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="riders">Riders</TabsTrigger>
          <TabsTrigger value="tack">Tack</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="moves">Moves</TabsTrigger>
          <TabsTrigger value="attachments">
            Documents
            {horse.attachments.length > 0 && (
              <span className="ml-1.5 bg-gray-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {horse.attachments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="bg-white rounded-lg border shadow-sm p-6 mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoField label="Regimental Number" value={
                <span className="font-mono font-semibold text-gray-900">{horse.regimentalNumber}</span>
              } />
              <InfoField label="Squadron Number" value={
                horse.squadronNumber
                  ? <span className="font-mono font-semibold text-gray-900">{horse.squadronNumber}</span>
                  : <span className="text-gray-400">—</span>
              } />
              <InfoField label="Squadron" value={horse.squadron === "THE_LIFE_GUARDS" ? "The Life Guards" : horse.squadron === "THE_BLUES_AND_ROYALS" ? "The Blues and Royals" : "—"} />
              <InfoField label="Location" value={
                horse.currentLocation
                  ? <span className="text-sm font-medium">{horse.currentLocation.name}</span>
                  : <span className="text-gray-400">—</span>
              } />
              <InfoField label="Task Readiness" value={<TaskReadinessBadge readiness={horse.taskReadiness} />} />
              <InfoField label="Sex" value={
                horse.sex
                  ? horse.sex === "GELDING" ? "Gelding" : "Mare"
                  : <span className="text-gray-400">—</span>
              } />
              <InfoField label="Role" value={
                horse.role
                  ? { CHARGER: "Charger", CAV_BLACK: "Cav Black", GREY: "Grey", STANDARD: "Standard", COMP: "Comp", RMT: "RMT" }[horse.role]
                  : <span className="text-gray-400">—</span>
              } />
              <InfoField label="Division" value={
                horse.division
                  ? String(horse.division)
                  : <span className="text-gray-400">—</span>
              } />
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
              {currentRider && (
                <InfoField
                  label="Current Rider"
                  value={`${currentRider.rider.name} (${currentRider.rider.serviceNumber})`}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Health Schedule Tab */}
        <TabsContent value="health-schedule">
          <div className="bg-white rounded-lg border shadow-sm overflow-x-auto mt-3">
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
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <HealthEventBadge status={event.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {event.performedBy ?? "\u2014"}
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
              canAdd={canManageHealth}
            />
          </div>
        </TabsContent>

        {/* Feeding Plans Tab */}
        <TabsContent value="feeding">
          <div className="mt-3">
            <HorseFeedingPlans
              horseId={horse.id}
              initialPlans={horse.feedingPlans.map((p) => ({
                id: p.id,
                feedType: p.feedType,
                quantityKg: p.quantityKg,
                frequency: p.frequency,
                timeOfDay: p.timeOfDay,
                specialNotes: p.specialNotes,
                startDate: p.startDate.toISOString(),
                isActive: p.isActive,
              }))}
              canManage={canManageFeeding}
            />
          </div>
        </TabsContent>

        {/* Medication Tab */}
        <TabsContent value="medication">
          <div className="mt-3">
            <HorseMedicationRecords
              horseId={horse.id}
              initialRecords={horse.medicationRecords.map((m) => ({
                id: m.id,
                medicationName: m.medicationName,
                dosage: m.dosage,
                route: m.route,
                batchNumber: m.batchNumber,
                withdrawalDays: m.withdrawalDays,
                withdrawalEndDate: m.withdrawalEndDate?.toISOString() ?? null,
                notes: m.notes,
                administeredAt: m.administeredAt.toISOString(),
                administeredBy: m.administeredBy,
              }))}
              canManage={canManageMedication}
            />
          </div>
        </TabsContent>

        {/* Injuries Tab */}
        <TabsContent value="injuries">
          <div className="bg-white rounded-lg border shadow-sm overflow-x-auto mt-3">
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
                    {canViewInjuryDetail && <th className="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>}
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
                      {canViewInjuryDetail && (
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

        {/* Riders Tab */}
        <TabsContent value="riders">
          <div className="mt-3">
            <HorseRiderHistory
              horseId={horse.id}
              initialAssignments={horse.riderAssignments.map((r) => ({
                id: r.id,
                suitabilityScore: r.suitabilityScore,
                startDate: r.startDate.toISOString(),
                endDate: r.endDate?.toISOString() ?? null,
                notes: r.notes,
                rider: r.rider,
              }))}
              canManage={canManageRiders}
              users={users}
            />
          </div>
        </TabsContent>

        {/* Tack Tab */}
        <TabsContent value="tack">
          <div className="mt-3">
            <HorseTackAllocations
              horseId={horse.id}
              ancillaries={horse.ancillaries}
              initialAllocations={horse.tackAllocations.map((a) => ({
                id: a.id,
                fitNotes: a.fitNotes,
                startDate: a.startDate.toISOString(),
                endDate: a.endDate?.toISOString() ?? null,
                tackItem: a.tackItem,
              }))}
              canManage={canManageTack}
            />
          </div>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections">
          <div className="mt-3">
            <HorseInspections
              horseId={horse.id}
              initialInspections={horse.inspections.map((i) => ({
                id: i.id,
                result: i.result,
                findings: i.findings,
                scheduledDate: i.scheduledDate.toISOString(),
                completedAt: i.completedAt?.toISOString() ?? null,
                inspector: i.inspector,
                schedule: i.schedule,
              }))}
              canManage={canManageInspections}
            />
          </div>
        </TabsContent>

        {/* Move History Tab */}
        <TabsContent value="moves">
          <div className="bg-white rounded-lg border shadow-sm overflow-x-auto mt-3">
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
                      <td className="px-4 py-3 text-gray-600 text-xs">{move.driverName ?? "\u2014"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{move.vehicleVRN ?? "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <div className="mt-3">
            <HorseAttachments
              horseId={horse.id}
              initialAttachments={horse.attachments.map((a) => ({
                id: a.id,
                fileName: a.fileName,
                filePath: a.filePath,
                mimeType: a.mimeType,
                fileSizeBytes: a.fileSizeBytes,
                category: a.category,
                description: a.description,
                uploadedBy: a.uploadedBy,
                createdAt: a.createdAt.toISOString(),
              }))}
              canUpload={canUploadAttachments}
              canDelete={canDeleteAttachments}
              photoUrl={horse.photoUrl}
            />
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
