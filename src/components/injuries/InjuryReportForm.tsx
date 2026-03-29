"use client";

import { useState, useRef } from "react";
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
import { AlertTriangle, Camera, X } from "lucide-react";

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
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (photos.length + imageFiles.length > 5) {
      toast({
        title: "Too many photos",
        description: "Maximum 5 photos per injury report.",
        variant: "destructive",
      });
      return;
    }

    setPhotos((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setFormData({ severity: "MINOR", description: "", bodyLocation: "" });
    setPhotos([]);
    setPreviews([]);
    setErrors({});
  }

  async function uploadPhotos(injuryReportId: string) {
    const results = [];
    for (const photo of photos) {
      const fd = new FormData();
      fd.append("file", photo);
      fd.append("category", "INJURY_PHOTO");
      fd.append("description", `Injury photo — ${formData.bodyLocation}`);
      fd.append("horseId", horseId);
      fd.append("injuryReportId", injuryReportId);

      const res = await fetch("/api/attachments", { method: "POST", body: fd });
      if (res.ok) {
        results.push(await res.json());
      }
    }
    return results;
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

      const injury = await res.json();

      // Upload photos linked to both the injury and the horse
      if (photos.length > 0) {
        await uploadPhotos(injury.id);
      }

      const photoText = photos.length > 0
        ? ` ${photos.length} photo${photos.length > 1 ? "s" : ""} attached.`
        : "";

      toast({
        title: "Injury reported",
        description: `Injury report for ${horseName} submitted. Veterinary staff notified.${photoText}`,
      });

      setOpen(false);
      resetForm();
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
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Injury
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos</Label>
            <p className="text-xs text-gray-500">
              Attach up to 5 photos of the injury. These will also appear in the horse&apos;s Documents tab.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={photos.length >= 5}
            >
              <Camera className="h-4 w-4 mr-2" />
              {photos.length === 0 ? "Add Photos" : `Add More (${photos.length}/5)`}
            </Button>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={src}
                      alt={`Injury photo ${i + 1}`}
                      className="w-full h-24 object-cover rounded-md border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
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
              {loading ? (photos.length > 0 ? "Uploading..." : "Submitting...") : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
