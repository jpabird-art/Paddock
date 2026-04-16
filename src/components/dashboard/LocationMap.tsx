"use client";

interface LocationData {
  id: string;
  name: string;
  code: string;
  count: number;
}

// Real lat/lng for each location
const LOCATION_GEO: Record<string, { lat: number; lng: number }> = {
  HPB: { lat: 51.502, lng: -0.163 },
  HCTW: { lat: 51.43, lng: -0.61 },
  DATR: { lat: 52.765, lng: -0.885 },
  DATR_BEC: { lat: 52.765, lng: -0.885 },
  DATR_VTS: { lat: 52.765, lng: -0.885 },
  LAKESIDE_GRASS: { lat: 51.44, lng: -0.58 },
  LAKESIDE_WORKING: { lat: 51.44, lng: -0.58 },
  LILLY_MILL: { lat: 52.6, lng: -0.8 },
  RMAS: { lat: 51.348, lng: -0.769 },
  BELL_EQUINE: { lat: 51.27, lng: 0.52 },
  WTT: { lat: 52.95, lng: 1.1 },
  GRASS: { lat: 51.44, lng: -0.58 },
  WORKING_LIVERY: { lat: 51.40, lng: -0.55 },
  OTHER: { lat: 51.5, lng: -0.4 },
};

// Projection: scale & translate real coords into SVG space
// Designed so southern England fills a readable portion of the view
const SCALE = 38;
const OX = 8; // longitude offset (shift right)
const OY = 60; // latitude offset (shift down from top)

function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  return { x: (lng + OX) * SCALE, y: (OY - lat) * SCALE };
}

function groupLocations(locations: LocationData[]) {
  const groups = new Map<string, { x: number; y: number; locations: LocationData[]; total: number }>();
  for (const loc of locations) {
    const geo = LOCATION_GEO[loc.code];
    if (!geo) continue;
    const { x, y } = geoToSvg(geo.lat, geo.lng);
    const key = `${Math.round(x)},${Math.round(y)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.locations.push(loc);
      existing.total += loc.count;
    } else {
      groups.set(key, { x, y, locations: [loc], total: loc.count });
    }
  }
  return [...groups.values()].sort((a, b) => a.y - b.y);
}

// ── Great Britain coastline ─────────────────────────────────────────
// ~100 real lat/lng waypoints traced clockwise from NW Scotland,
// projected with the same geoToSvg function.
// Scotland
const scotCoords: [number, number][] = [
  [-5.6,58.6],[-5.0,58.4],[-5.2,57.9],[-5.5,57.6],[-5.8,57.8],[-6.1,57.6],
  [-5.7,57.4],[-5.4,57.0],[-5.9,56.8],[-5.5,56.5],[-5.8,56.2],[-5.3,56.1],
  [-5.6,55.9],[-5.1,55.8],[-4.8,55.9],[-4.6,55.7],[-4.9,55.5],[-5.1,55.3],
  [-4.8,55.1],[-4.5,55.3],[-4.2,55.0],[-3.8,55.0],[-3.4,54.9],[-3.0,55.0],
  [-2.6,55.1],[-2.1,55.7],[-1.8,55.6],[-1.6,55.3],[-1.8,55.0],[-2.0,55.8],
  [-2.5,56.1],[-2.8,56.3],[-2.5,56.7],[-2.0,56.5],[-1.8,56.9],[-2.2,57.1],
  [-2.0,57.5],[-1.8,57.7],[-2.5,57.7],[-3.0,57.9],[-3.4,58.0],[-3.2,58.4],
  [-3.5,58.6],[-4.0,58.6],[-4.3,58.5],[-4.8,58.7],[-5.2,58.6],[-5.6,58.6],
];

// England & Wales (from Scottish border clockwise)
const ewCoords: [number, number][] = [
  [-3.0,55.0],[-2.6,55.1],[-2.1,55.7],[-1.8,55.6],[-1.6,55.3],[-1.8,55.0],
  [-1.6,54.6],[-1.2,54.5],[-1.0,54.3],[-1.2,53.9],[-0.8,53.7],[-0.3,53.7],
  [0.0,53.5],[0.3,53.3],[0.4,52.9],[1.0,52.9],[1.7,52.8],[1.8,52.5],
  [1.6,52.1],[1.3,51.8],[1.1,51.8],[0.9,51.5],[0.7,51.4],[1.4,51.2],
  [1.2,51.0],[0.8,51.1],[0.3,51.2],[0.1,51.0],[-0.8,50.7],[-1.2,50.8],
  [-1.6,50.7],[-2.0,50.6],[-2.5,50.6],[-3.0,50.5],[-3.4,50.4],[-3.6,50.3],
  [-4.2,50.4],[-4.5,50.5],[-5.0,50.1],[-5.7,50.1],[-5.5,50.4],[-5.0,50.5],
  [-4.8,50.8],[-4.5,50.9],[-4.2,51.2],[-3.8,51.2],[-3.4,51.2],[-3.1,51.3],
  [-3.0,51.5],[-2.9,51.6],[-3.2,51.7],[-3.6,51.6],[-4.1,51.7],[-4.3,51.6],
  [-4.7,51.7],[-5.1,51.7],[-5.3,51.9],[-5.0,52.1],[-4.6,52.1],[-4.1,52.3],
  [-4.1,52.5],[-4.3,52.7],[-4.0,52.9],[-3.8,53.0],[-3.1,53.1],[-3.0,53.3],
  [-3.1,53.4],[-3.5,53.4],[-3.8,53.3],[-4.1,53.3],[-4.4,53.2],[-4.3,53.4],
  [-3.9,53.5],[-3.4,53.7],[-3.1,53.7],[-3.0,54.0],[-3.2,54.1],[-3.4,54.3],
  [-3.3,54.5],[-3.5,54.7],[-3.2,54.8],[-3.0,55.0],
];

function coordsToPath(coords: [number, number][]): string {
  return coords
    .map(([lng, lat], i) => {
      const { x, y } = geoToSvg(lat, lng);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

export function LocationMap({ locations }: { locations: LocationData[] }) {
  const activeLocations = locations.filter((l) => l.count > 0);
  const groups = groupLocations(activeLocations);
  const totalHorses = activeLocations.reduce((sum, l) => sum + l.count, 0);

  const scotPath = coordsToPath(scotCoords);
  const ewPath = coordsToPath(ewCoords);

  // Sort groups by Y so labels stack top-to-bottom matching map position
  const sorted = [...groups].sort((a, b) => a.y - b.y);

  // Labels on the right, vertically spaced to fit the view
  const labelX = 380;
  const labelStartY = 270;
  const labelSpacing = sorted.length > 5 ? 20 : 26;

  const positioned = sorted.map((g, i) => ({
    ...g,
    labelX,
    labelY: labelStartY + i * labelSpacing,
  }));

  const lastLabelY = labelStartY + (sorted.length - 1) * labelSpacing;
  const viewHeight = Math.max(140, lastLabelY - 250 + 30);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg viewBox={`60 250 400 ${viewHeight}`} className="w-full h-auto">
        {/* Scotland — faded for context */}
        <path d={scotPath} fill="#e8ecf0" stroke="#b0bac6" strokeWidth="0.5" strokeLinejoin="round" opacity="0.5" />

        {/* England & Wales */}
        <path d={ewPath} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Pins, connectors, labels */}
        {positioned.map((g, i) => {
          const displayName =
            g.locations.length === 1
              ? g.locations[0].name
              : g.locations.map((l) => l.name).join(" / ");
          const shortName =
            displayName.length > 32
              ? g.locations[0].name + ` +${g.locations.length - 1}`
              : displayName;

          return (
            <g key={i}>
              {/* Dashed connector */}
              <line
                x1={g.x}
                y1={g.y}
                x2={g.labelX - 2}
                y2={g.labelY - 3}
                stroke="#94a3b8"
                strokeWidth="0.35"
                strokeDasharray="2,1.5"
              />
              {/* Pin dot */}
              <circle cx={g.x} cy={g.y} r="2.8" fill="#1a2744" stroke="white" strokeWidth="0.7" />
              {/* Count badge */}
              <rect x={g.x - 7} y={g.y - 11} width="14" height="8" rx="4" fill="#1a2744" />
              <text x={g.x} y={g.y - 5.2} textAnchor="middle" fontSize="5" fontWeight="bold" fill="white">
                {g.total}
              </text>
              {/* Label name */}
              <text x={g.labelX} y={g.labelY - 2} textAnchor="start" fontSize="6" fontWeight="600" fill="#1e293b">
                {shortName}
              </text>
              {/* Label detail */}
              <text x={g.labelX} y={g.labelY + 5.5} textAnchor="start" fontSize="5" fill="#64748b">
                {g.locations.length > 1
                  ? g.locations.map((l) => `${l.name}: ${l.count}`).join(" · ")
                  : `${g.total} ${g.total === 1 ? "horse" : "horses"}`}
              </text>
            </g>
          );
        })}

        {/* Total */}
        <rect x="145" y={250 + viewHeight - 18} width="70" height="12" rx="6" fill="#1a2744" />
        <text x="180" y={250 + viewHeight - 9.5} textAnchor="middle" fontSize="6" fontWeight="bold" fill="white">
          {totalHorses} horses total
        </text>
      </svg>
    </div>
  );
}
