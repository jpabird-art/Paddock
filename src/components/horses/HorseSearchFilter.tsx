"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";

const SQUADRONS = [
  { value: "ALL", label: "All Squadrons" },
  { value: "THE_LIFE_GUARDS", label: "The Life Guards" },
  { value: "THE_BLUES_AND_ROYALS", label: "The Blues and Royals" },
];

const READINESS = [
  { value: "ALL", label: "All Readiness" },
  { value: "FULL_EXERCISE", label: "Full Exercise" },
  { value: "LIMITED_ROLE", label: "Limited Role" },
  { value: "NON_TASKWORTHY", label: "Non-taskworthy" },
];

interface HorseSearchFilterProps {
  currentQ: string;
  currentSquadron: string;
  currentReadiness: string;
  currentLocation?: string;
  locations?: { value: string; label: string }[];
}

export function HorseSearchFilter({
  currentQ,
  currentSquadron,
  currentReadiness,
  currentLocation = "ALL",
  locations = [],
}: HorseSearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(currentQ);

  const navigate = useCallback(
    (newQ: string, newSquadron: string, newReadiness: string, newLocation: string) => {
      const params = new URLSearchParams();
      if (newQ) params.set("q", newQ);
      if (newSquadron && newSquadron !== "ALL") params.set("squadron", newSquadron);
      if (newReadiness && newReadiness !== "ALL") params.set("readiness", newReadiness);
      if (newLocation && newLocation !== "ALL") params.set("location", newLocation);
      const qs = params.toString();
      router.push(`${pathname}${qs ? "?" + qs : ""}`);
    },
    [router, pathname]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(q, currentSquadron, currentReadiness, currentLocation);
  }

  function handleSquadron(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(q, e.target.value, currentReadiness, currentLocation);
  }

  function handleReadiness(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(q, currentSquadron, e.target.value, currentLocation);
  }

  function handleLocation(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(q, currentSquadron, currentReadiness, e.target.value);
  }

  const selectClass = "border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

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
      <select value={currentSquadron} onChange={handleSquadron} className={selectClass}>
        {SQUADRONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {locations.length > 0 && (
        <select value={currentLocation} onChange={handleLocation} className={selectClass}>
          <option value="ALL">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.value} value={loc.value}>{loc.label}</option>
          ))}
        </select>
      )}
      <select value={currentReadiness} onChange={handleReadiness} className={selectClass}>
        {READINESS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
}
