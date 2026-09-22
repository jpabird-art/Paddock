import Link from "next/link";
import { PaddockWordmark } from "@/components/brand/PaddockWordmark";

const links = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="border-b border-mist-200 bg-mist">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="self-start" aria-label="Paddock home">
          <PaddockWordmark />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-7 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-midnight-600 transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/portal"
            className="rounded-full bg-forest px-5 py-2.5 font-semibold text-mist transition-colors hover:bg-forest-600"
          >
            Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
