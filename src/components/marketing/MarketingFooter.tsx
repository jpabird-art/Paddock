import Link from "next/link";
import { PaddockLogo } from "./PaddockLogo";
import type { SiteConfig } from "@/lib/site-config";

export function MarketingFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="mt-auto bg-[#1a2744] text-blue-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3 text-white">
            <PaddockLogo className="h-8 w-8" />
            <span className="font-bold tracking-wide">Paddock</span>
          </div>
          <p className="mt-3 max-w-xs text-sm">{config.tagline}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Product</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/capabilities" className="hover:text-white">
                Capabilities
              </Link>
            </li>
            <li>
              <Link href="/portal" className="hover:text-white">
                Sign in to your paddock
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href={`mailto:${config.contact.email}`} className="hover:text-white">
                {config.contact.email}
              </a>
            </li>
            {config.contact.phone && <li>{config.contact.phone}</li>}
            <li>{config.contact.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-blue-200">
          &copy; {new Date().getFullYear()} Paddock. Each customer&apos;s data is held in its own
          isolated deployment.
        </div>
      </div>
    </footer>
  );
}
