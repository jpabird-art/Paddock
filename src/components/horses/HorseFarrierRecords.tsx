"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";

interface FarrierRecordData {
  id: string;
  serviceDate: string;
  shoeType: string | null;
  hoofCondition: string | null;
  farrierName: string | null;
  notes: string | null;
  createdBy: { name: string };
}

interface Props {
  horseId: string;
  initialRecords: FarrierRecordData[];
  canManage: boolean;
  canDelete: boolean;
}

export function HorseFarrierRecords({ horseId, initialRecords, canManage, canDelete }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [records] = useState(initialRecords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [serviceDate, setServiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shoeType, setShoeType] = useState("");
  const [hoofCondition, setHoofCondition] = useState("");
  const [farrierName, setFarrierName] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setServiceDate(format(new Date(), "yyyy-MM-dd"));
    setShoeType("");
    setHoofCondition("");
    setFarrierName("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceDate) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/farrier-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          serviceDate,
          shoeType: shoeType || undefined,
          hoofCondition: hoofCondition || undefined,
          farrierName: farrierName || undefined,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      toast({ title: "Farrier record added" });
      resetForm();
      setDialogOpen(false);
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this farrier record?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/farrier-records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast({ title: "Record deleted" });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]";

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Farrier Record
          </button>
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No farrier records yet.</p>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Shoe Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hoof Condition</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Farrier</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Notes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Recorded By</th>
                {canDelete && (
                  <th className="px-4 py-3 w-10"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(new Date(r.serviceDate), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">{r.shoeType ?? "—"}</td>
                  <td className="px-4 py-3">{r.hoofCondition ?? "—"}</td>
                  <td className="px-4 py-3">{r.farrierName ?? "—"}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{r.createdBy.name}</td>
                  {canDelete && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Farrier Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shoe Type</label>
              <input
                type="text"
                value={shoeType}
                onChange={(e) => setShoeType(e.target.value)}
                className={inputClass}
                placeholder="e.g. Standard, Remedial, Front only"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hoof Condition</label>
              <textarea
                value={hoofCondition}
                onChange={(e) => setHoofCondition(e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="e.g. Healthy, Cracked near fore, Thrush off hind"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farrier</label>
              <input
                type="text"
                value={farrierName}
                onChange={(e) => setFarrierName(e.target.value)}
                className={inputClass}
                placeholder="Name of farrier"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="Any additional notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#1a2744]/90 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving..." : "Add Record"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
