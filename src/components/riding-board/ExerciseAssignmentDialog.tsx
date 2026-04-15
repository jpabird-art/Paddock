"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
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
  open: boolean;
  onClose: () => void;
  horses: HorseOption[];
  users: UserOption[];
  date: string;
  defaultTimeSlot?: string;
  editing?: ExerciseAssignmentData | null;
}

export function ExerciseAssignmentDialog({
  open,
  onClose,
  horses,
  users,
  date,
  defaultTimeSlot,
  editing,
}: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [horseId, setHorseId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [timeSlot, setTimeSlot] = useState(defaultTimeSlot ?? "0630");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setHorseId(editing.horse.id);
      setRiderId(editing.rider.id);
      setExerciseName(editing.exerciseName);
      setTimeSlot(editing.timeSlot);
      setDuration(editing.duration ? String(editing.duration) : "");
      setNotes(editing.notes ?? "");
    } else {
      setHorseId("");
      setRiderId("");
      setExerciseName("");
      setTimeSlot(defaultTimeSlot ?? "0630");
      setDuration("");
      setNotes("");
    }
  }, [editing, defaultTimeSlot, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!horseId || !riderId || !exerciseName || !timeSlot) return;

    setSubmitting(true);
    try {
      const payload = {
        horseId,
        riderId,
        exerciseName,
        date,
        timeSlot,
        duration: duration ? parseInt(duration) : undefined,
        notes: notes || undefined,
      };

      const url = editing
        ? `/api/exercise-assignments/${editing.id}`
        : "/api/exercise-assignments";

      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { riderId, exerciseName, timeSlot, duration: duration ? parseInt(duration) : null, notes: notes || null } : payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast({
        title: editing ? "Assignment updated" : "Assignment created",
        description: `${horses.find((h) => h.id === horseId)?.name ?? "Horse"} assigned successfully.`,
      });

      onClose();
      router.refresh();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Assignment" : "Add Assignment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horse</label>
            <select
              value={horseId}
              onChange={(e) => setHorseId(e.target.value)}
              className={inputClass}
              required
              disabled={!!editing}
            >
              <option value="">Select horse...</option>
              {horses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.regimentalNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rider</label>
            <select
              value={riderId}
              onChange={(e) => setRiderId(e.target.value)}
              className={inputClass}
              required
            >
              <option value="">Select rider...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.rank ? `${u.rank} ` : ""}{u.name} ({u.serviceNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
            <input
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Ridden Exercise, Long Reins, Sword Drill"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={inputClass}
                placeholder="0630"
                pattern="\d{4}"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
                placeholder="Optional"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              rows={2}
              placeholder="Optional"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
