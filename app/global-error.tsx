"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en"><body style={{ margin: 0, background: "#09090b", color: "#fff", fontFamily: "system-ui" }}>
      <main style={{ minHeight: "100dvh", display: "grid", alignContent: "center", justifyItems: "center", gap: 16, padding: 24, textAlign: "center", boxSizing: "border-box" }}>
        <h1>Couldn&apos;t load listiq</h1>
        <p>Please retry. If the problem continues, come back later.</p>
        <button onClick={reset} style={{ minHeight: 44, padding: "12px 24px", cursor: "pointer" }}>Try again</button>
        {/* A native link can recover even when the root router/layout failed. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" style={{ color: "#c4b5fd", padding: 12 }}>Go home</a>
      </main>
    </body></html>
  );
}
