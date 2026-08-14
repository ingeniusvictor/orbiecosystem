import type { ReactNode } from "react";
import { Beaker, CheckCircle2, FlaskConical, Rocket, type LucideIcon } from "lucide-react";
import type { CapabilityGroup } from "./ClimateRecoveryData";

type CapabilityState = CapabilityGroup["label"];

const stateStyles: Record<CapabilityState, { icon: LucideIcon; tone: string; label: string }> = {
  "Existing Foundation": {
    icon: CheckCircle2,
    tone: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    label: "Existing Foundation",
  },
  "Competition Edition": {
    icon: Rocket,
    tone: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
    label: "Competition Edition",
  },
  Planned: {
    icon: Beaker,
    tone: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    label: "Planned",
  },
  Prototype: {
    icon: FlaskConical,
    tone: "border-purple-400/30 bg-purple-400/10 text-purple-300",
    label: "Prototype",
  },
};

export function SectionShell({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-slate-900 bg-[#050816] py-16 sm:py-20 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 max-w-3xl space-y-3 sm:mb-11">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-energy-cyan sm:tracking-[0.22em]">{eyebrow}</p>
          <h2 className="font-space text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "amber" | "green" | "purple" }) {
  const tones = {
    cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    purple: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  };

  return (
    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function CapabilityStatusBadge({ state, statusPrefix = "Status" }: { state: CapabilityState; statusPrefix?: string }) {
  const style = stateStyles[state];
  const Icon = style.icon;

  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-widest ${style.tone}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>
        {statusPrefix}: {style.label}
      </span>
    </span>
  );
}

export function ClimateButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const styles =
    variant === "primary"
      ? "border-cyan-400/30 bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/15 hover:from-blue-500 hover:to-cyan-400 focus:ring-cyan-300"
      : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-purple-400/60 hover:text-white focus:ring-purple-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-5 py-3 text-center text-xs font-extrabold uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto sm:px-6 ${styles}`}
    >
      {children}
    </button>
  );
}
