import Link from "next/link";
import type { PaginationMeta } from "@/lib/pagination";

interface PaginationProps {
  meta: PaginationMeta;
  /** Base path without query string, e.g. "/horses" */
  basePath: string;
  /** Other search params to preserve (filters, search, etc.) */
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({ meta, basePath, searchParams = {} }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) clean[k] = v;
    }
    const params = new URLSearchParams(clean);
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  // Show at most 7 page buttons with ellipses
  const pages = getPageRange(meta.page, meta.totalPages);

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-t bg-gray-50" aria-label="Pagination">
      <p className="text-xs text-gray-500">
        {meta.totalItems} result{meta.totalItems !== 1 ? "s" : ""}
        {" — page "}
        {meta.page} of {meta.totalPages}
      </p>
      <div className="flex items-center gap-1">
        {meta.page > 1 && (
          <PageLink href={buildHref(meta.page - 1)} label="Previous" />
        )}
        {pages.map((p, i) =>
          p === null ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">
              ...
            </span>
          ) : (
            <PageLink
              key={p}
              href={buildHref(p)}
              label={String(p)}
              isActive={p === meta.page}
            />
          )
        )}
        {meta.page < meta.totalPages && (
          <PageLink href={buildHref(meta.page + 1)} label="Next" />
        )}
      </div>
    </nav>
  );
}

function PageLink({
  href,
  label,
  isActive = false,
}: {
  href: string;
  label: string;
  isActive?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        isActive
          ? "bg-[#1a2744] text-white"
          : "text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}

/** Returns array of page numbers with null for ellipses. Shows max 7 slots. */
function getPageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, null, total];
  }

  if (current >= total - 3) {
    return [1, null, total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, null, current - 1, current, current + 1, null, total];
}
