import { cn } from "@/lib/utils";

const STATION_LABELS: Record<string, string> = {
  KINGS_LIFE_GUARD: "King's Life Guard",
  TRAINING_WING: "Training Wing",
  HYDE_PARK_BARRACKS: "Hyde Park Barracks",
  WINTER_TRAINING: "Winter Training",
};

const STATION_COLOURS: Record<string, string> = {
  KINGS_LIFE_GUARD: "bg-amber-100 text-amber-800 border-amber-200",
  TRAINING_WING: "bg-blue-100 text-blue-800 border-blue-200",
  HYDE_PARK_BARRACKS: "bg-green-100 text-green-800 border-green-200",
  WINTER_TRAINING: "bg-purple-100 text-purple-800 border-purple-200",
};

interface DutyBadgeProps {
  station: string;
  className?: string;
}

export function DutyBadge({ station, className }: DutyBadgeProps) {
  const label = STATION_LABELS[station] ?? station;
  const colour = STATION_COLOURS[station] ?? "bg-gray-100 text-gray-800 border-gray-200";

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
