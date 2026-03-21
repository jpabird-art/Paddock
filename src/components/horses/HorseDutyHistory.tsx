"use client";

import { format } from "date-fns";
import { DutyBadge } from "@/components/horses/DutyBadge";

interface DutyHistoryData {
  id: string;
  station: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  assignedBy: { name: string };
}

interface HorseDutyHistoryProps {
  assignments: DutyHistoryData[];
}

export function HorseDutyHistory({ assignments }: HorseDutyHistoryProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      {assignments.length === 0 ? (
        <p className="text-sm text-gray-500 p-6 text-center">
          No duty station history recorded.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-gray-700">Station</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Start Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">End Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Assigned By</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((assignment) => {
                const isCurrent = !assignment.endDate;
                return (
                  <tr
                    key={assignment.id}
                    className={isCurrent ? "bg-[#1a2744]/5" : ""}
                  >
                    <td className="px-4 py-3">
                      <DutyBadge station={assignment.station} />
                      {isCurrent && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#1a2744] text-white">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {format(new Date(assignment.startDate), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {assignment.endDate
                        ? format(new Date(assignment.endDate), "dd MMM yyyy")
                        : "Current"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{assignment.assignedBy.name}</td>
                    <td className="px-4 py-3 text-gray-700">{assignment.notes ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
