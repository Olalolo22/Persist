"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global boundary caught error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0F0E0C] text-[#F0EDE6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="font-serif text-3xl italic text-[#C4472A] mb-4 font-light">Something went wrong</h2>
        <p className="text-xs text-[#8C8578] mb-8 max-w-sm leading-relaxed">
          Persist encountered an error. This might be due to network synchronization issues.
        </p>
        <button
          onClick={() => reset()}
          className="bg-transparent text-[#B8974A] border border-[#B8974A]/40 px-6 py-2.5 rounded-md text-xs hover:bg-[#B8974A]/5 transition-colors cursor-pointer"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
