const READINESS_CONFIG: Record<string, { label: string; className: string }> = {
  FULL_EXERCISE: {
    label: "Full Exercise",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  LIMITED_ROLE: {
    label: "Limited Role",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  NON_TASKWORTHY: {
    label: "Non-taskworthy",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function TaskReadinessBadge({ readiness }: { readiness: string }) {
  const config = READINESS_CONFIG[readiness] ?? {
    label: readiness,
    className: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  );
}
