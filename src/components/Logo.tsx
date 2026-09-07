export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* lambda, drawn as strokes so it renders identically everywhere */}
      <path
        d="M9.5 7.5 C11.8 7.5 12.8 8.8 13.6 11 L18.8 24.5"
        stroke="var(--ink-strong)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M15.4 15.4 L11.2 24.5"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
