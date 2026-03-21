import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { DutyBadge } from "@/components/horses/DutyBadge";
import { ResolveInjuryForm } from "@/components/injuries/ResolveInjuryForm";
import { InjuryStatusUpdater } from "@/components/injuries/InjuryStatusUpdater";

export default async function InjuryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "injury_report", "view")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const role = session.user.role;
  const canResolve = ["ADMIN", "VET"].includes(role);

  const injury = await prisma.injuryReport.findUnique({
    where: { id },
    include: {
      horse: {
        select: {
          id: true,
          name: true,
          regimentalNumber: true,
          dutyStation: true,
          colour: true,
          breed: true,
        },
      },
      reportedBy: { select: { name: true, serviceNumber: true, role: true } },
      resolvedBy: { select: { name: true, serviceNumber: true, role: true } },
      notifications: {
        include: {
          recipient: { select: { name: true, role: true } },
        },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  if (!injury) notFound();

  const severityClass =
    injury.severity === "SEVERE"
      ? "bg-red-100 text-red-700 border-red-200"
      : injury.severity === "MODERATE"
      ? "bg-orange-100 text-orange-700 border-orange-200"
      : "bg-yellow-100 text-yellow-700 border-yellow-200";

  const statusClass =
    injury.status === "OPEN"
      ? "bg-red-100 text-red-700 border-red-200"
      : injury.status === "UNDER_REVIEW"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-green-100 text-green-700 border-green-200";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/injuries" className="hover:text-[#1a2744] hover:underline">
          Injury Reports
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{injury.horse.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Injury Report —{" "}
            <Link
              href={`/horses/${injury.horse.id}`}
              className="text-[#1a2744] hover:underline"
            >
              {injury.horse.name}
            </Link>
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {injury.horse.regimentalNumber}
            </span>
            <DutyBadge station={injury.horse.dutyStation} />
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${severityClass}`}
            >
              {injury.severity}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusClass}`}
            >
              {injury.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canResolve && injury.status !== "RESOLVED" && (
            <>
              <InjuryStatusUpdater injuryId={injury.id} currentStatus={injury.status} />
              <ResolveInjuryForm
                injuryId={injury.id}
                horseName={injury.horse.name}
              />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
              Injury Details
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <InfoField label="Body Location" value={injury.bodyLocation} />
              <InfoField
                label="Reported"
                value={format(new Date(injury.reportedAt), "dd MMM yyyy HH:mm")}
              />
              <InfoField label="Reported By" value={`${injury.reportedBy.name} (${injury.reportedBy.serviceNumber})`} />
              <InfoField label="Horse" value={`${injury.horse.colour} ${injury.horse.breed}`} />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Description
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-md border">
                {injury.description}
              </p>
            </div>
          </div>

          {/* Resolution */}
          {injury.status === "RESOLVED" && (
            <div className="bg-green-50 rounded-lg border border-green-200 p-5">
              <h2 className="text-sm font-semibold text-green-800 mb-3 uppercase tracking-wide">
                Resolution
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <InfoField
                  label="Resolved By"
                  value={
                    injury.resolvedBy
                      ? `${injury.resolvedBy.name} (${injury.resolvedBy.serviceNumber})`
                      : "—"
                  }
                />
                <InfoField
                  label="Resolved On"
                  value={
                    injury.resolvedAt
                      ? format(new Date(injury.resolvedAt), "dd MMM yyyy")
                      : "—"
                  }
                />
              </div>
              {injury.resolutionNote && (
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1.5">
                    Resolution Notes
                  </div>
                  <p className="text-sm text-green-800 leading-relaxed bg-green-100 p-3 rounded-md">
                    {injury.resolutionNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Notifications Sent
            </h2>
            {injury.notifications.length === 0 ? (
              <p className="text-xs text-gray-500">No notifications sent.</p>
            ) : (
              <div className="space-y-2">
                {injury.notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-700 font-medium">
                      {n.recipient.name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        n.acknowledged
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {n.acknowledged ? "Acknowledged" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
