"use client";

const EXERCISE_COLOURS: Record<string, string> = {
  "ridden exercise": "bg-green-100 text-green-700 border-green-200",
  "long reins": "bg-blue-100 text-blue-700 border-blue-200",
  "lunge": "bg-purple-100 text-purple-700 border-purple-200",
  "sword drill": "bg-amber-100 text-amber-700 border-amber-200",
  "musical ride": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "watering order": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "hacking": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "jumping": "bg-orange-100 text-orange-700 border-orange-200",
  "rest day": "bg-gray-100 text-gray-500 border-gray-200",
};

export function ExerciseTypeBadge({ name }: { name: string }) {
  const colourClass =
    EXERCISE_COLOURS[name.toLowerCase()] ??
    "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap ${colourClass}`}
    >
      {name}
    </span>
  );
}
