import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_10px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-2 max-w-3xl text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

const TONES: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
};

export function Badge({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONES | string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        TONES[tone] ?? TONES.slate
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function TrustTag({
  agency,
  sourceUrl,
  docId,
}: {
  agency: string;
  sourceUrl: string;
  docId?: number;
}) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
      title={sourceUrl}
    >
      <span aria-hidden>✅</span>
      {agency} verified{docId ? ` · #${docId}` : ""}
    </a>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof TONES | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === "emerald"
            ? "text-emerald-700"
            : tone === "rose"
              ? "text-rose-700"
              : tone === "amber"
                ? "text-amber-700"
                : "text-slate-900"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  tone = "indigo",
  suffix,
}: {
  label: string;
  value: number; // 0..1
  tone?: "indigo" | "emerald" | "amber" | "rose";
  suffix?: string;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const colors: Record<string, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums">{suffix ?? `${pct}%`}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`bar-grow h-full rounded-full ${colors[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SalaryCurve({
  points,
  height = 130,
}: {
  points: { year: number; monthlySalary: number }[];
  height?: number;
}) {
  if (points.length === 0) return null;
  const width = 320;
  const pad = 26;
  const max = Math.max(...points.map((p) => p.monthlySalary));
  const min = Math.min(...points.map((p) => p.monthlySalary));
  const span = Math.max(1, max - min);
  const coords = points.map((p, i) => {
    const x = pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
    const y = height - pad - ((p.monthlySalary - min) / span) * (height - pad * 2);
    return { x, y, ...p };
  });
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1].x},${height - pad} L${coords[0].x},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Salary growth">
      <defs>
        <linearGradient id="salaryFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#salaryFill)" />
      <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
      {coords.map((c) => (
        <g key={c.year}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="#4f46e5" />
          <text x={c.x} y={height - 8} textAnchor="middle" className="fill-slate-500" fontSize="9">
            Y{c.year}
          </text>
        </g>
      ))}
      <text x={pad} y={14} className="fill-slate-500" fontSize="9">
        ₹{min.toLocaleString("en-IN")} → ₹{max.toLocaleString("en-IN")}/month
      </text>
    </svg>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {hint ? <p className="mt-1 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function Spinner({ label = "Working…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
      {label}
    </span>
  );
}

export function money(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}
