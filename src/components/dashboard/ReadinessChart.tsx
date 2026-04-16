"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ReadinessData {
  name: string;
  value: number;
  color: string;
}

const READINESS_CONFIG: Record<string, { label: string; color: string }> = {
  FULL_EXERCISE: { label: "Full Exercise", color: "#22c55e" },
  LIMITED_ROLE: { label: "Limited Role", color: "#f59e0b" },
  NON_TASKWORTHY: { label: "Non-taskworthy", color: "#ef4444" },
};

export function ReadinessChart({
  counts,
}: {
  counts: { taskReadiness: string; _count: number }[];
}) {
  const ORDER = ["FULL_EXERCISE", "LIMITED_ROLE", "NON_TASKWORTHY"];
  const data: ReadinessData[] = [...counts]
    .sort((a, b) => ORDER.indexOf(a.taskReadiness) - ORDER.indexOf(b.taskReadiness))
    .map((c) => ({
      name: READINESS_CONFIG[c.taskReadiness]?.label ?? c.taskReadiness,
      value: c._count,
      color: READINESS_CONFIG[c.taskReadiness]?.color ?? "#9ca3af",
    }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-6">
      <div className="w-36 h-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} horses`, name]}
              contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-sm text-gray-700">{d.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{d.value}</span>
              <span className="text-xs text-gray-400">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
