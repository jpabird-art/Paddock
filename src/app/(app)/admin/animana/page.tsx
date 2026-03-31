"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertTriangle, Loader2 } from "lucide-react";

interface PreviewItem {
  date: string;
  type: string;
  summary: string;
  model: string;
}

interface ParseResult {
  horse: { id: string; name: string; regimentalNumber: string };
  parsed: {
    horseName: string | null;
    regimentalNumber: string | null;
    breed: string | null;
    vetName: string | null;
    entryCount: number;
  };
  preview: PreviewItem[];
}

interface ImportResult {
  horse: { id: string; name: string; regimentalNumber: string };
  imported: { healthNotes: number; healthEvents: number; medications: number };
}

export default function AnimanaImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userRole = session?.user?.role;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!session || !["ADMIN", "VET"].includes(userRole ?? "")) {
    router.replace("/dashboard");
    return null;
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    setError(null);
    setParseResult(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/animana/consult", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse PDF");
        return;
      }
      setParseResult(data);
    } catch {
      setError("Failed to upload file");
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/animana/consult?confirm=1", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        return;
      }
      setImportResult(data);
      setParseResult(null);
    } catch {
      setError("Import failed");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setFile(null);
    setParseResult(null);
    setImportResult(null);
    setError(null);
  }

  const MODEL_COLOURS: Record<string, string> = {
    "HealthNote + HealthEvent": "bg-blue-100 text-blue-700",
    HealthNote: "bg-blue-100 text-blue-700",
    HealthEvent: "bg-green-100 text-green-700",
    MedicationRecord: "bg-purple-100 text-purple-700",
    skip: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-[#1a2744] hover:underline">
          Administration
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Animana Import</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Animana Import</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload vet consult or patient history PDFs exported from Animana
        </p>
      </div>

      {/* Upload card */}
      {!importResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4 text-[#1a2744]" />
              Upload PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  file ? "border-[#1a2744]/30 bg-[#1a2744]/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {file ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-[#1a2744] mx-auto" />
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={reset}
                      className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer space-y-2 block">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Drop an Animana PDF here or <span className="text-[#1a2744] underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Supports: Patient Information, Vet Consult exports
                    </p>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setFile(f);
                      }}
                    />
                  </label>
                )}
              </div>

              {file && !parseResult && (
                <Button
                  onClick={handleParse}
                  disabled={parsing}
                  className="bg-[#1a2744] hover:bg-[#243560]"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Parsing…
                    </>
                  ) : (
                    "Parse PDF"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Import Error</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {parseResult && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#1a2744]" />
                Parsed — {parseResult.preview.length} records found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Horse match */}
                <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="text-sm">
                    <span className="text-green-800 font-medium">Matched horse: </span>
                    <Link
                      href={`/horses/${parseResult.horse.id}`}
                      className="text-green-700 hover:underline font-medium"
                    >
                      {parseResult.horse.name}
                    </Link>
                    <span className="text-green-600 ml-2 font-mono text-xs">
                      {parseResult.horse.regimentalNumber}
                    </span>
                  </div>
                </div>

                {/* Vet info */}
                {parseResult.parsed.vetName && (
                  <p className="text-sm text-gray-600">
                    Vet: <span className="font-medium">{parseResult.parsed.vetName}</span>
                  </p>
                )}

                {/* Records table */}
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Date</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Type</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Summary</th>
                        <th className="text-left px-3 py-2 font-semibold text-gray-600">Creates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parseResult.preview.map((item, i) => (
                        <tr key={i} className={item.model === "skip" ? "opacity-50" : ""}>
                          <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-3 py-2 text-gray-700 text-xs font-medium whitespace-nowrap">
                            {item.type}
                          </td>
                          <td className="px-3 py-2 text-gray-600 text-xs max-w-xs truncate">
                            {item.summary}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                MODEL_COLOURS[item.model] ?? "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {item.model}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={importing}
              className="bg-[#1a2744] hover:bg-[#243560]"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing…
                </>
              ) : (
                `Import ${parseResult.preview.filter((p) => p.model !== "skip").length} Records`
              )}
            </Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* Import result */}
      {importResult && (
        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-full p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Import Complete</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Records imported for{" "}
                    <Link
                      href={`/horses/${importResult.horse.id}`}
                      className="text-[#1a2744] hover:underline font-medium"
                    >
                      {importResult.horse.name}
                    </Link>
                  </p>
                </div>
                <div className="flex gap-4">
                  {importResult.imported.healthNotes > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.imported.healthNotes}
                      </div>
                      <div className="text-xs text-gray-500">Health Notes</div>
                    </div>
                  )}
                  {importResult.imported.healthEvents > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.imported.healthEvents}
                      </div>
                      <div className="text-xs text-gray-500">Health Events</div>
                    </div>
                  )}
                  {importResult.imported.medications > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {importResult.imported.medications}
                      </div>
                      <div className="text-xs text-gray-500">Medications</div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <Link
                    href={`/horses/${importResult.horse.id}`}
                    className="text-sm text-[#1a2744] hover:underline font-medium"
                  >
                    View Horse Profile →
                  </Link>
                  <button
                    onClick={reset}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Import Another
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
