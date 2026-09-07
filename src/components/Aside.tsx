export default function Aside({
  label,
  warn,
  children,
}: {
  label: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`aside ${warn ? "warn" : ""}`}>
      <span className="aside-label">{label}</span>
      {children}
    </div>
  );
}
