"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DailyBoardView } from "./DailyBoardView";
import { WeeklyBoardView } from "./WeeklyBoardView";
import type { ExerciseAssignmentData } from "./ExerciseAssignmentCard";

interface HorseOption {
  id: string;
  name: string;
  regimentalNumber: string;
}

interface UserOption {
  id: string;
  name: string;
  serviceNumber: string;
  rank: string | null;
}

interface Props {
  horses: HorseOption[];
  users: UserOption[];
  canEdit: boolean;
  initialDate?: string;
}

type ViewMode = "daily" | "weekly";

export function RidingBoardClient({ horses, users, canEdit, initialDate }: Props) {
  const [date, setDate] = useState(initialDate ?? format(new Date(), "yyyy-MM-dd"));
  const [view, setView] = useState<ViewMode>("daily");
  const [assignments, setAssignments] = useState<ExerciseAssignmentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const param = view === "daily" ? `date=${date}` : `weekOf=${date}`;
      const res = await fetch(`/api/exercise-assignments?${param}`);
      if (res.ok) {
        setAssignments(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [date, view]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Re-fetch when the page regains focus (after dialog closes / router.refresh)
  useEffect(() => {
    const handleFocus = () => fetchAssignments();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchAssignments]);

  function navigateDate(direction: "prev" | "next") {
    const d = new Date(date);
    if (view === "daily") {
      setDate(format(direction === "prev" ? subDays(d, 1) : addDays(d, 1), "yyyy-MM-dd"));
    } else {
      setDate(format(direction === "prev" ? subWeeks(d, 1) : addWeeks(d, 1), "yyyy-MM-dd"));
    }
  }

  function goToToday() {
    setDate(format(new Date(), "yyyy-MM-dd"));
  }

  function handleDayClick(dateStr: string) {
    setDate(dateStr);
    setView("daily");
  }

  const displayDate = view === "daily"
    ? format(new Date(date), "EEEE, dd MMMM yyyy")
    : `Week of ${format(startOfWeek(new Date(date), { weekStartsOn: 1 }), "dd MMM")} — ${format(addDays(startOfWeek(new Date(date), { weekStartsOn: 1 }), 6), "dd MMM yyyy")}`;

  const isToday = date === format(new Date(), "yyyy-MM-dd");

  const selectClass =
    "border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riding Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">{displayDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title={view === "daily" ? "Previous day" : "Previous week"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {!isToday && (
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-[#1a2744] bg-[#1a2744]/5 rounded-md hover:bg-[#1a2744]/10 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => navigateDate("next")}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            title={view === "daily" ? "Next day" : "Next week"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("daily")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === "daily"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              view === "weekly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : view === "daily" ? (
        <DailyBoardView
          assignments={assignments}
          date={date}
          canEdit={canEdit}
          horses={horses}
          users={users}
        />
      ) : (
        <WeeklyBoardView
          assignments={assignments}
          weekStart={new Date(date)}
          onDayClick={handleDayClick}
        />
      )}
    </div>
  );
}
