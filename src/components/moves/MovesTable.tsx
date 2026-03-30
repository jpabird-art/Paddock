"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MoveStatusBadge } from "@/components/moves/MoveStatusBadge";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MoveHorse {
  id: string;
  name: string;
  regimentalNumber: string;
}

interface MoveLocation {
  id: string;
  name: string;
  code: string;
}

interface MoveRow {
  id: string;
  departureDate: string;
  arrivalDate: string | null;
  status: string;
  vehicleVRN: string | null;
  driverName: string | null;
  name: string | null;
  groupId: string | null;
  crew: { name: string; role: string }[] | null;
  horse: MoveHorse;
  fromLocation: MoveLocation | null;
  toLocation: MoveLocation;
  createdBy: { name: string };
}

export interface GroupedMove {
  type: "single";
  move: MoveRow;
}

export interface GroupedMoveGroup {
  type: "group";
  groupId: string;
  name: string | null;
  moves: MoveRow[];
}

export type MoveEntry = GroupedMove | GroupedMoveGroup;

export function MovesTable({ entries }: { entries: MoveEntry[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function renderPersonnel(move: MoveRow) {
    if (move.crew && move.crew.length > 0) {
      return move.crew.length === 1
        ? move.crew[0].name
        : `${move.crew.length} assigned`;
    }
    if (move.driverName) return move.driverName;
    return "—";
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-gray-50">
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Horse</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">From</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">To</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">VRN</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600">Personnel</th>
          <th className="text-left px-4 py-3 font-semibold text-gray-600"></th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {entries.length === 0 ? (
          <tr>
            <td colSpan={8} className="text-center text-gray-500 py-10">
              No moves found.
            </td>
          </tr>
        ) : (
          entries.map((entry) => {
            if (entry.type === "single") {
              return <SingleMoveRow key={entry.move.id} move={entry.move} renderPersonnel={renderPersonnel} />;
            }

            const isExpanded = expandedGroups.has(entry.groupId);
            const representative = entry.moves[0];

            return (
              <GroupMoveRows
                key={entry.groupId}
                group={entry}
                representative={representative}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(entry.groupId)}
                renderPersonnel={renderPersonnel}
              />
            );
          })
        )}
      </tbody>
    </table>
  );
}

function SingleMoveRow({
  move,
  renderPersonnel,
}: {
  move: MoveRow;
  renderPersonnel: (m: MoveRow) => string;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-600">
        <div>{format(new Date(move.departureDate), "dd MMM yyyy")}</div>
        {move.name && (
          <div className="text-xs text-gray-500 font-medium mt-0.5">{move.name}</div>
        )}
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
      <td className="px-4 py-3 font-mono text-xs text-gray-600">{move.vehicleVRN ?? "—"}</td>
      <td className="px-4 py-3 text-gray-600 text-xs">{renderPersonnel(move)}</td>
      <td className="px-4 py-3">
        <Link
          href={`/moves/${move.id}`}
          className="text-[#1a2744] hover:underline text-xs font-medium"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

function GroupMoveRows({
  group,
  representative,
  isExpanded,
  onToggle,
  renderPersonnel,
}: {
  group: GroupedMoveGroup;
  representative: MoveRow;
  isExpanded: boolean;
  onToggle: () => void;
  renderPersonnel: (m: MoveRow) => string;
}) {
  const Icon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      {/* Group header row */}
      <tr
        className="hover:bg-gray-50 cursor-pointer bg-blue-50/30"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-gray-600">
          <div>{format(new Date(representative.departureDate), "dd MMM yyyy")}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-medium text-gray-900">
                {group.name ?? "Group Move"}
              </div>
              <span className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium mt-0.5">
                {group.moves.length} horses
              </span>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-gray-600 text-xs">
          {representative.fromLocation ? representative.fromLocation.name : <span className="italic text-gray-400">Unknown</span>}
        </td>
        <td className="px-4 py-3 text-gray-700 text-xs font-medium">
          {representative.toLocation.name}
        </td>
        <td className="px-4 py-3">
          <MoveStatusBadge status={representative.status} />
        </td>
        <td className="px-4 py-3 font-mono text-xs text-gray-600">{representative.vehicleVRN ?? "—"}</td>
        <td className="px-4 py-3 text-gray-600 text-xs">{renderPersonnel(representative)}</td>
        <td className="px-4 py-3">
          <Link
            href={`/moves/${representative.id}`}
            className="text-[#1a2744] hover:underline text-xs font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </Link>
        </td>
      </tr>

      {/* Expanded horse list */}
      {isExpanded &&
        group.moves.map((move) => (
          <tr key={move.id} className="hover:bg-gray-50 bg-blue-50/10 border-l-2 border-l-blue-300">
            <td className="px-4 py-2 text-gray-400 text-xs pl-8" />
            <td className="px-4 py-2 pl-10">
              <Link
                href={`/horses/${move.horse.id}`}
                className="text-sm font-medium text-[#1a2744] hover:underline"
              >
                {move.horse.name}
              </Link>
              <span className="text-xs text-gray-400 font-mono ml-2">{move.horse.regimentalNumber}</span>
            </td>
            <td colSpan={4} className="px-4 py-2">
              <MoveStatusBadge status={move.status} />
            </td>
            <td />
            <td className="px-4 py-2">
              <Link
                href={`/moves/${move.id}`}
                className="text-[#1a2744] hover:underline text-xs font-medium"
              >
                View →
              </Link>
            </td>
          </tr>
        ))}
    </>
  );
}
