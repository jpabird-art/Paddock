import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { capabilities } from "@/components/marketing/capabilities";
import { ValuePills } from "@/components/marketing/ValuePills";
import { PaddockMark } from "@/components/brand/PaddockMark";
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
      <section className="bg-forest text-mist">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-sage">
              Equine Operations Software
            </p>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl">
              A smarter way to care for every horse.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-sage-100">
              Paddock replaces the spreadsheets, paper diaries and group chats that most yards run
              on. It tracks the health, movement, work and equipment of every horse in your care,
              and it keeps a record of who changed what.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-full bg-mist px-6 py-3 font-semibold text-forest transition-colors hover:bg-white"
              >
                Sign in to your paddock
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/capabilities"
                className="inline-flex items-center gap-2 rounded-full border border-sage/40 px-6 py-3 font-semibold text-mist transition-colors hover:bg-mist/10"
              >
                See what it does
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <PaddockMark tone="inverse" className="h-64 w-auto opacity-95" title="" />
          </div>
        </div>
      </section>

      <section className="border-b border-mist-200 bg-mist">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <ValuePills />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {outcomes.map((item) => (
            <div key={item.stat} className="border-l-2 border-sage pl-5">
              <p className="font-display text-lg font-bold text-forest">{item.stat}</p>
              <p className="mt-2 text-sm leading-relaxed text-midnight-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mist">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-midnight">
            What Paddock covers
          </h2>
          <p className="mt-3 max-w-2xl text-midnight-600">
            Twelve areas of yard management, built as one system rather than bolted together.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <div
                  key={capability.title}
                  className="rounded-xl border border-mist-200 bg-white p-6 transition-colors hover:border-sage"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100">
                    <Icon className="h-5 w-5 text-forest" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-midnight">
                    {capability.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-midnight-600">
                    {capability.summary}
                  </p>
                </div>
              );
            })}
          </div>

          <Link
            href="/capabilities"
            className="mt-10 inline-flex items-center gap-2 font-semibold text-forest hover:underline"
          >
            Read the detail
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-midnight">
              Your own paddock
            </h2>
            <p className="mt-4 leading-relaxed text-midnight-600">
              Paddock is not a shared database with your yard partitioned off inside it. Each
              customer is given a separate deployment, with its own database, its own domain and its
              own accounts. Upgrades are applied per customer, and data leaves only when you export
              it.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-midnight-600">
              {[
                "A dedicated instance at your own subdomain.",
                "Your own PostgreSQL database, backed up independently.",
                "Accounts, roles and permissions administered by your staff.",
                "Multi-factor authentication available on every account.",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-500" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-mist-200 bg-mist p-8">
            <h2 className="font-display text-lg font-bold text-midnight">Getting started</h2>
            <ol className="mt-5 space-y-4 text-sm text-midnight-600">
              <li>
                <span className="font-semibold text-midnight">1. Talk to us.</span> Tell us how many
                horses and staff you have and how you work today.
              </li>
              <li>
                <span className="font-semibold text-midnight">2. We provision your instance.</span>{" "}
                A deployment and database in your name, at your subdomain, usually within a day.
              </li>
              <li>
                <span className="font-semibold text-midnight">3. Import what you hold.</span> Bring
                existing records across rather than starting from a blank page.
              </li>
              <li>
                <span className="font-semibold text-midnight">4. Your staff sign in.</span> Accounts
                are created by your administrator, with the role each person needs.
              </li>
            </ol>
            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-mist transition-colors hover:bg-forest-600"
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
