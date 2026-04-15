"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ExerciseTypeBadge } from "./ExerciseTypeBadge";

export interface ExerciseAssignmentData {
  id: string;
  exerciseName: string;
  timeSlot: string;
  duration: number | null;
  notes: string | null;
  horse: {
    id: string;
    name: string;
    regimentalNumber: string;
    squadron: string | null;
    role: string | null;
  };
  rider: {
    id: string;
    name: string;
    serviceNumber: string;
    rank: string | null;
  };
  assignedBy: {
    id: string;
    name: string;
  };
}

interface Props {
  assignment: ExerciseAssignmentData;
  canEdit: boolean;
  onEdit?: (assignment: ExerciseAssignmentData) => void;
  onDelete?: (id: string) => void;
}

export function ExerciseAssignmentCard({ assignment, canEdit, onEdit, onDelete }: Props) {
  const riderDisplay = assignment.rider.rank
    ? `${assignment.rider.rank} ${assignment.rider.name}`
    : assignment.rider.name;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-start justify-between gap-2 hover:border-gray-300 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/horses/${assignment.horse.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-[#1a2744] hover:underline truncate"
          >
            {assignment.horse.name}
          </Link>
          <span className="text-xs text-gray-400 font-mono shrink-0">
            {assignment.horse.regimentalNumber}
          </span>
        </div>
        <div className="text-xs text-gray-600 mb-1.5">{riderDisplay}</div>
        <div className="flex items-center gap-2">
          <ExerciseTypeBadge name={assignment.exerciseName} />
          {assignment.duration && (
            <span className="text-xs text-gray-400">{assignment.duration} min</span>
          )}
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit?.(assignment)}
            className="p-1 text-gray-400 hover:text-[#1a2744] rounded transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete?.(assignment.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
