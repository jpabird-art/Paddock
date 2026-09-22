import { brandValues } from "@/components/brand/values";

/** The four commitments, shown as the brand's outlined roundels. */
export function ValuePills({ tone = "colour" }: { tone?: "colour" | "inverse" }) {
  const ring = tone === "inverse" ? "border-sage/40 text-sage-200" : "border-forest/25 text-forest";
  const label = tone === "inverse" ? "text-mist" : "text-forest";
  const detail = tone === "inverse" ? "text-sage-200" : "text-midnight-600";

  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {brandValues.map((value) => {
        const Icon = value.icon;
        return (
          <li key={value.label}>
            <div className={`flex h-14 w-14 items-center justify-center rounded-full border ${ring}`}>
              <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            </div>
            <h3
              className={`mt-4 font-display text-sm font-semibold uppercase tracking-[0.12em] ${label}`}
            >
              {value.label}
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${detail}`}>{value.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
