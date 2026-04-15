"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { TimeSlotGroup } from "./TimeSlotGroup";
import { ExerciseAssignmentDialog } from "./ExerciseAssignmentDialog";
import { BulkAssignmentDialog } from "./BulkAssignmentDialog";
import { Plus } from "lucide-react";
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
  assignments: ExerciseAssignmentData[];
  date: string;
  canEdit: boolean;
  horses: HorseOption[];
  users: UserOption[];
}

export function DailyBoardView({ assignments, date, canEdit, horses, users }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ExerciseAssignmentData | null>(null);
  const [defaultTimeSlot, setDefaultTimeSlot] = useState<string | undefined>();

  // Group assignments by time slot
  const timeSlots = new Map<string, ExerciseAssignmentData[]>();
  for (const a of assignments) {
    const existing = timeSlots.get(a.timeSlot) ?? [];
    existing.push(a);
    timeSlots.set(a.timeSlot, existing);
  }
  const sortedSlots = [...timeSlots.entries()].sort(([a], [b]) => a.localeCompare(b));

  function handleAdd(timeSlot: string) {
    setEditingAssignment(null);
    setDefaultTimeSlot(timeSlot);
    setSingleDialogOpen(true);
  }

  function handleEdit(assignment: ExerciseAssignmentData) {
    setEditingAssignment(assignment);
    setDefaultTimeSlot(undefined);
    setSingleDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this assignment?")) return;

    try {
      const res = await fetch(`/api/exercise-assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Assignment removed" });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingAssignment(null);
              setDefaultTimeSlot(undefined);
              setSingleDialogOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Assignment
          </button>
          <button
            onClick={() => setBulkDialogOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-[#1a2744] text-[#1a2744] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Full Ride
          </button>
        </div>
      )}

      {sortedSlots.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          No assignments for this date.
          {canEdit && (
            <div className="mt-2">
              <button
                onClick={() => {
                  setEditingAssignment(null);
                  setDefaultTimeSlot("0630");
                  setSingleDialogOpen(true);
                }}
                className="text-[#1a2744] hover:underline font-medium"
              >
                Create the first assignment
              </button>
            </div>
          )}
        </div>
      ) : (
        sortedSlots.map(([slot, slotAssignments]) => (
          <TimeSlotGroup
            key={slot}
            timeSlot={slot}
            assignments={slotAssignments}
            canEdit={canEdit}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      <ExerciseAssignmentDialog
        open={singleDialogOpen}
        onClose={() => {
          setSingleDialogOpen(false);
          setEditingAssignment(null);
        }}
        horses={horses}
        users={users}
        date={date}
        defaultTimeSlot={defaultTimeSlot}
        editing={editingAssignment}
      />

      <BulkAssignmentDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        horses={horses}
        users={users}
        date={date}
      />
    </div>
  );
}
