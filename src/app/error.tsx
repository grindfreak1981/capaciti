"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="page-title">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message || "An unexpected error occurred."}</p>
    </div>
  );
}
