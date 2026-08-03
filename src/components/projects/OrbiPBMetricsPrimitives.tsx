import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock3, FlaskConical, Rocket, type LucideIcon } from "lucide-react";
import type { ProductState } from "./OrbiPBMetricsData";

const stateMap: Record<ProductState, { icon: LucideIcon; label: string; className: string }> = {
  complete: {
    icon: CheckCircle2,
    label: "complete",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
  "in progress": {
    icon: Clock3,
    label: "in progress",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  planned: {
    icon: Rocket,
    label: "planned",
    className: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  },
  "requires validation": {
    icon: AlertCircle,
    label: "requires validation",
    className: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  },
  "pending baseline confirmation": {
    icon: AlertCircle,
    label: "pending baseline confirmation",
    className: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  },
  "competition edition": {
    icon: Rocket,
    label: "competition edition",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  prototype: {
    icon: FlaskConical,
    label: "prototype",
    className: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  },
};

export function ProductSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-slate-900 bg-[#050816] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-3xl space-y-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-energy-cyan sm:tracking-[0.22em]">{eyebrow}</p>
          <h2 className="font-space text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export function ProductCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function ProductStateBadge({ state }: { state: ProductState }) {
  const style = stateMap[state];
  const Icon = style.icon;

  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest ${style.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Status: {style.label}</span>
    </span>
  );
}

export function ProductBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
      {children}
    </span>
  );
}

export function ProductLinkButton({
  children,
  href,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "border-cyan-400/30 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/15 hover:from-blue-500 hover:to-cyan-400 focus:ring-cyan-300"
      : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-purple-400/60 hover:text-white focus:ring-purple-300";

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-center text-xs font-extrabold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto sm:px-6 ${styles}`}
    >
      {children}
    </a>
  );
}
