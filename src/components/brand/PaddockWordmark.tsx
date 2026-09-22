import { PaddockMark, type MarkTone } from "./PaddockMark";

interface PaddockWordmarkProps {
  tone?: MarkTone;
  /** Hide the descriptor where space is tight, such as the app sidebar. */
  showDescriptor?: boolean;
  className?: string;
}

/** The lock-up: monogram, name and the descriptor beneath it. */
export function PaddockWordmark({
  tone = "colour",
  showDescriptor = true,
  className,
}: PaddockWordmarkProps) {
  const name = tone === "inverse" ? "text-mist" : "text-forest";
  const descriptor = tone === "inverse" ? "text-sage-200" : "text-midnight-500";

  return (
    <span className={`flex items-center gap-3 ${className ?? ""}`}>
      <PaddockMark tone={tone} className="h-9 w-auto shrink-0" />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-xl font-bold tracking-tight ${name}`}>Paddock</span>
        {showDescriptor && (
          <span className={`mt-1 text-[10px] uppercase tracking-[0.18em] ${descriptor}`}>
            Equine Operations Software
          </span>
        )}
      </span>
    </span>
  );
}
