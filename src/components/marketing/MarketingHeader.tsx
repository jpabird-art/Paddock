import Link from "next/link";
import { PaddockWordmark } from "./PaddockWordmark";

const links = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="border-b border-brand-forest/10 bg-brand-mist text-brand-midnight">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Paddock home" className="self-start rounded-sm">
          <PaddockWordmark />
        </Link>

        <nav aria-label="Primary" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-brand-forest transition-colors hover:underline underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/portal"
            className="rounded-md bg-brand-forest px-5 py-2.5 font-semibold text-brand-mist transition-colors hover:bg-brand-hover"
          >
            Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
