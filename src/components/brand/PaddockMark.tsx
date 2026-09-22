export type MarkTone = "colour" | "inverse";

interface PaddockMarkProps {
  className?: string;
  /** "inverse" swaps the P and the horse for use on forest or midnight grounds. */
  tone?: MarkTone;
  title?: string;
}

/**
 * The Paddock monogram: the letter P whose counter holds a horse's profile,
 * with the mane flowing into the descender.
 */
export function PaddockMark({ className, tone = "colour", title = "Paddock" }: PaddockMarkProps) {
  const letter = tone === "inverse" ? "#F8F7F2" : "#0F3D2E";
  const horse = tone === "inverse" ? "#0F3D2E" : "#F8F7F2";

  return (
    <svg
      viewBox="0 0 100 128"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* mane, flowing from the crest into the descender */}
      <path
        d="M36 37 C24 43 8 50 3 59 C-1 83 2 107 10 124 C11.5 127 14 128 16 128 C17 103 24 68 36 37 Z"
        fill="#7FB28A"
      />
      {/* the letter */}
      <path d="M4 2 H53 C76 2 94 17 94 38 C94 59 76 74 53 74 H4 Z" fill={letter} />
      {/* the horse */}
      <path
        d="M42 24 L45 7 L51 21 L56 8 L61 24
           C68 31 73.5 42 76 53
           C77 58.5 75 62.5 70 63
           C65 63.5 59.5 60 55.5 56.5
           C52 53.5 48.5 53 46 55.5
           C41 60 36 72 33 88
           C30.5 102 29 114 28.5 128
           L8 128
           C9 104 19 66 32 42
           C36 35 40 29 42 24 Z"
        fill={horse}
      />
    </svg>
  );
}
