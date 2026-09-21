import Link from "next/link";
import { PaddockLogo } from "./PaddockLogo";

const links = [
  { href: "/capabilities", label: "Capabilities" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="bg-[#1a2744] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3 self-start">
          <PaddockLogo className="h-9 w-9 text-white" />
          <span className="text-lg font-bold tracking-wide">Paddock</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-blue-100 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/portal"
            className="rounded-md bg-white px-4 py-2 font-semibold text-[#1a2744] transition-colors hover:bg-blue-50"
          >
            Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
