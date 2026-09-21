import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { getSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in — Paddock",
};

export default function LoginPage() {
  const { orgName } = getSiteConfig();

  return <LoginForm orgName={orgName} />;
}
