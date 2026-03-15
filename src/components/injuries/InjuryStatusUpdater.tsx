"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface InjuryStatusUpdaterProps {
  injuryId: string;
  currentStatus: string;
}

export function InjuryStatusUpdater({
  injuryId,
  currentStatus,
}: InjuryStatusUpdaterProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (currentStatus === "OPEN") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const res = await fetch(`/api/injuries/${injuryId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "UNDER_REVIEW" }),
          });
          setLoading(false);
          if (res.ok) {
            toast({ title: "Status updated", description: "Injury marked as Under Review." });
            router.refresh();
          }
        }}
      >
        {loading ? "..." : "Mark Under Review"}
      </Button>
    );
  }

  return null;
}
