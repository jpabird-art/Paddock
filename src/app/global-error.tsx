"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4 p-8">
        <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
        <p className="text-sm text-gray-500 text-center max-w-md">
          A critical error occurred. Please refresh the page.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1a2744] text-white rounded-md text-sm hover:bg-[#243560]"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
