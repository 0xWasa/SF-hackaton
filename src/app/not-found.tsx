import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <span className="text-8xl block mb-6">🦞</span>
        <h1 className="text-4xl font-bold mb-3">404</h1>
        <p className="text-lg text-muted mb-2">This page got liquidated.</p>
        <p className="text-sm text-muted/50 mb-8">
          Even AI can&apos;t find it. The lobster looked everywhere.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg text-sm font-semibold transition-colors inline-block"
        >
          Back to the Sandbox
        </Link>
      </div>
    </div>
  );
}
