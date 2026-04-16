"use client";

interface LocationData {
  id: string;
  name: string;
  code: string;
  count: number;
}

// Approximate UK map coordinates (SVG viewBox 0 0 400 600)
// Mapped from real lat/lng to SVG x,y positions on a simplified UK outline
const LOCATION_COORDS: Record<string, { x: number; y: number }> = {
  HPB: { x: 235, y: 420 },           // Hyde Park Barracks, London
  HCTW: { x: 215, y: 405 },          // Combermere Barracks, Windsor
  DATR: { x: 210, y: 330 },          // Melton Mowbray
  DATR_BEC: { x: 210, y: 330 },      // Melton Mowbray
  DATR_VTS: { x: 210, y: 330 },      // Melton Mowbray
  LAKESIDE_GRASS: { x: 205, y: 410 },// Near Windsor
  LAKESIDE_WORKING: { x: 205, y: 410 },
  LILLY_MILL: { x: 220, y: 340 },    // Leicestershire area
  RMAS: { x: 220, y: 415 },          // Sandhurst
  BELL_EQUINE: { x: 255, y: 425 },   // Maidstone, Kent
  WTT: { x: 265, y: 360 },           // Norfolk area
  GRASS: { x: 205, y: 410 },
  WORKING_LIVERY: { x: 210, y: 400 },
  OTHER: { x: 195, y: 385 },
};

// Group locations that share coordinates
function groupLocations(locations: LocationData[]) {
  const groups = new Map<string, { x: number; y: number; locations: LocationData[]; total: number }>();

  for (const loc of locations) {
    const coords = LOCATION_COORDS[loc.code];
    if (!coords) continue;
    const key = `${coords.x},${coords.y}`;
    const existing = groups.get(key);
    if (existing) {
      existing.locations.push(loc);
      existing.total += loc.count;
    } else {
      groups.set(key, { ...coords, locations: [loc], total: loc.count });
    }
  }

  return [...groups.values()];
}

// Simplified UK outline as SVG path
const UK_PATH = `
M 180 100 L 195 95 L 210 100 L 215 110 L 225 105 L 235 115
L 230 130 L 240 140 L 235 155 L 220 160 L 215 150 L 200 155
L 190 150 L 185 140 L 175 135 L 180 120 L 175 110 Z

M 155 170 L 165 160 L 180 165 L 195 160 L 210 165 L 220 170
L 230 165 L 240 175 L 250 170 L 260 180 L 265 195 L 275 200
L 280 215 L 270 230 L 275 245 L 285 255 L 280 270 L 270 275
L 265 285 L 275 295 L 280 310 L 275 325 L 265 330 L 270 345
L 280 355 L 275 365 L 265 370 L 270 385 L 260 395 L 265 410
L 255 420 L 260 435 L 250 445 L 240 440 L 230 445 L 220 440
L 210 445 L 200 435 L 195 420 L 185 415 L 180 400 L 170 395
L 165 380 L 155 370 L 150 355 L 145 340 L 140 325 L 135 310
L 130 295 L 135 280 L 130 265 L 140 250 L 135 235 L 145 220
L 140 205 L 150 190 L 145 175 Z

M 100 280 L 110 270 L 120 275 L 130 270 L 125 285 L 130 300
L 120 310 L 110 305 L 100 310 L 95 300 L 100 290 Z
`;

export function LocationMap({ locations }: { locations: LocationData[] }) {
  const activeLocations = locations.filter((l) => l.count > 0);
  const groups = groupLocations(activeLocations);
  const totalHorses = activeLocations.reduce((sum, l) => sum + l.count, 0);

  // Label positioning: alternate sides to avoid overlap
  const labelPositions = groups.map((g, i) => {
    const isRight = g.x > 220;
    const labelX = isRight ? 320 : 60;
    const labelY = 80 + i * 48;
    return { ...g, labelX, labelY, isRight };
  });

  return (
    <div className="w-full">
      <svg viewBox="30 60 360 420" className="w-full h-auto max-h-[500px]">
        {/* UK outline */}
        <path
          d={UK_PATH}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Connection lines and labels */}
        {labelPositions.map((g, i) => {
          const labelNames = g.locations.length === 1
            ? g.locations[0].name
            : g.locations.map((l) => l.name).join(", ");

          return (
            <g key={i}>
              {/* Connector line */}
              <line
                x1={g.x}
                y1={g.y}
                x2={g.labelX + (g.isRight ? -5 : 5)}
                y2={g.labelY}
                stroke="#94a3b8"
                strokeWidth="0.75"
                strokeDasharray="3,2"
              />

              {/* Map pin dot */}
              <circle
                cx={g.x}
                cy={g.y}
                r="4"
                fill="#1a2744"
                stroke="white"
                strokeWidth="1.5"
              />

              {/* Count bubble at pin */}
              <circle
                cx={g.x}
                cy={g.y - 10}
                r="8"
                fill="#1a2744"
              />
              <text
                x={g.x}
                y={g.y - 7}
                textAnchor="middle"
                fontSize="8"
                fontWeight="bold"
                fill="white"
              >
                {g.total}
              </text>

              {/* Label */}
              <text
                x={g.labelX}
                y={g.labelY - 4}
                textAnchor={g.isRight ? "start" : "end"}
                fontSize="9"
                fontWeight="600"
                fill="#1e293b"
              >
                {g.locations.length === 1 ? g.locations[0].name : `${g.locations[0].name} area`}
              </text>
              {g.locations.length > 1 ? (
                <>
                  <text
                    x={g.labelX}
                    y={g.labelY + 8}
                    textAnchor={g.isRight ? "start" : "end"}
                    fontSize="7.5"
                    fill="#64748b"
                  >
                    {g.locations.map((l) => `${l.name}: ${l.count}`).join(" · ")}
                  </text>
                </>
              ) : (
                <text
                  x={g.labelX}
                  y={g.labelY + 8}
                  textAnchor={g.isRight ? "start" : "end"}
                  fontSize="7.5"
                  fill="#64748b"
                >
                  {g.total} {g.total === 1 ? "horse" : "horses"}
                </text>
              )}
            </g>
          );
        })}

        {/* Total badge */}
        <rect x="145" y="465" width="110" height="24" rx="12" fill="#1a2744" />
        <text x="200" y="481" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">
          {totalHorses} horses total
        </text>
      </svg>
    </div>
  );
}
