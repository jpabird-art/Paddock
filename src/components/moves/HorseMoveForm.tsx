"use client";

import { useState, useMemo } from "react";
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
import { X, Plus } from "lucide-react";

interface CrewMember {
  name: string;
  serviceNumber: string;
  role: string;
}

const CREW_ROLES = [
  { value: "DRIVER", label: "Driver" },
  { value: "BOX_GROOM", label: "Box Groom" },
  { value: "ESCORT", label: "Escort" },
  { value: "VET", label: "Vet" },
  { value: "OTHER", label: "Other" },
];

const crewSchema = z.array(z.object({
  name: z.string().min(1),
  serviceNumber: z.string().optional(),
  role: z.string().min(1),
}));

const optStr = z.string().optional().nullable();

const createSchema = z.object({
  horseIds: z.array(z.string().min(1)).min(1, "Select at least one horse"),
  fromLocationId: optStr,
  toLocationId: z.string().min(1, "Destination is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  arrivalDate: optStr,
  status: z.enum(["PLANNED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]),
  driverName: optStr,
  driverServiceNumber: optStr,
  vehicleVRN: optStr,
  boxGroomName: optStr,
  notes: optStr,
  crew: crewSchema.optional().nullable(),
});

const editSchema = z.object({
  horseId: z.string().min(1, "Horse is required"),
  fromLocationId: optStr,
  toLocationId: z.string().min(1, "Destination is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  arrivalDate: optStr,
  status: z.enum(["PLANNED", "IN_TRANSIT", "COMPLETED", "CANCELLED"]),
  driverName: optStr,
  driverServiceNumber: optStr,
  vehicleVRN: optStr,
  boxGroomName: optStr,
  notes: optStr,
  crew: crewSchema.optional().nullable(),
});

interface HorseMoveFormProps {
  horses: { id: string; name: string; regimentalNumber: string; squadron?: string | null }[];
  locations: { id: string; name: string; code: string }[];
  initialData?: {
    id?: string;
    horseId?: string;
    fromLocationId?: string;
    toLocationId?: string;
    departureDate?: string;
    arrivalDate?: string;
    status?: "PLANNED" | "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
    driverName?: string;
    driverServiceNumber?: string;
    vehicleVRN?: string;
    boxGroomName?: string;
    notes?: string;
    crew?: CrewMember[];
  };
  mode: "create" | "edit";
  moveId?: string;
}

export function HorseMoveForm({ horses, locations, initialData, mode, moveId }: HorseMoveFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-select state (create mode)
  const [selectedHorseIds, setSelectedHorseIds] = useState<string[]>(
    initialData?.horseId ? [initialData.horseId] : []
  );
  const [horseSearch, setHorseSearch] = useState("");

  // Form fields
  const [fromLocationId, setFromLocationId] = useState(initialData?.fromLocationId ?? "");
  const [toLocationId, setToLocationId] = useState(initialData?.toLocationId ?? "");
  const [departureDate, setDepartureDate] = useState(
    initialData?.departureDate ? initialData.departureDate.substring(0, 10) : ""
  );
  const [arrivalDate, setArrivalDate] = useState(
    initialData?.arrivalDate ? initialData.arrivalDate.substring(0, 10) : ""
  );
  const [status, setStatus] = useState(initialData?.status ?? "PLANNED");
  const [driverName, setDriverName] = useState(initialData?.driverName ?? "");
  const [driverServiceNumber, setDriverServiceNumber] = useState(initialData?.driverServiceNumber ?? "");
  const [vehicleVRN, setVehicleVRN] = useState(initialData?.vehicleVRN ?? "");
  const [boxGroomName, setBoxGroomName] = useState(initialData?.boxGroomName ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  // Crew state
  const [crew, setCrew] = useState<CrewMember[]>(initialData?.crew ?? []);

  function addCrewMember() {
    setCrew((prev) => [...prev, { name: "", serviceNumber: "", role: "BOX_GROOM" }]);
  }

  function removeCrewMember(index: number) {
    setCrew((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCrewMember(index: number, field: keyof CrewMember, value: string) {
    setCrew((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  const filteredHorses = useMemo(() => {
    if (!horseSearch) return horses;
    const q = horseSearch.toLowerCase();
    return horses.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.regimentalNumber.toLowerCase().includes(q)
    );
  }, [horses, horseSearch]);

  const lifeGuards = horses.filter((h) => h.squadron === "THE_LIFE_GUARDS");
  const bluesAndRoyals = horses.filter((h) => h.squadron === "THE_BLUES_AND_ROYALS");

  function toggleHorse(id: string) {
    setSelectedHorseIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setErrors((prev) => ({ ...prev, horseIds: "" }));
  }

  function selectSquadron(squadronHorses: { id: string }[]) {
    const ids = squadronHorses.map((h) => h.id);
    setSelectedHorseIds((prev) => {
      const combined = new Set([...prev, ...ids]);
      return Array.from(combined);
    });
    setErrors((prev) => ({ ...prev, horseIds: "" }));
  }

  function clearAll() {
    setSelectedHorseIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Filter out empty crew entries
    const validCrew = crew.filter((m) => m.name.trim());

    const payload = {
      ...(mode === "create"
        ? { horseIds: selectedHorseIds }
        : { horseId: selectedHorseIds[0] }),
      fromLocationId: fromLocationId || null,
      toLocationId,
      departureDate,
      arrivalDate: arrivalDate || null,
      status,
      driverName: driverName || null,
      driverServiceNumber: driverServiceNumber || null,
      vehicleVRN: vehicleVRN || null,
      boxGroomName: boxGroomName || null,
      notes: notes || null,
      crew: validCrew.length > 0 ? validCrew : null,
    };

    const schema = mode === "create" ? createSchema : editSchema;
    const parse = schema.safeParse(
      mode === "create"
        ? { ...payload, horseIds: selectedHorseIds }
        : { ...payload, horseId: selectedHorseIds[0] }
    );

    if (!parse.success) {
      const fieldErrors: Record<string, string> = {};
      parse.error.errors.forEach((err) => {
        const field = String(err.path[0]);
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

      const result = await res.json();

      if (mode === "create") {
        const count = Array.isArray(result) ? result.length : 1;
        toast({
          title: "Move created",
          description:
            count > 1
              ? `Group move logged for ${count} horses.`
              : "Horse move has been logged.",
        });
        const firstId = Array.isArray(result) ? result[0].id : result.id;
        router.push(`/moves/${firstId}`);
      } else {
        toast({ title: "Move updated", description: "Move record updated." });
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

  const selectedHorses = horses.filter((h) => selectedHorseIds.includes(h.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Horse Selection */}
      {mode === "create" ? (
        <div className="space-y-3">
          <Label>
            Horses{" "}
            <span className="text-gray-400 font-normal">
              ({selectedHorseIds.length} selected)
            </span>
          </Label>

          {/* Quick select buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => selectSquadron(lifeGuards)}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Life Guards ({lifeGuards.length})
            </button>
            <button
              type="button"
              onClick={() => selectSquadron(bluesAndRoyals)}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Blues & Royals ({bluesAndRoyals.length})
            </button>
            <button
              type="button"
              onClick={() => selectSquadron(horses)}
              className="text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              + Select All ({horses.length})
            </button>
            {selectedHorseIds.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs px-2.5 py-1 rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Selected chips */}
          {selectedHorses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedHorses.map((h) => (
                <span
                  key={h.id}
                  className="inline-flex items-center gap-1 bg-[#1a2744] text-white text-xs px-2 py-1 rounded-md"
                >
                  {h.name}
                  <button
                    type="button"
                    onClick={() => toggleHorse(h.id)}
                    className="hover:text-red-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search + checkbox list */}
          <Input
            placeholder="Search horses..."
            value={horseSearch}
            onChange={(e) => setHorseSearch(e.target.value)}
          />
          <div className="border rounded-md max-h-48 overflow-y-auto divide-y">
            {filteredHorses.length === 0 ? (
              <p className="text-sm text-gray-400 p-3 text-center">No horses match.</p>
            ) : (
              filteredHorses.map((h) => (
                <label
                  key={h.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedHorseIds.includes(h.id)}
                    onChange={() => toggleHorse(h.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium text-gray-800">{h.name}</span>
                  <span className="text-gray-400 font-mono text-xs">{h.regimentalNumber}</span>
                  {h.squadron && (
                    <span className="text-gray-400 text-xs ml-auto">
                      {h.squadron === "THE_LIFE_GUARDS" ? "LG" : "B&R"}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
          {errors.horseIds && <p className="text-sm text-red-600">{errors.horseIds}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Horse</Label>
          <Select
            value={selectedHorseIds[0] ?? ""}
            onValueChange={(v) => setSelectedHorseIds([v])}
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
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
            value={fromLocationId || "none"}
            onValueChange={(v) => setFromLocationId(v === "none" ? "" : v)}
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
          <Select value={toLocationId} onValueChange={setToLocationId}>
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
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
          {errors.departureDate && <p className="text-sm text-red-600">{errors.departureDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="arrivalDate">Arrival Date</Label>
          <Input
            id="arrivalDate"
            type="date"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicleVRN">Vehicle VRN</Label>
          <Input
            id="vehicleVRN"
            value={vehicleVRN}
            onChange={(e) => setVehicleVRN(e.target.value.toUpperCase())}
            placeholder="e.g. AB12 CDE"
            className="font-mono uppercase"
          />
        </div>
      </div>

      {/* Crew / Personnel Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Personnel</Label>
          <button
            type="button"
            onClick={addCrewMember}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add Person
          </button>
        </div>

        {crew.length === 0 ? (
          <p className="text-sm text-gray-400 border rounded-md p-4 text-center">
            No personnel added. Click &quot;Add Person&quot; to assign crew members.
          </p>
        ) : (
          <div className="space-y-2">
            {crew.map((member, index) => (
              <div
                key={index}
                className="flex items-start gap-2 border rounded-md p-3 bg-gray-50"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                  <Input
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateCrewMember(index, "name", e.target.value)}
                  />
                  <Input
                    placeholder="Service No. (optional)"
                    value={member.serviceNumber}
                    onChange={(e) => updateCrewMember(index, "serviceNumber", e.target.value)}
                    className="font-mono"
                  />
                  <Select
                    value={member.role}
                    onValueChange={(v) => updateCrewMember(index, "role", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREW_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => removeCrewMember(index)}
                  className="text-red-500 hover:text-red-700 p-1 mt-1 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
            ? selectedHorseIds.length > 1
              ? `Create Group Move (${selectedHorseIds.length} horses)`
              : "Create Move"
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
