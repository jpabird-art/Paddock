"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { TENANT_SLUG_PATTERN } from "@/lib/site-config";

interface PortalLauncherProps {
  baseDomain: string;
}

export function PortalLauncher({ baseDomain }: PortalLauncherProps) {
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();

    if (!TENANT_SLUG_PATTERN.test(clean)) {
      setError(
        "Use the short name given to you: lowercase letters, numbers and hyphens, at least two characters."
      );
      return;
    }

    setError("");
    window.location.href = `https://${clean}.${baseDomain}/login`;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label htmlFor="slug" className="block text-sm font-semibold text-gray-700">
        Your paddock&apos;s short name
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-forest">
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="your-yard"
            autoComplete="organization"
            aria-describedby={error ? "slug-error" : "slug-hint"}
            className="w-full bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
          />
          <span className="whitespace-nowrap px-3 text-sm text-gray-400">.{baseDomain}</span>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-600"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {error ? (
        <p id="slug-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : (
        <p id="slug-hint" className="mt-2 text-sm text-midnight-500">
          Your administrator was given this when your instance was provisioned.
        </p>
      )}
    </form>
  );
}
