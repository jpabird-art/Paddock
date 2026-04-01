"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface HealthNote {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; role: string };
}

interface HorseHealthNotesProps {
  horseId: string;
  initialNotes: HealthNote[];
  canAdd: boolean;
  canDelete: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  VET: "Veterinary",
  OFFICER: "Officer",
  TROOPER: "Trooper",
};

export function HorseHealthNotes({
  horseId,
  initialNotes,
  canAdd,
  canDelete,
}: HorseHealthNotesProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [notes, setNotes] = useState<HealthNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/horses/${horseId}/health-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({
          title: "Error",
          description: err.error ?? "Failed to add note.",
          variant: "destructive",
        });
        return;
      }

      const note = await res.json();
      setNotes([note, ...notes]);
      setContent("");
      toast({ title: "Note added", description: "Health note saved successfully." });
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

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this health note? This cannot be undone.")) return;
    setDeleting(noteId);
    try {
      const res = await fetch(`/api/horses/${horseId}/health-notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: "Error", description: "Failed to delete note.", variant: "destructive" });
        return;
      }
      setNotes(notes.filter((n) => n.id !== noteId));
      toast({ title: "Deleted", description: "Health note removed." });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="bg-white rounded-lg border shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Health Note</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record health observations, treatment administered, or veterinary findings..."
              rows={4}
            />
            <Button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-[#1a2744] hover:bg-[#243560]"
              size="sm"
            >
              {loading ? "Saving..." : "Add Note"}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 p-6 text-center">No health notes recorded.</p>
        ) : (
          <div className="divide-y">
            {notes.map((note) => (
              <div key={note.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {note.author.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {ROLE_LABELS[note.author.role] ?? note.author.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {format(new Date(note.createdAt), "dd MMM yyyy HH:mm")}
                    </span>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deleting === note.id}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
