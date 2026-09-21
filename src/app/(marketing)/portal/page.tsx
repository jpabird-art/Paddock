import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { PortalLauncher } from "@/components/marketing/PortalLauncher";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal",
  description: "Sign in to your organisation's Paddock instance.",
};

export default function PortalPage() {
  const config = getSiteConfig();
  const { tenants, baseDomain } = config.portal;

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1a2744]/10">
          <LockKeyhole className="h-5 w-5 text-[#1a2744]" aria-hidden />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Portal</h1>
      </div>

      <p className="mt-4 text-gray-600">
        Each organisation runs its own Paddock instance on its own subdomain. Enter your short name
        and you will be taken to your sign-in page.
      </p>

      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <PortalLauncher baseDomain={baseDomain} />
      </div>

      {tenants.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Listed instances
          </h2>
          <ul className="mt-3 divide-y divide-gray-200 rounded-lg border border-gray-200">
            {tenants.map((tenant) => (
              <li key={tenant.slug}>
                <a
                  href={tenant.url}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <span>
                    <span className="block font-semibold text-gray-900">{tenant.name}</span>
                    <span className="block font-mono text-xs text-gray-500">
                      {tenant.slug}.{baseDomain}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 border-t border-gray-200 pt-8 text-sm text-gray-600">
        <h2 className="font-semibold text-gray-900">Trouble signing in?</h2>
        <ul className="mt-3 space-y-2">
          <li>
            Forgotten your short name or password: ask your own administrator, who can reset both.
          </li>
          <li>
            Locked out of multi-factor authentication: use a backup code, or ask an administrator to
            reset the second factor on your account.
          </li>
          <li>
            No instance yet:{" "}
            <Link href="/contact" className="font-semibold text-[#1a2744] hover:underline">
              contact us
            </Link>{" "}
            and we will provision one.
          </li>
        </ul>
      </div>
    </section>
  );
}
