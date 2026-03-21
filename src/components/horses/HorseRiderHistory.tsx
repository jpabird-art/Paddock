"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface RiderAssignmentData {
  id: string;
  suitabilityScore: number | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  rider: { name: string; serviceNumber: string };
}

interface UserOption {
  id: string;
  name: string;
  serviceNumber: string;
}

interface HorseRiderHistoryProps {
  horseId: string;
  initialAssignments: RiderAssignmentData[];
  canManage: boolean;
  users: UserOption[];
}

function SuitabilityStars({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs text-gray-400">N/A</span>;
  }
  return (
    <div className="flex items-center gap-0.5" title={`${score} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < score ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

export function HorseRiderHistory({
  horseId,
  initialAssignments,
  canManage,
  users,
}: HorseRiderHistoryProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [assignments, setAssignments] =
    useState<RiderAssignmentData[]>(initialAssignments);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [riderId, setRiderId] = useState("");
  const [suitabilityScore, setSuitabilityScore] = useState("");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setRiderId("");
    setSuitabilityScore("");
    setStartDate("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!riderId || !startDate) return;

    setLoading(true);
    try {
      const res = await fetch("/api/rider-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          riderId,
          suitabilityScore: suitabilityScore ? Number(suitabilityScore) : null,
          startDate,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to assign rider.",
          variant: "destructive",
        });
        return;
      }

      const assignment = await res.json();
      setAssignments([assignment, ...assignments]);
      resetForm();
      setOpen(false);
      toast({
        title: "Rider assigned",
        description: "Rider assignment saved successfully.",
      });
      router.refresh();
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                Assign Rider
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Rider</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="riderId">Rider</Label>
                  <Select value={riderId} onValueChange={setRiderId}>
                    <SelectTrigger id="riderId">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.serviceNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suitabilityScore">Suitability Score</Label>
                  <Select
                    value={suitabilityScore}
                    onValueChange={setSuitabilityScore}
                  >
                    <SelectTrigger id="suitabilityScore">
                      <SelectValue placeholder="Select score (1-5)" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} / 5
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this assignment..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !riderId || !startDate}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                    size="sm"
                  >
                    {loading ? "Saving..." : "Assign"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No rider assignments recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Rider
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Suitability
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Start Date
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    End Date
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-700">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignments.map((a) => {
                  const isCurrent = !a.endDate;
                  return (
                    <tr
                      key={a.id}
                      className={isCurrent ? "bg-blue-50/60" : ""}
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">
                          {a.rider.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.rider.serviceNumber}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <SuitabilityStars score={a.suitabilityScore} />
                      </td>
                      <td className="px-5 py-3 text-gray-700">
                        {format(new Date(a.startDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-5 py-3">
                        {a.endDate ? (
                          <span className="text-gray-700">
                            {format(new Date(a.endDate), "dd MMM yyyy")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                        {a.notes ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
