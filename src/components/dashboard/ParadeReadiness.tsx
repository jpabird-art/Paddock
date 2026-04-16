"use client";

interface ParadeConfig {
  name: string;
  officers: number;
  soldiers: number;
}

const PARADES_24: ParadeConfig[] = [
  { name: "Major General's Inspection", officers: 15, soldiers: 105 },
  { name: "Queen's Birthday Parade", officers: 7, soldiers: 111 },
  { name: "Escort", officers: 9, soldiers: 112 },
];

const PARADES_16: ParadeConfig[] = [
  { name: "Major General's Inspection", officers: 15, soldiers: 73 },
  { name: "Queen's Birthday Parade", officers: 7, soldiers: 79 },
  { name: "Escort", officers: 9, soldiers: 80 },
];

interface Props {
  fitHorses: number;
  fitBySquadron: { squadron: string; count: number }[];
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const isReady = value >= max;

  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all ${
          isReady ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function ParadeReadiness({ fitHorses, fitBySquadron }: Props) {
  const lgCount = fitBySquadron.find((s) => s.squadron === "THE_LIFE_GUARDS")?.count ?? 0;
  const brCount = fitBySquadron.find((s) => s.squadron === "THE_BLUES_AND_ROYALS")?.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Squadron breakdown */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <span className="text-gray-500">Fully fit horses: </span>
          <span className="font-semibold text-gray-900">{fitHorses}</span>
        </div>
        <div className="text-gray-300">|</div>
        <div>
          <span className="text-gray-500">LG: </span>
          <span className="font-semibold">{lgCount}</span>
        </div>
        <div>
          <span className="text-gray-500">B&R: </span>
          <span className="font-semibold">{brCount}</span>
        </div>
      </div>

      {/* Parade tables */}
      {[
        { label: "24+1 Divisions", parades: PARADES_24 },
        { label: "16+1 Divisions", parades: PARADES_16 },
      ].map(({ label, parades }) => (
        <div key={label}>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {label}
          </h4>
          <div className="space-y-3">
            {parades.map((p) => {
              const required = p.officers + p.soldiers;
              const pct = Math.round((fitHorses / required) * 100);
              const isReady = fitHorses >= required;

              return (
                <div key={`${label}-${p.name}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {fitHorses} / {required}
                      </span>
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          isReady
                            ? "bg-green-100 text-green-700"
                            : pct >= 75
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={fitHorses} max={required} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
