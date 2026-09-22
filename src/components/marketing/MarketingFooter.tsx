import Link from "next/link";
import { PaddockWordmark } from "./PaddockWordmark";
import type { SiteConfig } from "@/lib/site-config";

export function MarketingFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="mt-auto bg-brand-forest text-brand-mist/85">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <Link href="/" aria-label="Paddock home" className="inline-block rounded-sm">
            <PaddockWordmark reversed />
          </Link>
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
        <div className="mx-auto max-w-6xl px-6 py-5 text-xs text-brand-mist/80">
          &copy; {new Date().getFullYear()} Paddock. Each customer&apos;s data is held in its own
          isolated deployment.
        </div>
      </div>
    </footer>
  );
}
