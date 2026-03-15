"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle } from "lucide-react";

interface HealthCompleteButtonProps {
  eventId: string;
  performedBy: string;
}

export function HealthCompleteButton({
  eventId,
  performedBy,
}: HealthCompleteButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/health-events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          performedBy,
        }),
      });

      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to mark event as complete.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Event completed",
        description: "Health event marked as complete. Next event scheduled.",
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

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleComplete}
      disabled={loading}
      className="text-green-700 border-green-600 hover:bg-green-50"
    >
      <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
      {loading ? "..." : "Complete"}
    </Button>
  );
}
