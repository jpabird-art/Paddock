interface PaddockLogoProps {
  className?: string;
}

/**
 * Paddock mark: a fenced enclosure. Inline SVG so it inherits colour and
 * needs no image request.
 */
export function PaddockLogo({ className }: PaddockLogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Paddock"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1.5" y="1.5" width="37" height="37" rx="9" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M11 10v20M20 10v20M29 10v20M7 17h26M7 24h26"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
