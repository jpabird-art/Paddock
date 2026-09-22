import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { capabilities } from "@/components/marketing/capabilities";
import { PaddockLogo } from "@/components/marketing/PaddockLogo";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const outcomes = [
  {
    stat: "One record",
    body: "Health, injuries, movements, exercise, farriery, feed, tack and inspections against the same horse, rather than five spreadsheets and a whiteboard.",
  },
  {
    stat: "One deployment each",
    body: "Every customer runs an isolated instance with its own database. Nobody else's yard is in your query.",
  },
  {
    stat: "Every change logged",
    body: "Before-and-after snapshots on consequential operations, so a decision can be reconstructed months later.",
  },
];

export default function HomePage() {
  const config = getSiteConfig();

  return (
    <>
      <section className="bg-brand-forest text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-16 sm:py-24 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-sage">
              Equine operations software
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-mist sm:text-5xl">
              {config.tagline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-brand-mist/85">
              Paddock replaces the spreadsheets, paper diaries and group chats that most yards run on.
              It tracks the health, movement, work and equipment of every horse in your care, and it
              keeps a record of who changed what.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-brand-forest transition-colors hover:bg-brand-soft"
              >
                Sign in to your paddock
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/capabilities"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                See what it does
              </Link>
            </div>
          </div>
          <div className="hidden aspect-square items-center justify-center rounded-[2rem] bg-brand-mist p-12 lg:flex" aria-hidden="true">
            <PaddockLogo className="h-full w-full" decorative />
          </div>
        </div>
      </section>

      <section className="border-b border-brand-forest/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          {outcomes.map((item) => (
            <div key={item.stat}>
              <p className="text-xl font-bold text-brand-forest">{item.stat}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900">What Paddock covers</h2>
        <p className="mt-2 max-w-2xl text-gray-600">
          Twelve areas of yard management, built as one system rather than bolted together.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <div
                key={capability.title}
                className="rounded-xl border border-brand-forest/10 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft">
                  <Icon className="h-5 w-5 text-brand-forest" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{capability.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{capability.summary}</p>
              </div>
            );
          })}
        </div>

        <Link
          href="/capabilities"
          className="mt-10 inline-flex items-center gap-2 font-semibold text-brand-forest hover:underline"
        >
          Read the detail
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="bg-brand-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your own paddock</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Paddock is not a shared database with your yard partitioned off inside it. Each
              customer is given a separate deployment, with its own database, its own domain and its
              own accounts. Upgrades are applied per customer, and data leaves only when you export
              it.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {[
                "A dedicated instance at your own subdomain.",
                "Your own PostgreSQL database, backed up independently.",
                "Accounts, roles and permissions administered by your staff.",
                "Multi-factor authentication available on every account.",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8">
            <h2 className="text-lg font-semibold text-gray-900">Getting started</h2>
            <ol className="mt-4 space-y-4 text-sm text-gray-600">
              <li>
                <span className="font-semibold text-gray-900">1. Talk to us.</span> Tell us how many
                horses and staff you have and how you work today.
              </li>
              <li>
                <span className="font-semibold text-gray-900">2. We provision your instance.</span>{" "}
                A deployment and database in your name, at your subdomain, usually within a day.
              </li>
              <li>
                <span className="font-semibold text-gray-900">3. Import what you hold.</span> Bring
                existing records across rather than starting from a blank page.
              </li>
              <li>
                <span className="font-semibold text-gray-900">4. Your staff sign in.</span> Accounts
                are created by your administrator, with the role each person needs.
              </li>
            </ol>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Arrange a demonstration
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
