"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function SecurityPage() {
  const { data: session } = useSession();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [setupData, setSetupData] = useState<{
    qrCode: string;
    secret: string;
    backupCodes: string[];
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    if (session?.user) {
      // Check MFA status via a lightweight fetch
      fetch("/api/auth/mfa/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceNumber: session.user.serviceNumber }),
      })
        .then((r) => r.json())
        .then((d) => setMfaEnabled(d.mfaRequired))
        .catch(() => setMfaEnabled(false));
    }
  }, [session]);

  async function handleSetup() {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start MFA setup");
        return;
      }
      setSetupData(data);
    } catch {
      setError("Failed to start MFA setup");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        return;
      }
      setMfaEnabled(true);
      setSetupData(null);
      setVerifyCode("");
      setShowBackupCodes(false);
      setSuccess("MFA has been enabled successfully.");
    } catch {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to disable MFA");
        return;
      }
      setMfaEnabled(false);
      setDisablePassword("");
      setSuccess("MFA has been disabled.");
    } catch {
      setError("Failed to disable MFA");
    } finally {
      setLoading(false);
    }
  }

  if (mfaEnabled === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage multi-factor authentication for your account
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Multi-Factor Authentication (MFA)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Add an extra layer of security using a TOTP authenticator app (e.g. Google Authenticator, Authy).
            </p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              mfaEnabled
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-amber-100 text-amber-700 border-amber-200"
            }`}
          >
            {mfaEnabled ? "Enabled" : "Not enabled"}
          </span>
        </div>

        {/* Setup flow */}
        {!mfaEnabled && !setupData && (
          <button
            onClick={handleSetup}
            disabled={loading}
            className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#243560] transition-colors disabled:opacity-60"
          >
            {loading ? "Setting up..." : "Set up MFA"}
          </button>
        )}

        {setupData && (
          <div className="space-y-5 pt-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                1. Scan this QR code with your authenticator app:
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setupData.qrCode}
                  alt="MFA QR Code"
                  className="w-48 h-48 border rounded-lg"
                />
              </div>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">
                  Can&apos;t scan? Enter this key manually
                </summary>
                <code className="block mt-1 bg-gray-100 px-2 py-1 rounded font-mono break-all">
                  {setupData.secret}
                </code>
              </details>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                2. Save your backup codes (one-time use if you lose your device):
              </p>
              <button
                type="button"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showBackupCodes ? "Hide backup codes" : "Show backup codes"}
              </button>
              {showBackupCodes && (
                <div className="bg-gray-50 border rounded-md p-3 grid grid-cols-2 gap-1">
                  {setupData.backupCodes.map((code) => (
                    <code key={code} className="text-sm font-mono text-gray-700">
                      {code}
                    </code>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                3. Enter the 6-digit code from your app to confirm:
              </p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                className="w-40 border border-gray-300 rounded-md px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent"
              />
              <div>
                <button
                  type="submit"
                  disabled={loading || verifyCode.length !== 6}
                  className="bg-[#1a2744] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#243560] transition-colors disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Enable MFA"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disable flow */}
        {mfaEnabled && (
          <form onSubmit={handleDisable} className="space-y-3 pt-2 border-t">
            <p className="text-sm text-gray-600">
              To disable MFA, confirm your password:
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter password"
                required
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744] focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading || !disablePassword}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {loading ? "Disabling..." : "Disable MFA"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
