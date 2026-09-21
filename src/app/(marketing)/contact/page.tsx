import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/marketing/ContactForm";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Arrange a demonstration of Paddock or ask about provisioning an instance.",
};

export default function ContactPage() {
  const { contact } = getSiteConfig();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        For a demonstration, a quotation, or to have an instance provisioned for your organisation.
        Existing customers should contact their own administrator first for account and password
        matters.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
        <ContactForm fallbackEmail={contact.email} />

        <aside className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Direct
            </h2>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#1a2744]" aria-hidden />
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </li>
              {contact.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#1a2744]" aria-hidden />
                  <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </li>
              )}
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1a2744]" aria-hidden />
                <span>{contact.address}</span>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#1a2744]" aria-hidden />
                <span>We reply {contact.responseTime}.</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Already a customer?
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              Sign in at your own subdomain through the{" "}
              <a href="/portal" className="font-semibold text-[#1a2744] hover:underline">
                portal
              </a>
              . Support requests for a live instance should come from your administrator so we can
              confirm the account.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
