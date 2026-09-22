import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Paddock — equine operations software",
    template: "%s — Paddock",
  },
  description:
    "Paddock keeps health, injuries, movements, exercise, tack and inspections for every horse on one auditable record.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const config = getSiteConfig();

  // Tenant deployments are the application itself: there is no shop window.
  if (config.mode !== "marketing") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-mist">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter config={config} />
    </div>
  );
}
