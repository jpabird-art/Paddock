"use client";

import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  IN_TRANSIT: "In Transit",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_COLOURS: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700 border-blue-200",
  IN_TRANSIT: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-gray-100 text-gray-600 border-gray-200",
};

interface MoveStatusBadgeProps {
  status: string;
  className?: string;
}

export function MoveStatusBadge({ status, className }: MoveStatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status.replace(/_/g, " ");
  const colour = STATUS_COLOURS[status] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colour,
        className
      )}
    >
      {label}
    </span>
  );
}
