"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";

interface ProjectedHorse {
  id: string;
  name: string;
  regimentalNumber: string;
  squadron: string | null;
  role: string | null;
  division: number | null;
  isMoving: boolean;
  currentLocationName: string | null;
}

interface LocationGroup {
  id: string;
  name: string;
  code: string;
  horses: ProjectedHorse[];
  total: number;
  movingIn: number;
}

interface ProjectionData {
  date: string;
  locations: LocationGroup[];
  unlocated: { id: string; name: string; regimentalNumber: string; squadron: string | null; role: string | null; division: number | null }[];
  summary: { total: number; moving: number };
}

const SQUADRON_OPTIONS = [
  { value: "ALL", label: "All Squadrons" },
  { value: "THE_LIFE_GUARDS", label: "Life Guards" },
  { value: "THE_BLUES_AND_ROYALS", label: "Blues & Royals" },
];

const DIVISION_OPTIONS = [
  { value: "ALL", label: "All Divisions" },
  { value: "1", label: "1 Div" },
  { value: "2", label: "2 Div" },
];

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "CHARGER", label: "Charger" },
  { value: "CAV_BLACK", label: "Cav Black" },
  { value: "GREY", label: "Grey" },
  { value: "STANDARD", label: "Standard" },
  { value: "COMP", label: "Comp" },
  { value: "RMT", label: "RMT" },
];

type FilterableHorse = { squadron: string | null; role: string | null; division: number | null };

function matchesFilters(horse: FilterableHorse, squadron: string, division: string, role: string): boolean {
  if (squadron !== "ALL" && horse.squadron !== squadron) return false;
  if (division !== "ALL" && horse.division !== parseInt(division)) return false;
  if (role !== "ALL" && horse.role !== role) return false;
  return true;
}

export default function LocationPlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  // Filters
  const [squadron, setSquadron] = useState("ALL");
  const [division, setDivision] = useState("ALL");
  const [role, setRole] = useState("ALL");

  const userRole = session?.user?.role;

  useEffect(() => {
    if (status === "authenticated" && userRole && !["ADMIN", "OFFICER", "VET"].includes(userRole)) {
      router.replace("/dashboard");
    }
  }, [status, userRole, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/horse-moves/projection?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, status]);

  // Apply client-side filters
  const filtered = useMemo(() => {
    if (!data) return null;
    const hasFilters = squadron !== "ALL" || division !== "ALL" || role !== "ALL";
    if (!hasFilters) return data;

    const locations = data.locations
      .map((loc) => {
        const horses = loc.horses.filter((h) => matchesFilters(h, squadron, division, role));
        return {
          ...loc,
          horses,
          total: horses.length,
          movingIn: horses.filter((h) => h.isMoving).length,
        };
      })
      .filter((loc) => loc.horses.length > 0);

    const unlocated = data.unlocated.filter((h) => matchesFilters(h, squadron, division, role));

    const totalHorses = locations.reduce((sum, l) => sum + l.total, 0) + unlocated.length;
    const totalMoving = locations.reduce((sum, l) => sum + l.movingIn, 0);

    return {
      ...data,
      locations,
      unlocated,
      summary: { total: totalHorses, moving: totalMoving },
    };
  }, [data, squadron, division, role]);

  function toggleExpand(locationId: string) {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) next.delete(locationId);
      else next.add(locationId);
      return next;
    });
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session || !["ADMIN", "OFFICER", "VET"].includes(userRole ?? "")) {
    return null;
  }

  const today = new Date().toISOString().substring(0, 10);
  const isPast = date < today;
  const selectClass = "border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Projected horse locations by date
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={squadron} onChange={(e) => setSquadron(e.target.value)} className={selectClass}>
          {SQUADRON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={division} onChange={(e) => setDivision(e.target.value)} className={selectClass}>
          {DIVISION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={selectClass}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(squadron !== "ALL" || division !== "ALL" || role !== "ALL") && (
          <button
            onClick={() => { setSquadron("ALL"); setDivision("ALL"); setRole("ALL"); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline px-1"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary bar */}
      {filtered && (
        <div className="flex gap-3 flex-wrap items-center">
          <div className="bg-[#1a2744]/5 border border-[#1a2744]/10 px-4 py-2 rounded-lg">
            <span className="text-[#1a2744] font-semibold text-sm">{filtered.summary.total}</span>
            <span className="text-gray-600 text-sm ml-1.5">horses</span>
          </div>
          {filtered.summary.moving > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
              <span className="text-amber-800 font-semibold text-sm">{filtered.summary.moving}</span>
              <span className="text-amber-600 text-sm ml-1.5">moving</span>
            </div>
          )}
          {filtered.locations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
              <span className="text-blue-800 font-semibold text-sm">{filtered.locations.length}</span>
              <span className="text-blue-600 text-sm ml-1.5">locations</span>
            </div>
          )}
          {isPast && (
            <span className="text-xs text-gray-400 italic">Past date</span>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Location cards */}
      {!loading && filtered && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.locations.map((loc) => {
            const isExpanded = expandedLocations.has(loc.id);
            const COLLAPSE_THRESHOLD = 10;
            const shouldCollapse = loc.horses.length > COLLAPSE_THRESHOLD;
            const displayHorses =
              shouldCollapse && !isExpanded
                ? loc.horses.slice(0, COLLAPSE_THRESHOLD)
                : loc.horses;

            return (
              <Card key={loc.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#1a2744]" />
                      {loc.name}
                    </div>
                    <div className="flex items-center gap-2">
                      {loc.movingIn > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-200">
                          {loc.movingIn} arriving
                        </span>
                      )}
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        {loc.total}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y">
                    {displayHorses.map((horse) => (
                      <div
                        key={horse.id}
                        className={`py-2 flex items-center justify-between gap-2 ${
                          horse.isMoving ? "border-l-2 border-l-amber-400 pl-2 -ml-2 bg-amber-50/50 rounded-r" : ""
                        }`}
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/horses/${horse.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-[#1a2744] hover:underline"
                          >
                            {horse.name}
                          </Link>
                          <span className="text-xs text-gray-400 font-mono ml-2">
                            {horse.regimentalNumber}
                          </span>
                        </div>
                        {horse.isMoving && (
                          <div className="flex items-center gap-1 text-xs text-amber-700 shrink-0">
                            <ArrowRight className="h-3 w-3" />
                            <span className="hidden sm:inline">
                              from {horse.currentLocationName ?? "Unknown"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {shouldCollapse && (
                    <button
                      onClick={() => toggleExpand(loc.id)}
                      className="text-xs text-[#1a2744] hover:underline font-medium mt-2 w-full text-center py-1"
                    >
                      {isExpanded
                        ? "Show less"
                        : `Show all ${loc.horses.length} horses`}
                    </button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Unlocated section */}
          {filtered.unlocated.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Unlocated
                  </div>
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                    {filtered.unlocated.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {filtered.unlocated.map((horse) => (
                    <div key={horse.id} className="py-2">
                      <Link
                        href={`/horses/${horse.id}`}
                        className="text-sm font-medium text-gray-600 hover:text-[#1a2744] hover:underline"
                      >
                        {horse.name}
                      </Link>
                      <span className="text-xs text-gray-400 font-mono ml-2">
                        {horse.regimentalNumber}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered && filtered.locations.length === 0 && filtered.unlocated.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">
          No horses match the selected filters.
        </div>
      )}
    </div>
  );
}
