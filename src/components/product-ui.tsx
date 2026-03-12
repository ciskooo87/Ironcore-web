import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "info";

function toneClass(tone: Tone) {
  switch (tone) {
    case "good":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "warn":
      return "border-amber-400/30 bg-amber-400/10 text-amber-100";
    case "bad":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
    case "info":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
    default:
      return "border-slate-600 bg-slate-800/40 text-slate-200";
  }
}

export function ProductHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="product-hero mb-4 rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(14,116,144,0.22),rgba(15,23,42,0.92))] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="product-eyebrow inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-cyan-200">{eyebrow}</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
        </div>
        {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
      </div>
    </section>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${toneClass(tone)}`}>{label}</span>;
}

export function MetricCard({ label, value, hint, tone = "neutral" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return (
    <div className="metric product-metric">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${tone === "good" ? "text-emerald-200" : tone === "warn" ? "text-amber-200" : tone === "bad" ? "text-rose-200" : tone === "info" ? "text-cyan-100" : "text-white"}`}>{value}</div>
      {hint ? <div className="text-xs text-cyan-300 mt-1">{hint}</div> : null}
    </div>
  );
}

export function ActionLink({ href, label, tone = "primary" }: { href: string; label: string; tone?: "primary" | "secondary" }) {
  return (
    <Link href={href} className={tone === "primary" ? "badge px-4 py-2" : "pill"}>
      {label}
    </Link>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-slate-800 bg-slate-950/20 px-4 py-5 text-sm text-slate-300">
      <div className="font-medium text-white">{title}</div>
      <div className="mt-1 text-slate-400">{description}</div>
    </div>
  );
}
