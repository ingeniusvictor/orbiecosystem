import { ArrowRight, Briefcase, Code2, Gamepad2, GraduationCap, Moon, Newspaper, Play, Sparkles, Zap } from "lucide-react";
import { orbiSeasonOneMetrics, orbiSeasonOnePortals, type OrbiSeasonOnePortal } from "../content/orbiSeasonOne";

interface SeasonOneEcosystemProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

const accentStyles: Record<OrbiSeasonOnePortal["accent"], string> = {
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 shadow-cyan-500/10",
  violet: "border-violet-400/25 bg-violet-400/10 text-violet-200 shadow-violet-500/10",
  emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200 shadow-emerald-500/10",
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-100 shadow-amber-500/10",
  rose: "border-rose-400/25 bg-rose-400/10 text-rose-200 shadow-rose-500/10",
  blue: "border-blue-400/25 bg-blue-400/10 text-blue-200 shadow-blue-500/10",
  slate: "border-slate-400/25 bg-slate-400/10 text-slate-200 shadow-slate-500/10"
};

function PortalIcon({ icon }: { icon: OrbiSeasonOnePortal["icon"] }) {
  const className = "h-5 w-5";

  switch (icon) {
    case "code":
      return <Code2 className={className} />;
    case "briefcase":
      return <Briefcase className={className} />;
    case "graduation":
      return <GraduationCap className={className} />;
    case "zap":
      return <Zap className={className} />;
    case "moon":
      return <Moon className={className} />;
    case "gamepad":
      return <Gamepad2 className={className} />;
    case "newspaper":
      return <Newspaper className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function videoComponentId(portalId: string) {
  switch (portalId) {
    case "development":
      return "orbi-development";
    case "corporate":
      return "orbi-corp";
    case "games":
      return "orbi-games";
    default:
      return "eco-general";
  }
}

export default function SeasonOneEcosystem({ onNavigate, onPlayVideo }: SeasonOneEcosystemProps) {
  const newsPortal = orbiSeasonOnePortals.find((portal) => portal.id === "news");
  const corePortals = orbiSeasonOnePortals.filter((portal) => portal.id !== "news");

  return (
    <section id="ecosystem-season-one" className="relative overflow-hidden border-y border-white/5 bg-[#030712] py-20 sm:py-24">
      <div className="absolute inset-0 grid-overlay opacity-[0.05]" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="space-y-6">
            <div className="orbitron-chip inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ORBI PLATFORM / SEASON 1</span>
            </div>
            <div className="space-y-5">
              <h2 className="orbitron-title max-w-3xl">
                La sede digital de todo el universo ORBI.
              </h2>
              <p className="orbitron-subtitle max-w-2xl">
                Seis divisiones principales y una capa transversal de noticias. La web deja de ser una vitrina simple y pasa a funcionar como mapa de productos, contenido, servicios, innovación y confianza.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {orbiSeasonOneMetrics.map((metric) => (
              <div key={metric.label} className="orbitron-metric-card">
                <div className="font-orbitron text-2xl font-black text-white">{metric.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {newsPortal && (
          <article className="orbitron-panel mt-12 overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="relative border-b border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-950 to-violet-500/10 p-6 lg:border-b-0 lg:border-r lg:p-8">
                <div className="absolute inset-0 grid-overlay opacity-[0.08]" aria-hidden="true" />
                <div className="relative space-y-5">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg ${accentStyles[newsPortal.accent]}`}>
                    <PortalIcon icon={newsPortal.icon} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Módulo transversal</div>
                    <h3 className="mt-2 font-space text-3xl font-black tracking-tight text-white">ORBI News</h3>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-cyan-100/90">{newsPortal.headline}</p>
                    <p className="max-w-2xl text-sm leading-7 text-slate-400">{newsPortal.description}</p>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">News Engine</span>
                      <span className="rounded-full border border-cyan-400/25 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">Visible</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate("roadmap")}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      Ver radar de innovación
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        )}

        <div className="mt-7 flex items-center justify-between gap-4 border-y border-white/10 py-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
          <span>Divisiones principales</span>
          <span className="text-cyan-200">Video-ready / Producto-ready / Servicio-ready</span>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {corePortals.map((portal) => {
            const accentClass = accentStyles[portal.accent];

            return (
              <article
                key={portal.id}
                className="orbitron-panel group flex min-h-[330px] flex-col justify-between overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-2xl hover:shadow-cyan-950/30"
              >
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg ${accentClass}`}>
                      <PortalIcon icon={portal.icon} />
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">{portal.label}</div>
                      <div className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-300">
                        {portal.status}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-space text-2xl font-black tracking-tight text-white">{portal.name}</h3>
                    <p className="text-sm font-bold text-cyan-100/90">{portal.headline}</p>
                    <p className="text-sm leading-7 text-slate-400">{portal.description}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Video Slot</span>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${portal.videoStatus === "ready" ? "border-cyan-400/25 text-cyan-200" : "border-amber-300/25 text-amber-100"}`}>
                        {portal.videoStatus === "ready" ? "Ready" : "Pending"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onPlayVideo?.(videoComponentId(portal.id))}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Ver presentación
                    </button>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() => onNavigate(portal.id === "academy" ? "ecosistema-mirada" : "proyectos")}
                    className="text-[10px] font-black uppercase tracking-[0.22em] text-white transition hover:text-cyan-200"
                  >
                    {portal.primaryCta}
                  </button>
                  <ArrowRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-1" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
