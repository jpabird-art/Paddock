"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle } from "lucide-react";

const schema = z.object({
  severity: z.enum(["MINOR", "MODERATE", "SEVERE"]),
  description: z.string().min(10, "Please provide a detailed description"),
  bodyLocation: z.string().min(1, "Body location is required"),
});

interface InjuryReportFormProps {
  horseId: string;
  horseName: string;
  onSuccess?: () => void;
}

export function InjuryReportForm({
  horseId,
  horseName,
  onSuccess,
}: InjuryReportFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const [formData, setFormData] = useState({
    severity: "MINOR" as "MINOR" | "MODERATE" | "SEVERE",
    description: "",
    bodyLocation: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
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
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/horses/${horseId}/injuries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parse.data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to submit injury report.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Injury reported",
        description: `Injury report for ${horseName} submitted. Veterinary staff notified.`,
      });

      setOpen(false);
      setFormData({ severity: "MINOR", description: "", bodyLocation: "" });
      onSuccess?.();
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
        <Button variant="destructive" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Injury
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Injury — {horseName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  severity: v as "MINOR" | "MODERATE" | "SEVERE",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MINOR">Minor</SelectItem>
                <SelectItem value="MODERATE">Moderate</SelectItem>
                <SelectItem value="SEVERE">Severe</SelectItem>
              </SelectContent>
            </Select>
            {errors.severity && (
              <p className="text-sm text-red-600">{errors.severity}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyLocation">Body Location</Label>
            <Input
              id="bodyLocation"
              name="bodyLocation"
              value={formData.bodyLocation}
              onChange={handleChange}
              placeholder="e.g. Right Foreleg, Left Shoulder"
            />
            {errors.bodyLocation && (
              <p className="text-sm text-red-600">{errors.bodyLocation}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the injury, circumstances, and any immediate actions taken..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
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
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
