import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { MoveStatusBadge } from "@/components/moves/MoveStatusBadge";
import { HorseMoveForm } from "@/components/moves/HorseMoveForm";

export default async function MoveDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !can(session.user.role, "horse_move", "view")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const { edit } = await searchParams;
  const canEdit = can(session.user.role, "horse_move", "update");

  const move = await prisma.horseMove.findUnique({
    where: { id },
    include: {
      horse: { select: { id: true, name: true, regimentalNumber: true } },
      fromLocation: { select: { id: true, name: true, code: true } },
      toLocation: { select: { id: true, name: true, code: true } },
      createdBy: { select: { name: true, serviceNumber: true } },
      updatedBy: { select: { name: true, serviceNumber: true } },
    },
  });

  if (!move) notFound();

  const [horses, locations] = canEdit && edit === "1"
    ? await Promise.all([
        prisma.horse.findMany({
          where: { isActive: true },
          select: { id: true, name: true, regimentalNumber: true },
          orderBy: { name: "asc" },
        }),
        prisma.location.findMany({
          where: { isActive: true },
          select: { id: true, name: true, code: true },
          orderBy: { name: "asc" },
        }),
      ])
    : [[], []];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/moves" className="hover:text-[#1a2744] hover:underline">
          Horse Moves
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{move.horse.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Move —{" "}
            <Link href={`/horses/${move.horse.id}`} className="text-[#1a2744] hover:underline">
              {move.horse.name}
            </Link>
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {move.horse.regimentalNumber}
            </span>
            <span className="text-sm text-gray-600">
              {move.fromLocation ? move.fromLocation.name : <span className="italic">Unknown</span>}
              {" → "}
              {move.toLocation.name}
            </span>
            <MoveStatusBadge status={move.status} />
          </div>
        </div>
        {canEdit && edit !== "1" && (
          <Link
            href={`/moves/${move.id}?edit=1`}
            className="bg-white border text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shrink-0"
          >
            Edit
          </Link>
        )}
      </div>

      {canEdit && edit === "1" ? (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Edit Move</h2>
          <HorseMoveForm
            mode="edit"
            moveId={move.id}
            horses={horses}
            locations={locations}
            initialData={{
              horseId: move.horseId,
              fromLocationId: move.fromLocationId ?? "",
              toLocationId: move.toLocationId,
              departureDate: move.departureDate.toISOString(),
              arrivalDate: move.arrivalDate?.toISOString() ?? "",
              status: move.status as "PLANNED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED",
              driverName: move.driverName ?? "",
              driverServiceNumber: move.driverServiceNumber ?? "",
              vehicleVRN: move.vehicleVRN ?? "",
              boxGroomName: move.boxGroomName ?? "",
              notes: move.notes ?? "",
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Move Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoField
              label="Departure"
              value={format(new Date(move.departureDate), "dd MMM yyyy")}
            />
            <InfoField
              label="Arrival"
              value={move.arrivalDate ? format(new Date(move.arrivalDate), "dd MMM yyyy") : "—"}
            />
            <InfoField
              label="Driver"
              value={move.driverName ?? "—"}
            />
            <InfoField
              label="Driver Service No."
              value={
                move.driverServiceNumber ? (
                  <span className="font-mono">{move.driverServiceNumber}</span>
                ) : "—"
              }
            />
            <InfoField
              label="Vehicle VRN"
              value={
                move.vehicleVRN ? (
                  <span className="font-mono">{move.vehicleVRN}</span>
                ) : "—"
              }
            />
            <InfoField label="Box Groom" value={move.boxGroomName ?? "—"} />
            <InfoField
              label="Created By"
              value={`${move.createdBy.name} (${move.createdBy.serviceNumber})`}
            />
            {move.updatedBy && (
              <InfoField
                label="Last Updated By"
                value={`${move.updatedBy.name} (${move.updatedBy.serviceNumber})`}
              />
            )}
          </div>
          {move.notes && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Notes
              </div>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-md border">
                {move.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {move.status === "COMPLETED" && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <h2 className="text-sm font-semibold text-green-800 mb-3 uppercase tracking-wide">
            Move Completed
          </h2>
          <p className="text-sm text-green-700">
            {move.horse.name} arrived at{" "}
            <span className="font-medium">{move.toLocation.name}</span>
            {move.arrivalDate
              ? ` on ${format(new Date(move.arrivalDate), "dd MMM yyyy")}`
              : ""}
            .
          </p>
        </div>
      )}
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
