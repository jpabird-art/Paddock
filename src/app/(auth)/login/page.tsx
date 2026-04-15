"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [serviceNumber, setServiceNumber] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        serviceNumber: serviceNumber.toUpperCase(),
        password,
        totpCode: mfaStep ? totpCode : "",
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("MFA_REQUIRED")) {
          setMfaStep(true);
          setError("");
        } else if (result.error.includes("MFA_INVALID")) {
          setError("Invalid MFA code. Try again.");
        } else {
          setError("Invalid service number or password.");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    setMfaStep(false);
    setTotpCode("");
    setError("");
  }

  return (
    <div className="min-h-screen bg-[#1a2744] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-[#1a2744] px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/hcmr-logo.webp" alt="HCMR" width={64} height={80} className="h-20 w-auto" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-wide">Paddock</h1>
            <p className="text-blue-200 text-sm mt-1 tracking-wider">
              HCMR&apos;S PADDOCK
            </p>
            <p className="text-blue-300 text-xs mt-1">Horse Management System</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!mfaStep ? (
                <>
                  <div>
                    <label
                      htmlFor="serviceNumber"
                      className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide uppercase"
                    >
                      Service Number
                    </label>
                    <input
                      id="serviceNumber"
                      type="text"
                      value={serviceNumber}
                      onChange={(e) => setServiceNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ADMIN001"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent font-mono tracking-wider"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide uppercase"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-3 py-2.5 rounded-md mb-4">
                    Multi-factor authentication is required. Enter the 6-digit code from your authenticator app, or a backup code.
                  </div>
                  <label
                    htmlFor="totpCode"
                    className="block text-sm font-semibold text-gray-700 mb-1.5 tracking-wide uppercase"
                  >
                    MFA Code
                  </label>
                  <input
                    id="totpCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    required
                    maxLength={8}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent font-mono tracking-widest text-center text-lg"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a2744] text-white py-2.5 rounded-md text-sm font-semibold tracking-wide hover:bg-[#243560] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating..." : mfaStep ? "Verify" : "Sign In"}
              </button>

              {mfaStep && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Back to login
                </button>
              )}
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              OFFICIAL — SENSITIVE INFORMATION SYSTEM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
