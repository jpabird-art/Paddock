"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { MapPin } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface LocationFormProps {
  mode: "create" | "edit";
  location?: { id: string; name: string; code: string; address?: string | null; notes?: string | null };
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function LocationForm({ mode, location, onSuccess, trigger }: LocationFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [formData, setFormData] = useState<FormData>({
    name: location?.name ?? "",
    code: location?.code ?? "",
    address: location?.address ?? "",
    notes: location?.notes ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const parse = schema.safeParse(formData);
    if (!parse.success) {
      const fieldErrors: typeof errors = {};
      parse.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as keyof FormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/locations" : `/api/locations/${location?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parse.data,
          address: parse.data.address || null,
          notes: parse.data.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to save location.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: mode === "create" ? "Location created" : "Location updated",
        description: `${parse.data.name} has been ${mode === "create" ? "added" : "updated"}.`,
      });
      setOpen(false);
      onSuccess();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-[#1a2744] hover:bg-[#243560]">
            <MapPin className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Location" : "Edit Location"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Hyde Park Barracks"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. HPB"
              className="font-mono uppercase"
            />
            <p className="text-xs text-gray-500">Auto-uppercased, spaces replaced with underscores</p>
            {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={formData.address ?? ""}
              onChange={handleChange}
              placeholder="e.g. Knightsbridge, London SW1X 7JA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows={3}
            />
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
              {loading ? "Saving..." : mode === "create" ? "Create Location" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
