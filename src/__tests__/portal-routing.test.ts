import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteConfig, resolveTenantUrl } from "@/lib/site-config";

afterEach(() => vi.unstubAllEnvs());

describe("portal routing", () => {
  it("uses a configured demo URL for a normalised short name", () => {
    vi.stubEnv("PADDOCK_PORTAL_DOMAIN", "paddock-ltd.com");
    vi.stubEnv("PADDOCK_TENANT_DIRECTORY", JSON.stringify([
      { slug: "cairnhead", name: "Cairnhead Racing Yard", url: "https://demo.example.test/login" },
    ]));
    const { portal } = getSiteConfig();
    expect(resolveTenantUrl("  Cairnhead  ", { portal })).toBe("https://demo.example.test/login");
    expect(resolveTenantUrl("another-yard", { portal })).toBe("https://another-yard.paddock-ltd.com/login");
    expect(resolveTenantUrl("https://other.example", { portal })).toBeNull();
  });
});
