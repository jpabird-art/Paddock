"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface UserToggleActiveProps {
  userId: string;
  isActive: boolean;
  userName: string;
}

export function UserToggleActive({ userId, isActive, userName }: UserToggleActiveProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) {
        toast({
          title: "Error",
          description: "Failed to update user status.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: isActive ? "User deactivated" : "User activated",
        description: `${userName} has been ${isActive ? "deactivated" : "activated"}.`,
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
      disabled={loading}
      onClick={handleToggle}
      className={
        isActive
          ? "text-red-600 border-red-300 hover:bg-red-50 text-xs"
          : "text-green-700 border-green-300 hover:bg-green-50 text-xs"
      }
    >
      {loading ? "..." : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
