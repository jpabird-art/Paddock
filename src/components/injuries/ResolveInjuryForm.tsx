"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { CheckCircle } from "lucide-react";

const schema = z.object({
  resolutionNote: z.string().min(10, "Please provide resolution details"),
});

interface ResolveInjuryFormProps {
  injuryId: string;
  horseName: string;
  onSuccess?: () => void;
}

export function ResolveInjuryForm({
  injuryId,
  horseName,
  onSuccess,
}: ResolveInjuryFormProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parse = schema.safeParse({ resolutionNote });
    if (!parse.success) {
      setError(parse.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/injuries/${injuryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED", resolutionNote }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to resolve injury.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Injury resolved",
        description: `Injury report for ${horseName} marked as resolved.`,
      });

      setOpen(false);
      setResolutionNote("");
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
        <Button variant="outline" size="sm" className="border-green-600 text-green-700 hover:bg-green-50">
          <CheckCircle className="h-4 w-4 mr-2" />
          Resolve Injury
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Resolve Injury — {horseName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="resolutionNote">Resolution Notes</Label>
            <Textarea
              id="resolutionNote"
              value={resolutionNote}
              onChange={(e) => {
                setResolutionNote(e.target.value);
                setError("");
              }}
              placeholder="Describe treatment given, outcome, and any follow-up required..."
              rows={5}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
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
              className="bg-green-700 hover:bg-green-800 text-white"
              disabled={loading}
            >
              {loading ? "Saving..." : "Mark Resolved"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
