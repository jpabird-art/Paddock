"use client";

import { useState, useEffect } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface TackAllocationData {
  id: string;
  fitNotes: string | null;
  startDate: string;
  endDate: string | null;
  tackItem: { type: string; identifier: string; brand: string | null; condition: string };
}

interface AvailableTackItem {
  id: string;
  type: string;
  identifier: string;
  brand: string | null;
  condition: string;
}

interface HorseTackAllocationsProps {
  horseId: string;
  ancillaries?: string | null;
  initialAllocations: TackAllocationData[];
  canManage: boolean;
}

export function HorseTackAllocations({
  horseId,
  ancillaries,
  initialAllocations,
  canManage,
}: HorseTackAllocationsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [allocations, setAllocations] = useState<TackAllocationData[]>(initialAllocations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);

  const [availableItems, setAvailableItems] = useState<AvailableTackItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [tackItemId, setTackItemId] = useState("");
  const [fitNotes, setFitNotes] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    if (dialogOpen) {
      setLoadingItems(true);
      fetch("/api/tack/items")
        .then((res) => res.json())
        .then((data) => setAvailableItems(data))
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to load tack items.",
            variant: "destructive",
          })
        )
        .finally(() => setLoadingItems(false));
    }
  }, [dialogOpen, toast]);

  function resetForm() {
    setTackItemId("");
    setFitNotes("");
    setStartDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tackItemId || !startDate) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tack/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          tackItemId,
          fitNotes: fitNotes.trim() || null,
          startDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to allocate tack.",
          variant: "destructive",
        });
        return;
      }

      const allocation = await res.json();
      setAllocations([allocation, ...allocations]);
      resetForm();
      setDialogOpen(false);
      toast({ title: "Tack allocated", description: "Tack item allocated successfully." });
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

  async function handleReturn(allocationId: string) {
    setReturningId(allocationId);
    try {
      const res = await fetch(`/api/tack/allocations/${allocationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: new Date().toISOString() }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.error ?? "Failed to return tack.", variant: "destructive" });
        return;
      }

      toast({ title: "Tack returned", description: "Allocation ended." });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Ancillaries */}
      {ancillaries && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Ancillaries</p>
          <p className="text-sm text-amber-900">{ancillaries}</p>
        </div>
      )}

      {canManage && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1a2744] hover:bg-[#243560]" size="sm">
                Allocate Tack
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Tack Item</DialogTitle>
                <DialogDescription>
                  Select an available tack item and assign it to this horse.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tackItemId">Tack Item</Label>
                  {loadingItems ? (
                    <p className="text-sm text-gray-500">Loading items...</p>
                  ) : (
                    <Select value={tackItemId} onValueChange={setTackItemId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tack item" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.type} — {item.identifier}
                            {item.brand ? ` (${item.brand})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fitNotes">Fit Notes</Label>
                  <Textarea
                    id="fitNotes"
                    value={fitNotes}
                    onChange={(e) => setFitNotes(e.target.value)}
                    placeholder="Any fitting observations or adjustments required..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !tackItemId || !startDate}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                    size="sm"
                  >
                    {loading ? "Saving..." : "Allocate"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {allocations.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No tack allocations recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Item Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Identifier</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Brand</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Condition</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Fit Notes</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Start Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">End Date</th>
                  {canManage && (
                    <th className="px-4 py-3 font-semibold text-gray-700"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {allocations.map((alloc) => {
                  const isCurrent = !alloc.endDate;
                  return (
                    <tr
                      key={alloc.id}
                      className={isCurrent ? "bg-[#1a2744]/5" : ""}
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {alloc.tackItem.type}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-[#1a2744] text-white">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{alloc.tackItem.identifier}</td>
                      <td className="px-4 py-3 text-gray-700">{alloc.tackItem.brand ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{alloc.tackItem.condition}</td>
                      <td className="px-4 py-3 text-gray-700">{alloc.fitNotes ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {format(new Date(alloc.startDate), "dd MMM yyyy")}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {alloc.endDate
                          ? format(new Date(alloc.endDate), "dd MMM yyyy")
                          : "—"}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          {isCurrent && (
                            <button
                              onClick={() => handleReturn(alloc.id)}
                              disabled={returningId === alloc.id}
                              className="text-xs text-red-600 hover:underline font-medium disabled:opacity-50"
                            >
                              {returningId === alloc.id ? "Returning..." : "Return"}
                            </button>
                          )}
                        </td>
                      )}
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
