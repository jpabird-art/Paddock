import { cn } from "@/lib/utils";
import { PaddockLogo } from "./PaddockLogo";

interface PaddockWordmarkProps {
  className?: string;
  reversed?: boolean;
  tagline?: boolean;
}

/** Live text stays crisp, accessible and responsive alongside the vector mark. */
export function PaddockWordmark({
  className,
  reversed = false,
  tagline = true,
}: PaddockWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <PaddockLogo className="h-12 w-10 shrink-0" reversed={reversed} decorative />
      <span className="flex min-w-0 flex-col">
        <span className={cn("text-[1.75rem] font-bold leading-none tracking-[-0.045em]", reversed ? "text-brand-mist" : "text-brand-midnight")}>
          Paddock
        </span>
        {tagline && (
          <span className={cn("mt-1.5 text-xs leading-snug tracking-wide", reversed ? "text-brand-sage" : "text-gray-600")}>
            Equine Operations Software
          </span>
        )}
      </span>
    </span>
  );
}
