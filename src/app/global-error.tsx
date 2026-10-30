"use client";

/**
 * Last resort: an error in the root layout itself, where the normal error
 * boundary and the site chrome are not available. It must render its own
 * <html> and <body>, so the styling here is inline rather than from the app.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          maxWidth: "40rem",
          margin: "4rem auto",
          padding: "0 1.5rem",
          color: "#1b1b1b",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
          The USAPhO Guide hit an error
        </h1>
        <p style={{ color: "#545454", lineHeight: 1.5 }}>
          Something broke while loading the site. Reload the page, or try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1rem",
            border: "1px solid #c9c9c6",
            background: "#fff",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
