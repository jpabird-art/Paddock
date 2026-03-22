"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface GroupStatusUpdateProps {
  groupId: string;
  currentStatus: string;
  horseCount: number;
}

export function GroupStatusUpdate({ groupId, currentStatus, horseCount }: GroupStatusUpdateProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (status === currentStatus) return;
    if (!confirm(`Update all ${horseCount} horses in this group to "${status.replace(/_/g, " ").toLowerCase()}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/horse-moves/group/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.error ?? "Failed to update group.", variant: "destructive" });
        return;
      }

      toast({
        title: "Group updated",
        description: `All ${horseCount} moves updated to ${status.replace(/_/g, " ").toLowerCase()}.`,
      });
      router.refresh();
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Update all in group:</span>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PLANNED">Planned</SelectItem>
          <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={loading || status === currentStatus}
        onClick={handleUpdate}
        className="bg-[#1a2744] hover:bg-[#243560]"
      >
        {loading ? "Updating..." : "Apply to All"}
      </Button>
    </div>
  );
}
