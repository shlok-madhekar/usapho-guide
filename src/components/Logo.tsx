export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="32" height="32" rx="7" fill="var(--link)" />
      {/* lambda, drawn as strokes so it renders identically everywhere */}
      <path
        d="M10.5 8.5 C12.5 8.5 13.4 9.6 14.2 11.6 L18.9 23.5 C19.5 25 20.3 25.5 21.8 25.5"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M15.6 15.9 L11.6 25.5"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
