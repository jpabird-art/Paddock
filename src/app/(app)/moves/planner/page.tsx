"use client";

import { useEffect, useState } from "react";
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
  unlocated: { id: string; name: string; regimentalNumber: string; squadron: string | null }[];
  summary: { total: number; moving: number };
}

export default function LocationPlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [data, setData] = useState<ProjectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const role = session?.user?.role;

  useEffect(() => {
    if (status === "authenticated" && role && !["ADMIN", "OFFICER", "VET"].includes(role)) {
      router.replace("/dashboard");
    }
  }, [status, role, router]);

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

  if (!session || !["ADMIN", "OFFICER", "VET"].includes(role ?? "")) {
    return null;
  }

  const today = new Date().toISOString().substring(0, 10);
  const isPast = date < today;

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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]/30 focus:border-[#1a2744]"
          />
        </div>
      </div>

      {/* Summary bar */}
      {data && (
        <div className="flex gap-3 flex-wrap items-center">
          <div className="bg-[#1a2744]/5 border border-[#1a2744]/10 px-4 py-2 rounded-lg">
            <span className="text-[#1a2744] font-semibold text-sm">{data.summary.total}</span>
            <span className="text-gray-600 text-sm ml-1.5">horses</span>
          </div>
          {data.summary.moving > 0 && (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
              <span className="text-amber-800 font-semibold text-sm">{data.summary.moving}</span>
              <span className="text-amber-600 text-sm ml-1.5">moving</span>
            </div>
          )}
          {data.locations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
              <span className="text-blue-800 font-semibold text-sm">{data.locations.length}</span>
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
      {!loading && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.locations.map((loc) => {
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
          {data.unlocated.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center justify-between text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    Unlocated
                  </div>
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                    {data.unlocated.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {data.unlocated.map((horse) => (
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
      {!loading && data && data.locations.length === 0 && data.unlocated.length === 0 && (
        <div className="text-center py-16 text-gray-500 text-sm">
          No active horses found.
        </div>
      )}
    </div>
  );
}
