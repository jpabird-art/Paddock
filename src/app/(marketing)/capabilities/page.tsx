import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { capabilities } from "@/components/marketing/capabilities";

export const metadata: Metadata = {
  title: "Capabilities",
  description:
    "Horse records, health scheduling, injury reporting, movements, exercise boards, farriery, feed, medication, tack, inspections, permissions and audit.",
};

export default function CapabilitiesPage() {
  return (
    <>
      <section className="border-b border-brand-forest/10 bg-brand-soft">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl font-bold text-gray-900">Capabilities</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Everything below is in the product today. Nothing here is a roadmap item.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <article key={capability.title}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-forest/10">
                    <Icon className="h-5 w-5 text-brand-forest" aria-hidden />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{capability.title}</h2>
                </div>
                <p className="mt-3 text-gray-600">{capability.summary}</p>
                <ul className="mt-4 space-y-2 border-l-2 border-gray-200 pl-5 text-sm leading-relaxed text-gray-700">
                  {capability.detail.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-brand-forest text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">See it against your own yard</h2>
            <p className="mt-2 text-brand-mist/85">
              A demonstration runs on your working patterns, not a canned dataset.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-white px-6 py-3 font-semibold text-brand-forest transition-colors hover:bg-brand-soft"
          >
            Get in touch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
