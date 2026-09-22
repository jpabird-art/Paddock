/**
 * Runtime site configuration.
 *
 * One codebase serves two deployment roles on Railway:
 *
 *   PADDOCK_SITE_MODE=marketing  — the public product site (paddock.app)
 *   PADDOCK_SITE_MODE=tenant     — a single customer's own paddock (default)
 *
 * Everything here is read at request time rather than build time, so the same
 * image can be deployed for a new tenant by setting environment variables only.
 */

export type SiteMode = "marketing" | "tenant";

export interface TenantEntry {
  /** URL-safe identifier, e.g. "greenacre". */
  slug: string;
  /** Display name shown in the portal, e.g. "Greenacre Stud". */
  name: string;
  /** Full sign-in URL for that tenant's deployment. */
  url: string;
}

export interface ContactDetails {
  email: string;
  phone: string;
  address: string;
  responseTime: string;
}

export interface SiteConfig {
  mode: SiteMode;
  productName: string;
  tagline: string;
  /** Organisation this deployment belongs to. Tenant mode only. */
  orgName: string | null;
  contact: ContactDetails;
  portal: {
    /** Domain tenant deployments sit under, e.g. "paddock.app". */
    baseDomain: string;
    /** Optional published directory of tenants. */
    tenants: TenantEntry[];
  };
}

/** Slugs are lowercase, 2–32 chars, no leading or trailing hyphen. */
export const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])$/;

function trimmed(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

/**
 * Parse PADDOCK_TENANT_DIRECTORY. Accepts either JSON
 * ([{ "slug": "greenacre", "name": "Greenacre Stud", "url": "https://..." }])
 * or a compact "slug:Name" comma-separated list, where the URL is derived
 * from the base domain.
 */
function parseTenantDirectory(raw: string | null, baseDomain: string): TenantEntry[] {
  if (!raw) return [];

  if (raw.trimStart().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((entry) => {
        if (typeof entry !== "object" || entry === null) return [];
        const { slug, name, url } = entry as Record<string, unknown>;
        if (typeof slug !== "string" || !TENANT_SLUG_PATTERN.test(slug)) return [];
        return [
          {
            slug,
            name: typeof name === "string" && name ? name : slug,
            url: typeof url === "string" && url ? url : tenantUrlFor(slug, baseDomain),
          },
        ];
      });
    } catch {
      console.error("[site-config] PADDOCK_TENANT_DIRECTORY is not valid JSON — ignoring.");
      return [];
    }
  }

  return raw.split(",").flatMap((pair) => {
    const [slug, ...rest] = pair.split(":");
    const cleanSlug = slug?.trim().toLowerCase() ?? "";
    if (!TENANT_SLUG_PATTERN.test(cleanSlug)) return [];
    const name = rest.join(":").trim();
    return [{ slug: cleanSlug, name: name || cleanSlug, url: tenantUrlFor(cleanSlug, baseDomain) }];
  });
}

function tenantUrlFor(slug: string, baseDomain: string): string {
  return `https://${slug}.${baseDomain}/login`;
}

export function getSiteConfig(): SiteConfig {
  const baseDomain = trimmed("PADDOCK_PORTAL_DOMAIN") ?? "paddock.app";

  return {
    mode: process.env.PADDOCK_SITE_MODE === "marketing" ? "marketing" : "tenant",
    productName: "Paddock",
    tagline: "One record for every horse in your care.",
    orgName: trimmed("PADDOCK_ORG_NAME"),
    contact: {
      email: trimmed("PADDOCK_CONTACT_EMAIL") ?? "hello@paddock.app",
      phone: trimmed("PADDOCK_CONTACT_PHONE") ?? "",
      address: trimmed("PADDOCK_CONTACT_ADDRESS") ?? "United Kingdom",
      responseTime: trimmed("PADDOCK_CONTACT_RESPONSE_TIME") ?? "within two working days",
    },
    portal: {
      baseDomain,
      tenants: parseTenantDirectory(trimmed("PADDOCK_TENANT_DIRECTORY"), baseDomain),
    },
  };
}

/** Sign-in URL for a tenant slug, preferring a directory entry when one exists. */
export function resolveTenantUrl(slug: string, config: Pick<SiteConfig, "portal">): string | null {
  const cleanSlug = slug.trim().toLowerCase();
  if (!TENANT_SLUG_PATTERN.test(cleanSlug)) return null;

  const known = config.portal.tenants.find((t) => t.slug === cleanSlug);
  if (known) return known.url;

  // An unlisted slug still resolves — tenants are not obliged to be published.
  return tenantUrlFor(cleanSlug, config.portal.baseDomain);
}

/** Label for the signed-in application: the customer's name, or the product name. */
export function brandLabel(config: SiteConfig): string {
  return config.orgName ?? config.productName;
}
