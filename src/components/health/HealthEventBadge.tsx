import { cn } from "@/lib/utils";

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  OVERDUE: "bg-red-100 text-red-800 border-red-200",
  COMPLETED: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  OVERDUE: "Overdue",
  COMPLETED: "Completed",
};

interface HealthEventBadgeProps {
  status: string;
  className?: string;
}

export function HealthEventBadge({ status, className }: HealthEventBadgeProps) {
  const colour = STATUS_COLOURS[status] ?? "bg-gray-100 text-gray-800 border-gray-200";
  const label = STATUS_LABELS[status] ?? status;

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
