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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";

interface InspectionData {
  id: string;
  result: string;
  findings: string | null;
  scheduledDate: string;
  completedAt: string | null;
  inspector: { name: string };
  schedule: { name: string } | null;
}

interface HorseInspectionsProps {
  horseId: string;
  initialInspections: InspectionData[];
  canManage: boolean;
}

const RESULT_BADGE_CLASSES: Record<string, string> = {
  PASS: "bg-green-100 text-green-800",
  FAIL: "bg-red-100 text-red-800",
  ADVISORY: "bg-amber-100 text-amber-800",
};

export function HorseInspections({
  horseId,
  initialInspections,
  canManage,
}: HorseInspectionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [inspections, setInspections] =
    useState<InspectionData[]>(initialInspections);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    result: "PASS" as "PASS" | "FAIL" | "ADVISORY",
    findings: "",
    scheduledDate: "",
    completedAt: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setFormData({
      result: "PASS",
      findings: "",
      scheduledDate: "",
      completedAt: "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.scheduledDate) {
      toast({
        title: "Validation error",
        description: "Scheduled date is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          result: formData.result,
          findings: formData.findings || null,
          scheduledDate: formData.scheduledDate,
          completedAt: formData.completedAt || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to record inspection.",
          variant: "destructive",
        });
        return;
      }

      const inspection = await res.json();
      setInspections([inspection, ...inspections]);
      resetForm();
      setOpen(false);
      toast({
        title: "Inspection recorded",
        description: "Inspection has been saved successfully.",
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
              <Button size="sm" className="bg-[#1a2744] hover:bg-[#243560]">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Record Inspection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Record Inspection</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Result</Label>
                  <Select
                    value={formData.result}
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        result: v as "PASS" | "FAIL" | "ADVISORY",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASS">Pass</SelectItem>
                      <SelectItem value="FAIL">Fail</SelectItem>
                      <SelectItem value="ADVISORY">Advisory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="findings">Findings</Label>
                  <Textarea
                    id="findings"
                    name="findings"
                    value={formData.findings}
                    onChange={handleChange}
                    placeholder="Record any observations or findings..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completedAt">Completed At</Label>
                  <Input
                    id="completedAt"
                    name="completedAt"
                    type="date"
                    value={formData.completedAt}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank if not yet completed.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                  >
                    {loading ? "Saving..." : "Save Inspection"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {inspections.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No inspection records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Schedule
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Result
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Findings
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Inspector
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inspections.map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {format(
                        new Date(inspection.scheduledDate),
                        "dd MMM yyyy"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {inspection.schedule?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          RESULT_BADGE_CLASSES[inspection.result] ??
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {inspection.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {inspection.findings ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {inspection.inspector.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {inspection.completedAt
                        ? format(
                            new Date(inspection.completedAt),
                            "dd MMM yyyy"
                          )
                        : "—"}
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
