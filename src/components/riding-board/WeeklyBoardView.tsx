"use client";

import Link from "next/link";
import { format, addDays, startOfWeek } from "date-fns";
import { ExerciseTypeBadge } from "./ExerciseTypeBadge";
import type { ExerciseAssignmentData } from "./ExerciseAssignmentCard";

interface Props {
  assignments: ExerciseAssignmentData[];
  weekStart: Date;
  onDayClick: (date: string) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyBoardView({ assignments, weekStart, onDayClick }: Props) {
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // Build a map: horseId -> { dayIndex -> assignments[] }
  const horseMap = new Map<
    string,
    {
      horse: ExerciseAssignmentData["horse"];
      days: Map<number, ExerciseAssignmentData[]>;
    }
  >();

  for (const a of assignments) {
    const dateStr = format(new Date(a.horse.id), "yyyy-MM-dd"); // unused, we match by day
    let entry = horseMap.get(a.horse.id);
    if (!entry) {
      entry = { horse: a.horse, days: new Map() };
      horseMap.set(a.horse.id, entry);
    }

    // Find which day index this assignment belongs to
    // We need to parse the assignment date from the original data
    // Assignments come with a date field via the API, but in our data shape
    // we only have the horse/rider info. We'll match by looking at the raw date.
  }

  // Rebuild more cleanly: group by horse, then by day-of-week index
  // Since assignments all come from the same week query, we can use the date field
  // But our ExerciseAssignmentData doesn't include `date` — let's extend.
  // Actually, the API returns the full assignment which includes `date`.
  // We need to pass the raw API data to handle this.

  // For the weekly view, we'll work with a slightly different structure.
  // Let me use the raw assignments which include `date`.

  interface AssignmentWithDate extends ExerciseAssignmentData {
    date: string;
  }

  const horseDayMap = new Map<
    string,
    {
      horse: ExerciseAssignmentData["horse"];
      byDay: (AssignmentWithDate[] | undefined)[];
    }
  >();

  for (const a of assignments as AssignmentWithDate[]) {
    if (!a.date) continue;
    const aDate = new Date(a.date);
    const dayIndex = days.findIndex(
      (d) => format(d, "yyyy-MM-dd") === format(aDate, "yyyy-MM-dd")
    );
    if (dayIndex === -1) continue;

    let entry = horseDayMap.get(a.horse.id);
    if (!entry) {
      entry = { horse: a.horse, byDay: Array.from({ length: 7 }, () => undefined) };
      horseDayMap.set(a.horse.id, entry);
    }
    if (!entry.byDay[dayIndex]) entry.byDay[dayIndex] = [];
    entry.byDay[dayIndex]!.push(a);
  }

  const sortedHorses = [...horseDayMap.values()].sort((a, b) =>
    a.horse.name.localeCompare(b.horse.name)
  );

  // Day totals
  const dayTotals = days.map((_, i) => {
    let count = 0;
    for (const entry of horseDayMap.values()) {
      if (entry.byDay[i] && entry.byDay[i]!.length > 0) count++;
    }
    return count;
  });

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50 min-w-[160px]">
              Horse
            </th>
            {days.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
              return (
                <th
                  key={i}
                  className={`text-center px-2 py-3 font-semibold min-w-[100px] cursor-pointer hover:bg-gray-100 transition-colors ${
                    isToday ? "text-[#1a2744] bg-blue-50/50" : "text-gray-600"
                  }`}
                  onClick={() => onDayClick(dateStr)}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div className="text-xs font-normal text-gray-400">
                    {format(day, "dd MMM")}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y">
          {sortedHorses.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-gray-500 py-10">
                No exercise data for this week.
              </td>
            </tr>
          ) : (
            sortedHorses.map((entry) => (
              <tr key={entry.horse.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-2.5 sticky left-0 bg-white border-r">
                  <Link
                    href={`/horses/${entry.horse.id}`}
                    className="font-medium text-gray-900 hover:text-[#1a2744] hover:underline"
                  >
                    {entry.horse.name}
                  </Link>
                  <div className="text-xs text-gray-400 font-mono">
                    {entry.horse.regimentalNumber}
                  </div>
                </td>
                {days.map((day, i) => {
                  const dayAssignments = entry.byDay[i];
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                  return (
                    <td
                      key={i}
                      className={`px-2 py-2.5 text-center cursor-pointer hover:bg-gray-100 transition-colors ${
                        isToday ? "bg-blue-50/30" : ""
                      }`}
                      onClick={() => onDayClick(dateStr)}
                    >
                      {dayAssignments && dayAssignments.length > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          {dayAssignments.map((a) => (
                            <ExerciseTypeBadge key={a.id} name={a.exerciseName} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        {sortedHorses.length > 0 && (
          <tfoot>
            <tr className="border-t bg-gray-50">
              <td className="px-4 py-2 text-xs font-semibold text-gray-500 sticky left-0 bg-gray-50">
                Horses ridden
              </td>
              {dayTotals.map((total, i) => (
                <td key={i} className="px-2 py-2 text-center text-xs font-semibold text-gray-500">
                  {total}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
