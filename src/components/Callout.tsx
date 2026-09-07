export default function Callout({
  label,
  warn,
  children,
}: {
  label: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`callout ${warn ? "warn" : ""}`}>
      <div className="callout-label">{label}</div>
      {children}
    </div>
  );
}
