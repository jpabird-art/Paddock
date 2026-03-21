"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MedicationRecordData {
  id: string;
  medicationName: string;
  dosage: string;
  route: string;
  batchNumber: string | null;
  withdrawalDays: number | null;
  withdrawalEndDate: string | null;
  notes: string | null;
  administeredAt: string;
  administeredBy: { name: string };
}

interface HorseMedicationRecordsProps {
  horseId: string;
  initialRecords: MedicationRecordData[];
  canManage: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  ORAL: "Oral",
  IV: "Intravenous",
  IM: "Intramuscular",
  TOPICAL: "Topical",
};

export function HorseMedicationRecords({
  horseId,
  initialRecords,
  canManage,
}: HorseMedicationRecordsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [records, setRecords] = useState<MedicationRecordData[]>(initialRecords);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [withdrawalDays, setWithdrawalDays] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setMedicationName("");
    setDosage("");
    setRoute("");
    setBatchNumber("");
    setWithdrawalDays("");
    setNotes("");
  }

  function isInWithdrawal(withdrawalEndDate: string | null): boolean {
    if (!withdrawalEndDate) return false;
    return new Date(withdrawalEndDate) > new Date();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicationName.trim() || !dosage.trim() || !route) return;

    setLoading(true);
    try {
      const res = await fetch("/api/medication-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          horseId,
          medicationName: medicationName.trim(),
          dosage: dosage.trim(),
          route,
          batchNumber: batchNumber.trim() || null,
          withdrawalDays: withdrawalDays ? parseInt(withdrawalDays, 10) : null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to add medication record.",
          variant: "destructive",
        });
        return;
      }

      const record = await res.json();
      setRecords([record, ...records]);
      resetForm();
      setOpen(false);
      toast({
        title: "Record added",
        description: "Medication record saved successfully.",
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
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Medication Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="medicationName">Medication Name</Label>
                  <Input
                    id="medicationName"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="e.g. Phenylbutazone"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 2g"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="route">Route</Label>
                    <Select value={route} onValueChange={setRoute} required>
                      <SelectTrigger id="route">
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORAL">Oral</SelectItem>
                        <SelectItem value="IV">Intravenous</SelectItem>
                        <SelectItem value="IM">Intramuscular</SelectItem>
                        <SelectItem value="TOPICAL">Topical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch No. (optional)</Label>
                    <Input
                      id="batchNumber"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BN-20260315"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalDays">Withdrawal Days (optional)</Label>
                    <Input
                      id="withdrawalDays"
                      type="number"
                      min="0"
                      value={withdrawalDays}
                      onChange={(e) => setWithdrawalDays(e.target.value)}
                      placeholder="e.g. 7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional observations or instructions..."
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
                    disabled={loading || !medicationName.trim() || !dosage.trim() || !route}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                    size="sm"
                  >
                    {loading ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {records.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No medication records found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Batch No.</TableHead>
                  <TableHead>Withdrawal End</TableHead>
                  <TableHead>Administered By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const inWithdrawal = isInWithdrawal(record.withdrawalEndDate);
                  return (
                    <TableRow
                      key={record.id}
                      className={inWithdrawal ? "bg-amber-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {record.medicationName}
                        {inWithdrawal && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Withdrawal
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{record.dosage}</TableCell>
                      <TableCell>{ROUTE_LABELS[record.route] ?? record.route}</TableCell>
                      <TableCell className="text-gray-500">
                        {record.batchNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        {record.withdrawalEndDate
                          ? format(new Date(record.withdrawalEndDate), "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>{record.administeredBy.name}</TableCell>
                      <TableCell>
                        {format(new Date(record.administeredAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-500">
                        {record.notes ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
