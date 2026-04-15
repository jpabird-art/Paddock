"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

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
}

interface PairRow {
  key: number;
  horseId: string;
  riderId: string;
}

export function BulkAssignmentDialog({ open, onClose, horses, users, date }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [exerciseName, setExerciseName] = useState("");
  const [timeSlot, setTimeSlot] = useState("0630");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [pairs, setPairs] = useState<PairRow[]>([{ key: 0, horseId: "", riderId: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [nextKey, setNextKey] = useState(1);

  function addRow() {
    setPairs((prev) => [...prev, { key: nextKey, horseId: "", riderId: "" }]);
    setNextKey((k) => k + 1);
  }

  function removeRow(key: number) {
    setPairs((prev) => prev.filter((p) => p.key !== key));
  }

  function updatePair(key: number, field: "horseId" | "riderId", value: string) {
    setPairs((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validPairs = pairs.filter((p) => p.horseId && p.riderId);
    if (validPairs.length === 0 || !exerciseName || !timeSlot) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/exercise-assignments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          timeSlot,
          exerciseName,
          duration: duration ? parseInt(duration) : undefined,
          notes: notes || undefined,
          assignments: validPairs.map((p) => ({
            horseId: p.horseId,
            riderId: p.riderId,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create ride");
      }

      const result = await res.json();
      toast({
        title: "Ride created",
        description: `${result.created} assignments created. Riders notified.`,
      });

      // Reset form
      setPairs([{ key: 0, horseId: "", riderId: "" }]);
      setNextKey(1);
      setExerciseName("");
      setDuration("");
      setNotes("");

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

  // Horses already used in this bulk form
  const usedHorseIds = new Set(pairs.map((p) => p.horseId).filter(Boolean));

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Full Ride</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise</label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Ridden Exercise"
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Horse — Rider Pairs
              </label>
              <span className="text-xs text-gray-400">
                {pairs.filter((p) => p.horseId && p.riderId).length} pair{pairs.filter((p) => p.horseId && p.riderId).length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {pairs.map((pair) => (
                <div key={pair.key} className="flex items-center gap-2">
                  <select
                    value={pair.horseId}
                    onChange={(e) => updatePair(pair.key, "horseId", e.target.value)}
                    className={`${inputClass} flex-1`}
                  >
                    <option value="">Horse...</option>
                    {horses
                      .filter((h) => !usedHorseIds.has(h.id) || h.id === pair.horseId)
                      .map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.regimentalNumber})
                        </option>
                      ))}
                  </select>
                  <select
                    value={pair.riderId}
                    onChange={(e) => updatePair(pair.key, "riderId", e.target.value)}
                    className={`${inputClass} flex-1`}
                  >
                    <option value="">Rider...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.rank ? `${u.rank} ` : ""}{u.name}
                      </option>
                    ))}
                  </select>
                  {pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(pair.key)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 flex items-center gap-1 text-xs text-[#1a2744] hover:underline font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another pair
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || pairs.filter((p) => p.horseId && p.riderId).length === 0}
              className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Ride"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
