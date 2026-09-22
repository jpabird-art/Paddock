import Link from "next/link";
import { PaddockWordmark } from "@/components/brand/PaddockWordmark";
import type { SiteConfig } from "@/lib/site-config";

export function MarketingFooter({ config }: { config: SiteConfig }) {
  return (
    <footer className="mt-auto bg-forest text-sage-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <PaddockWordmark tone="inverse" />
          <p className="mt-4 max-w-xs text-sm text-sage-200">{config.tagline}</p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-mist">
            Product
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/capabilities" className="text-sage-200 hover:text-mist">
                Capabilities
              </Link>
            </li>
            <li>
              <Link href="/portal" className="text-sage-200 hover:text-mist">
                Sign in to your paddock
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-sage-200 hover:text-mist">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-mist">
            Get in touch
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-sage-200">
            <li>
              <a href={`mailto:${config.contact.email}`} className="hover:text-mist">
                {config.contact.email}
              </a>
            </li>
            {config.contact.phone && <li>{config.contact.phone}</li>}
            <li>{config.contact.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-mist/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-[11px] uppercase tracking-[0.16em] text-sage-300 sm:flex-row sm:items-center sm:justify-between">
          <span>Paddock — Equine Operations Software</span>
          <span>Horses. People. Progress. Together.</span>
        </div>
      </div>
    </footer>
  );
}
