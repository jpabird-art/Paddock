import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Paddock",
};

export default function LoginPage() {
  const { orgName, mode } = getSiteConfig();
  if (mode === "marketing") redirect("/portal");

  return <LoginForm orgName={orgName} />;
}
