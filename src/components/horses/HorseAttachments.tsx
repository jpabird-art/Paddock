"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Paperclip, Download, Camera, X, Trash2 } from "lucide-react";

interface AttachmentData {
  id: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number;
  category: string;
  description: string | null;
  uploadedBy: { name: string };
  createdAt: string;
}

interface HorseAttachmentsProps {
  horseId: string;
  initialAttachments: AttachmentData[];
  canUpload: boolean;
  canDelete: boolean;
  photoUrl: string | null;
}

type AttachmentCategory =
  | "PASSPORT"
  | "INJURY_PHOTO"
  | "VET_CERTIFICATE"
  | "DOCUMENT"
  | "OTHER";

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  PASSPORT: "bg-blue-100 text-blue-800",
  INJURY_PHOTO: "bg-red-100 text-red-800",
  VET_CERTIFICATE: "bg-green-100 text-green-800",
  DOCUMENT: "bg-gray-100 text-gray-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  PASSPORT: "Passport",
  INJURY_PHOTO: "Injury Photo",
  VET_CERTIFICATE: "Vet Certificate",
  DOCUMENT: "Document",
  OTHER: "Other",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function HorseAttachments({
  horseId,
  initialAttachments,
  canUpload,
  canDelete,
  photoUrl,
}: HorseAttachmentsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] =
    useState<AttachmentData[]>(initialAttachments);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<AttachmentCategory>("DOCUMENT");
  const [description, setDescription] = useState("");

  function resetForm() {
    setSelectedFile(null);
    setCategory("DOCUMENT");
    setDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    setPhotoLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/horses/${horseId}/profile-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Upload failed", description: err.error ?? "Failed to upload profile picture.", variant: "destructive" });
        return;
      }
      toast({ title: "Profile picture updated", description: "The horse profile picture has been set." });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setPhotoLoading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handlePhotoRemove() {
    setPhotoLoading(true);
    try {
      const res = await fetch(`/api/horses/${horseId}/profile-image`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to remove profile picture.", variant: "destructive" });
        return;
      }
      toast({ title: "Profile picture removed" });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setPhotoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);
      formData.append("horseId", horseId);
      if (description.trim()) formData.append("description", description);

      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Upload failed",
          description: err.error ?? "Failed to upload file.",
          variant: "destructive",
        });
        return;
      }

      const attachment = await res.json();
      setAttachments([attachment, ...attachments]);
      resetForm();
      setOpen(false);
      toast({
        title: "File uploaded",
        description: `${attachment.fileName} has been uploaded successfully.`,
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

  async function handleDelete(attachmentId: string, fileName: string) {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setDeletingId(attachmentId);
    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Delete failed", description: err.error ?? "Failed to delete file.", variant: "destructive" });
        return;
      }
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast({ title: "File deleted", description: `${fileName} has been deleted.` });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Profile Picture Section */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Picture</h3>
        <div className="flex items-center gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Horse profile"
              className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center">
              <Camera className="h-6 w-6 text-gray-400" />
            </div>
          )}
          {canUpload && (
            <div className="flex flex-col gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={photoLoading}
                onClick={() => photoInputRef.current?.click()}
                className="text-xs"
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                {photoLoading ? "Uploading..." : photoUrl ? "Replace profile picture" : "Upload profile picture"}
              </Button>
              {photoUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={photoLoading}
                  onClick={handlePhotoRemove}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>
          )}
          {!canUpload && !photoUrl && (
            <p className="text-xs text-gray-400">No profile picture set.</p>
          )}
        </div>
      </div>

      {canUpload && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#1a2744] hover:bg-[#243560]">
                <Paperclip className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1a2744] file:text-white hover:file:bg-[#243560]"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as AttachmentCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PASSPORT">Passport</SelectItem>
                      <SelectItem value="INJURY_PHOTO">Injury Photo</SelectItem>
                      <SelectItem value="VET_CERTIFICATE">Vet Certificate</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
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
                    disabled={loading || !selectedFile}
                    className="bg-[#1a2744] hover:bg-[#243560]"
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {attachments.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">
            No attachments found.
          </p>
        ) : (
          <div className="divide-y">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {attachment.fileName}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        CATEGORY_BADGE_CLASSES[attachment.category] ??
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {CATEGORY_LABELS[attachment.category] ??
                        attachment.category}
                    </span>
                  </div>
                  {attachment.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      {attachment.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{attachment.uploadedBy.name}</span>
                    <span>
                      {format(
                        new Date(attachment.createdAt),
                        "dd MMM yyyy"
                      )}
                    </span>
                    <span>{formatFileSize(attachment.fileSizeBytes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={`/api/attachments/${attachment.id}/download`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(attachment.id, attachment.fileName)}
                      disabled={deletingId === attachment.id}
                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === attachment.id ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
