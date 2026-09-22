"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordForm({ mode }: { mode: "request" | "redeem" }) {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    setToken(value);
    if (value) window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    if (mode === "redeem" && form.get("password") !== form.get("confirm")) { setMessage("Passwords do not match."); return; }
    setBusy(true);
    try {
      const res = await fetch(mode === "request" ? "/api/account/forgot-password" : "/api/account/password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "request" ? { email: form.get("email") } : { token, password: form.get("password") }),
      });
      const data = await res.json(); setMessage(data.message ?? data.error); setDone(res.ok);
    } catch { setMessage("Unable to connect. Please try again."); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <p className="text-sm text-gray-600">{mode === "request" ? "Enter the email address associated with your account in this Paddock." : "Choose a password of at least 12 characters. If you use an authenticator, you will still need it when signing in."}</p>
    {!done && (mode === "request" ? <label className="block text-sm">Email<Input name="email" type="email" autoComplete="email" required /></label> : <>
      {!token && <p role="alert" className="text-sm">Open the complete link in your invitation or password-reset email.</p>}
      <label className="block text-sm">New password<Input name="password" type="password" minLength={12} autoComplete="new-password" required /></label>
      <label className="block text-sm">Confirm password<Input name="confirm" type="password" minLength={12} autoComplete="new-password" required /></label>
    </>)}
    {message && <p role="status" className="text-sm">{message}</p>}
    {!done && <Button type="submit" disabled={busy || (mode === "redeem" && !token)}>{busy ? "Please wait…" : mode === "request" ? "Send password link" : "Save password"}</Button>}
    <Link href="/login" className="block text-sm text-brand-forest underline">Back to sign in</Link>
    {mode === "redeem" && <Link href="/account/forgot-password" className="block text-sm text-brand-forest underline">Request a new link</Link>}
  </form>;
}
