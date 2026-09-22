interface PaddockLogoProps {
  className?: string;
  /** Use on forest or other dark backgrounds. */
  reversed?: boolean;
  /** Hide the mark from assistive technology when adjacent text names it. */
  decorative?: boolean;
}

/**
 * Horse-and-P monogram redrawn from the approved Concept 2 reference.
 * The horse is negative space, so the mark works on any solid background.
 * Keep these paths in sync with the standalone marks in public/brand/.
 */
export function PaddockLogo({ className, reversed = false, decorative = false }: PaddockLogoProps) {
  return (
    <svg
      viewBox="0 0 200 248"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Paddock"}
      aria-hidden={decorative || undefined}
      focusable="false"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(6 7)">
        <path
          d="M0 0H110C153 0 187 34 187 76C187 119 156 152 114 152H72C65 130 65 109 80 93C85 103 96 105 107 106L128 119C131 126 138 129 143 125C151 127 158 119 157 108L135 70C132 58 126 49 119 41L127 18L109 32L114 16L94 31C54 35 20 65 0 105Z"
          fill={reversed ? "#F8F7F2" : "#0F3D2E"}
        />
        <path
          d="M0 144C0 102 34 69 81 48C50 79 44 108 54 141C67 185 37 219 0 233Z"
          fill="#7FB28A"
        />
      </g>
    </svg>
  );
}
