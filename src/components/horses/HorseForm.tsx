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

const horseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  regimentalNumber: z.string().min(1, "Regimental number is required"),
  squadronNumber: z.string().optional(),
  breed: z.string().min(1, "Breed is required"),
  colour: z.string().min(1, "Colour is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  serviceEntryDate: z.string().min(1, "Service entry date is required"),
  heightHands: z.coerce.number().min(10).max(20),
  weightKg: z.coerce.number().min(200).max(1000),
  maxRiderWeightKg: z.coerce.number().min(50).max(150),
  squadron: z.enum(["THE_LIFE_GUARDS", "THE_BLUES_AND_ROYALS"], { required_error: "Squadron is required" }),
  taskReadiness: z.enum(["FULL_EXERCISE", "LIMITED_ROLE", "NON_TASKWORTHY"]),
  sex: z.enum(["GELDING", "MARE"]).optional(),
  role: z.enum(["CHARGER", "CAV_BLACK", "GREY", "STANDARD", "COMP", "RMT"]).optional(),
  division: z.coerce.number().min(1).max(2).optional(),
  currentLocationId: z.string().optional(),
});

type HorseFormData = z.infer<typeof horseSchema>;

interface HorseFormProps {
  initialData?: Partial<HorseFormData> & { id?: string; ancillaries?: string; sex?: string; role?: string; division?: number; currentLocationId?: string };
  mode: "create" | "edit";
  locations?: { id: string; name: string; code: string }[];
}

export function HorseForm({ initialData, mode, locations = [] }: HorseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof HorseFormData, string>>>({});
  const [ancillaries, setAncillaries] = useState(initialData?.ancillaries ?? "");

  const [formData, setFormData] = useState<HorseFormData>({
    name: initialData?.name ?? "",
    regimentalNumber: initialData?.regimentalNumber ?? "",
    squadronNumber: initialData?.squadronNumber ?? "",
    breed: initialData?.breed ?? "",
    colour: initialData?.colour ?? "",
    dateOfBirth: initialData?.dateOfBirth
      ? initialData.dateOfBirth.substring(0, 10)
      : "",
    serviceEntryDate: initialData?.serviceEntryDate
      ? initialData.serviceEntryDate.substring(0, 10)
      : "",
    heightHands: initialData?.heightHands ?? 16.0,
    weightKg: initialData?.weightKg ?? 550,
    maxRiderWeightKg: initialData?.maxRiderWeightKg ?? 90,
    squadron: initialData?.squadron ?? ("" as "THE_LIFE_GUARDS" | "THE_BLUES_AND_ROYALS"),
    taskReadiness: initialData?.taskReadiness ?? "FULL_EXERCISE",
    sex: initialData?.sex as "GELDING" | "MARE" | undefined,
    role: initialData?.role as "CHARGER" | "CAV_BLACK" | "GREY" | "STANDARD" | "COMP" | "RMT" | undefined,
    division: initialData?.division,
    currentLocationId: initialData?.currentLocationId,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSelect(name: string, value: string | number) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const parse = horseSchema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors: typeof errors = {};
      parse.error.errors.forEach((err) => {
        const field = err.path[0] as keyof HorseFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const url =
        mode === "create" ? "/api/horses" : `/api/horses/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parse.data,
          ancillaries: ancillaries.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to save horse.",
          variant: "destructive",
        });
        return;
      }

      const horse = await res.json();
      toast({
        title: mode === "create" ? "Horse added" : "Horse updated",
        description: `${horse.name} has been ${mode === "create" ? "added to" : "updated in"} the fleet.`,
      });
      router.push(`/horses/${horse.id}`);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Horse Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Sovereign"
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Regimental Number */}
        <div className="space-y-2">
          <Label htmlFor="regimentalNumber">Regimental Number</Label>
          <Input
            id="regimentalNumber"
            name="regimentalNumber"
            value={formData.regimentalNumber}
            onChange={handleChange}
            placeholder="e.g. HCMR-013"
            className="font-mono"
          />
          {errors.regimentalNumber && (
            <p className="text-sm text-red-600">{errors.regimentalNumber}</p>
          )}
        </div>

        {/* Squadron Number */}
        <div className="space-y-2">
          <Label htmlFor="squadronNumber">Squadron Number</Label>
          <Input
            id="squadronNumber"
            name="squadronNumber"
            value={formData.squadronNumber}
            onChange={handleChange}
            placeholder="e.g. LG-042"
            className="font-mono"
          />
          {errors.squadronNumber && (
            <p className="text-sm text-red-600">{errors.squadronNumber}</p>
          )}
        </div>

        {/* Breed */}
        <div className="space-y-2">
          <Label htmlFor="breed">Breed</Label>
          <Input
            id="breed"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            placeholder="e.g. Irish Draught"
          />
          {errors.breed && <p className="text-sm text-red-600">{errors.breed}</p>}
        </div>

        {/* Colour */}
        <div className="space-y-2">
          <Label htmlFor="colour">Colour</Label>
          <Input
            id="colour"
            name="colour"
            value={formData.colour}
            onChange={handleChange}
            placeholder="e.g. Black"
          />
          {errors.colour && <p className="text-sm text-red-600">{errors.colour}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
          {errors.dateOfBirth && (
            <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Service Entry Date */}
        <div className="space-y-2">
          <Label htmlFor="serviceEntryDate">Service Entry Date</Label>
          <Input
            id="serviceEntryDate"
            name="serviceEntryDate"
            type="date"
            value={formData.serviceEntryDate}
            onChange={handleChange}
          />
          {errors.serviceEntryDate && (
            <p className="text-sm text-red-600">{errors.serviceEntryDate}</p>
          )}
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="heightHands">Height (hands)</Label>
          <Input
            id="heightHands"
            name="heightHands"
            type="number"
            step="0.1"
            value={formData.heightHands}
            onChange={handleChange}
          />
          {errors.heightHands && (
            <p className="text-sm text-red-600">{errors.heightHands}</p>
          )}
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            value={formData.weightKg}
            onChange={handleChange}
          />
          {errors.weightKg && (
            <p className="text-sm text-red-600">{errors.weightKg}</p>
          )}
        </div>

        {/* Max Rider Weight */}
        <div className="space-y-2">
          <Label htmlFor="maxRiderWeightKg">Max Rider Weight (kg)</Label>
          <Input
            id="maxRiderWeightKg"
            name="maxRiderWeightKg"
            type="number"
            value={formData.maxRiderWeightKg}
            onChange={handleChange}
          />
          {errors.maxRiderWeightKg && (
            <p className="text-sm text-red-600">{errors.maxRiderWeightKg}</p>
          )}
        </div>

        {/* Squadron */}
        <div className="space-y-2">
          <Label htmlFor="squadron">Squadron</Label>
          <Select
            value={formData.squadron}
            onValueChange={(v) => handleSelect("squadron", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select squadron" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="THE_LIFE_GUARDS">The Life Guards</SelectItem>
              <SelectItem value="THE_BLUES_AND_ROYALS">The Blues and Royals</SelectItem>
            </SelectContent>
          </Select>
          {errors.squadron && (
            <p className="text-sm text-red-600">{errors.squadron}</p>
          )}
        </div>

        {/* Task Readiness */}
        <div className="space-y-2">
          <Label htmlFor="taskReadiness">Task Readiness</Label>
          <Select
            value={formData.taskReadiness}
            onValueChange={(v) => handleSelect("taskReadiness", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select readiness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FULL_EXERCISE">Full Exercise</SelectItem>
              <SelectItem value="LIMITED_ROLE">Limited Role</SelectItem>
              <SelectItem value="NON_TASKWORTHY">Non-taskworthy</SelectItem>
            </SelectContent>
          </Select>
          {errors.taskReadiness && (
            <p className="text-sm text-red-600">{errors.taskReadiness}</p>
          )}
        </div>

        {/* Sex */}
        <div className="space-y-2">
          <Label htmlFor="sex">Sex</Label>
          <Select
            value={formData.sex ?? ""}
            onValueChange={(v) => handleSelect("sex", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GELDING">Gelding</SelectItem>
              <SelectItem value="MARE">Mare</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role ?? ""}
            onValueChange={(v) => handleSelect("role", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CHARGER">Charger</SelectItem>
              <SelectItem value="CAV_BLACK">Cav Black</SelectItem>
              <SelectItem value="GREY">Grey</SelectItem>
              <SelectItem value="STANDARD">Standard</SelectItem>
              <SelectItem value="COMP">Comp</SelectItem>
              <SelectItem value="RMT">RMT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Division */}
        <div className="space-y-2">
          <Label htmlFor="division">Division</Label>
          <Select
            value={formData.division?.toString() ?? ""}
            onValueChange={(v) => handleSelect("division", parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current Location */}
        {locations.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="currentLocationId">Current Location</Label>
            <Select
              value={formData.currentLocationId ?? ""}
              onValueChange={(v) => handleSelect("currentLocationId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Ancillaries */}
      <div className="space-y-2">
        <Label htmlFor="ancillaries">Ancillaries</Label>
        <p className="text-xs text-gray-500">Unique extras for this horse — shims, fluffy girths, risers, etc.</p>
        <Textarea
          id="ancillaries"
          value={ancillaries}
          onChange={(e) => setAncillaries(e.target.value)}
          placeholder="e.g. Prolite shim (thin), fluffy girth, riser nearside, fluffy reins"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading} className="bg-[#1a2744] hover:bg-[#243560]">
          {loading
            ? mode === "create"
              ? "Adding..."
              : "Saving..."
            : mode === "create"
            ? "Add Horse"
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
