"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
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
import { useToast } from "@/components/ui/use-toast";

const moveSchema = z.object({
  horseId: z.string().min(1, "Horse is required"),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().min(1, "Destination is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  arrivalDate: z.string().optional(),
  status: z.enum(["PLANNED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]),
  driverName: z.string().optional(),
  driverServiceNumber: z.string().optional(),
  vehicleVRN: z.string().optional(),
  boxGroomName: z.string().optional(),
  notes: z.string().optional(),
});

type MoveFormData = z.infer<typeof moveSchema>;

interface HorseMoveFormProps {
  horses: { id: string; name: string; regimentalNumber: string }[];
  locations: { id: string; name: string; code: string }[];
  initialData?: Partial<MoveFormData> & { id?: string };
  mode: "create" | "edit";
  moveId?: string;
}

export function HorseMoveForm({ horses, locations, initialData, mode, moveId }: HorseMoveFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MoveFormData, string>>>({});

  const [formData, setFormData] = useState<MoveFormData>({
    horseId: initialData?.horseId ?? "",
    fromLocationId: initialData?.fromLocationId ?? "",
    toLocationId: initialData?.toLocationId ?? "",
    departureDate: initialData?.departureDate
      ? initialData.departureDate.substring(0, 10)
      : "",
    arrivalDate: initialData?.arrivalDate
      ? initialData.arrivalDate.substring(0, 10)
      : "",
    status: initialData?.status ?? "PLANNED",
    driverName: initialData?.driverName ?? "",
    driverServiceNumber: initialData?.driverServiceNumber ?? "",
    vehicleVRN: initialData?.vehicleVRN ?? "",
    boxGroomName: initialData?.boxGroomName ?? "",
    notes: initialData?.notes ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    const finalValue = name === "vehicleVRN" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSelect(name: string, value: string) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const payload = {
      ...formData,
      fromLocationId: formData.fromLocationId || null,
      arrivalDate: formData.arrivalDate || null,
      driverName: formData.driverName || null,
      driverServiceNumber: formData.driverServiceNumber || null,
      vehicleVRN: formData.vehicleVRN || null,
      boxGroomName: formData.boxGroomName || null,
      notes: formData.notes || null,
    };

    const parse = moveSchema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors: typeof errors = {};
      parse.error.errors.forEach((err) => {
        const field = err.path[0] as keyof MoveFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const url = mode === "create" ? "/api/horse-moves" : `/api/horse-moves/${moveId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to save move.",
          variant: "destructive",
        });
        return;
      }

      const move = await res.json();
      toast({
        title: mode === "create" ? "Move created" : "Move updated",
        description: mode === "create" ? "Horse move has been logged." : "Move record updated.",
      });

      if (mode === "create") {
        router.push(`/moves/${move.id}`);
      } else {
        router.refresh();
      }
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Horse</Label>
          <Select
            value={formData.horseId}
            onValueChange={(v) => handleSelect("horseId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select horse" />
            </SelectTrigger>
            <SelectContent>
              {horses.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name} — {h.regimentalNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.horseId && <p className="text-sm text-red-600">{errors.horseId}</p>}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(v) => handleSelect("status", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PLANNED">Planned</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>From Location</Label>
          <Select
            value={formData.fromLocationId ?? ""}
            onValueChange={(v) => handleSelect("fromLocationId", v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unknown / First move" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unknown / First move</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>To Location</Label>
          <Select
            value={formData.toLocationId}
            onValueChange={(v) => handleSelect("toLocationId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.toLocationId && <p className="text-sm text-red-600">{errors.toLocationId}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureDate">Departure Date</Label>
          <Input
            id="departureDate"
            name="departureDate"
            type="date"
            value={formData.departureDate}
            onChange={handleChange}
          />
          {errors.departureDate && <p className="text-sm text-red-600">{errors.departureDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Arrival Date</Label>
          <Input
            id="arrivalDate"
            name="arrivalDate"
            type="date"
            value={formData.arrivalDate ?? ""}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driverName">Driver Name</Label>
          <Input
            id="driverName"
            name="driverName"
            value={formData.driverName ?? ""}
            onChange={handleChange}
            placeholder="e.g. Cpl J. Smith"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="driverServiceNumber">Driver Service Number</Label>
          <Input
            id="driverServiceNumber"
            name="driverServiceNumber"
            value={formData.driverServiceNumber ?? ""}
            onChange={handleChange}
            placeholder="e.g. CPL001"
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleVRN">Vehicle VRN</Label>
          <Input
            id="vehicleVRN"
            name="vehicleVRN"
            value={formData.vehicleVRN ?? ""}
            onChange={handleChange}
            placeholder="e.g. AB12 CDE"
            className="font-mono uppercase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="boxGroomName">Box Groom Name</Label>
          <Input
            id="boxGroomName"
            name="boxGroomName"
            value={formData.boxGroomName ?? ""}
            onChange={handleChange}
            placeholder="e.g. Tpr A. Jones"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes ?? ""}
          onChange={handleChange}
          placeholder="Any special instructions or notes..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="bg-[#1a2744] hover:bg-[#243560]">
          {loading
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
            ? "Create Move"
            : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
