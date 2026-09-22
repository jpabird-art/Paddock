import { PasswordForm } from "@/components/account/PasswordForm";
import { getSiteConfig } from "@/lib/site-config";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function Page() {
  const config = getSiteConfig();
  if (config.mode === "marketing") redirect("/portal");
  return <main className="min-h-screen bg-brand-mist px-4 py-16"><section className="mx-auto max-w-md rounded-xl bg-white p-8 shadow-sm">
    <p className="text-sm text-brand-forest">{config.orgName ?? "Paddock"}</p>
    <h1 className="mb-6 mt-2 text-2xl font-bold">Reset your password</h1>
    <PasswordForm mode="request" />
  </section></main>;
}
