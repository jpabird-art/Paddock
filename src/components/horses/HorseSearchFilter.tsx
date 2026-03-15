"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

const STATIONS = [
  { value: "ALL", label: "All Stations" },
  { value: "KINGS_LIFE_GUARD", label: "King's Life Guard" },
  { value: "TRAINING_WING", label: "Training Wing" },
  { value: "HYDE_PARK_BARRACKS", label: "Hyde Park Barracks" },
  { value: "WINTER_TRAINING", label: "Winter Training" },
];

interface HorseSearchFilterProps {
  currentQ: string;
  currentStation: string;
}

export function HorseSearchFilter({ currentQ, currentStation }: HorseSearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(currentQ);

  const navigate = useCallback(
    (newQ: string, newStation: string) => {
      const params = new URLSearchParams();
      if (newQ) params.set("q", newQ);
      if (newStation && newStation !== "ALL") params.set("station", newStation);
      const qs = params.toString();
      router.push(`${pathname}${qs ? "?" + qs : ""}`);
    },
    [router, pathname]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(q, currentStation);
  }

  function handleStation(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(q, e.target.value);
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or number..."
          className="pl-9"
        />
      </form>
      <select
        value={currentStation}
        onChange={handleStation}
        className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {STATIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
