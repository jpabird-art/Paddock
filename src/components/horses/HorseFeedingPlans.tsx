"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FeedingPlanData {
  id: string;
  feedType: string;
  quantityKg: number;
  frequency: string;
  timeOfDay: string | null;
  specialNotes: string | null;
  startDate: string;
  isActive: boolean;
}

interface HorseFeedingPlansProps {
  horseId: string;
  initialPlans: FeedingPlanData[];
  canManage: boolean;
}

const FEED_TYPE_LABELS: Record<string, string> = {
  HAY: "Hay",
  HARD_FEED: "Hard Feed",
  HIGH_ENERGY_MIX: "High Energy Mix",
  SUPPLEMENT: "Supplement",
  CHAFF: "Chaff",
  BEET_PULP: "Beet Pulp",
  OTHER: "Other",
};

const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_DAILY: "1x Daily",
  TWICE_DAILY: "2x Daily",
  THREE_TIMES_DAILY: "3x Daily",
  FOUR_TIMES_DAILY: "4x Daily",
  AS_NEEDED: "As Needed",
};

export function HorseFeedingPlans({
  horseId,
  initialPlans,
  canManage,
}: HorseFeedingPlansProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<FeedingPlanData[]>(initialPlans);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedType, setFeedType] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [frequency, setFrequency] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");

  function resetForm() {
    setFeedType("");
    setQuantityKg("");
    setFrequency("");
    setTimeOfDay("");
    setSpecialNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feedType || !quantityKg || !frequency) return;

    setLoading(true);
    try {
      const res = await fetch("/api/feeding-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          feedType,
          quantityKg: parseFloat(quantityKg),
          frequency,
          timeOfDay: timeOfDay || undefined,
          specialNotes: specialNotes || undefined,
          startDate: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to add feeding plan.",
          variant: "destructive",
        });
        return;
      }

      const plan = await res.json();
      setPlans([plan, ...plans]);
      resetForm();
      setOpen(false);
      toast({
        title: "Feeding plan added",
        description: "The feeding plan has been saved successfully.",
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

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                Add Feeding Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add Feeding Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="feedType">Feed Type</Label>
                  <Select value={feedType} onValueChange={setFeedType}>
                    <SelectTrigger id="feedType">
                      <SelectValue placeholder="Select feed type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FEED_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantityKg">Quantity (kg)</Label>
                  <Input
                    id="quantityKg"
                    type="number"
                    step="0.1"
                    min="0"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    placeholder="e.g. 2.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeOfDay">Time of Day</Label>
                  <Input
                    id="timeOfDay"
                    type="text"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    placeholder="e.g. Morning, 06:00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialNotes">Special Notes</Label>
                  <Textarea
                    id="specialNotes"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Any special instructions or notes..."
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
                    disabled={loading || !feedType || !quantityKg || !frequency}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                    size="sm"
                  >
                    {loading ? "Saving..." : "Add Plan"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {activePlans.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No active feeding plans recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Feed Type
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Quantity (kg)
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Frequency
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Time of Day
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Special Notes
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Start Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activePlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      {FEED_TYPE_LABELS[plan.feedType] ?? plan.feedType}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {plan.quantityKg}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {FREQUENCY_LABELS[plan.frequency] ?? plan.frequency}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {plan.timeOfDay ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {plan.specialNotes ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {format(new Date(plan.startDate), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
