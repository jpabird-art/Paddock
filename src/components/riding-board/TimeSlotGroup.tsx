"use client";

import { Plus } from "lucide-react";
import { ExerciseAssignmentCard } from "./ExerciseAssignmentCard";
import type { ExerciseAssignmentData } from "./ExerciseAssignmentCard";

interface Props {
  timeSlot: string;
  assignments: ExerciseAssignmentData[];
  canEdit: boolean;
  onAdd?: (timeSlot: string) => void;
  onEdit?: (assignment: ExerciseAssignmentData) => void;
  onDelete?: (id: string) => void;
}

function formatTimeSlot(slot: string): string {
  return `${slot.slice(0, 2)}:${slot.slice(2)}`;
}

export function TimeSlotGroup({ timeSlot, assignments, canEdit, onAdd, onEdit, onDelete }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-[#1a2744] text-white text-sm font-semibold px-3 py-1 rounded-md">
          {formatTimeSlot(timeSlot)}
        </div>
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400">{assignments.length} horse{assignments.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {assignments.map((a) => (
          <ExerciseAssignmentCard
            key={a.id}
            assignment={a}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {canEdit && (
          <button
            onClick={() => onAdd?.(timeSlot)}
            className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-[#1a2744] hover:border-[#1a2744] transition-colors min-h-[80px]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
