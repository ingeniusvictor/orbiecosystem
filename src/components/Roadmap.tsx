import { ROADMAP } from "../data";
import { ArrowRight, CheckCircle2, Clock, Play, Rocket, Sparkles } from "lucide-react";

export default function Roadmap() {
  const getStatusBadge = (status: "completo" | "actual" | "siguiente" | "futuro") => {
    switch (status) {
      case "completo":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completo</span>
          </span>
        );
      case "actual":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">
            <Clock className="h-3.5 w-3.5" />
            <span>Fase actual</span>
          </span>
        );
      case "siguiente":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-violet-300">
            <Play className="h-3.5 w-3.5" />
            <span>Siguiente</span>
          </span>
        );
      case "futuro":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-slate-400">
            <span>Planificado</span>
          </span>
        );
    }
  };

  const getAccent = (status: "completo" | "actual" | "siguiente" | "futuro") => {
    switch (status) {
      case "completo":
        return "from-emerald-400/60 via-emerald-300/20 to-transparent border-emerald-300/20";
      case "actual":
        return "from-cyan-400/70 via-cyan-300/20 to-transparent border-cyan-300/25";
      case "siguiente":
        return "from-violet-400/70 via-violet-300/20 to-transparent border-violet-300/25";
      case "futuro":
        return "from-slate-500/35 via-slate-400/10 to-transparent border-slate-700/60";
    }
  };

  return (
    <section id="roadmap" className="relative overflow-hidden border-t border-white/5 bg-[#050816] py-24 font-sans">
      <div className="absolute inset-0 grid-overlay opacity-[0.04]" aria-hidden="true" />
      <div className="absolute left-0 top-10 h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="space-y-5">
            <div className="orbitron-chip inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ORBI ROADMAP / SEASON 1</span>
            </div>
            <div className="space-y-4">
              <h2 className="orbitron-title max-w-4xl">Construcción rápida, evolución visible.</h2>
              <p className="orbitron-subtitle max-w-3xl">
                La hoja de ruta ordena el crecimiento de ORBI sin prometer todo de una vez: primero una web fuerte, luego productos más claros, automatización, contenido y capas inteligentes conectadas.
              </p>
            </div>
          </div>

          <div className="orbitron-panel p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                <Rocket className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Launch discipline</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Season 1 prioriza mostrar ejecución real: una vitrina clara, productos comprensibles, videos disponibles y una narrativa lista para crecer por iteraciones.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {ROADMAP.map((item, index) => (
            <article
              key={`${item.phase}-${item.title}`}
              className={`orbitron-panel group flex min-h-[310px] flex-col justify-between border p-6 transition duration-300 hover:-translate-y-1 ${getAccent(item.status)}`}
            >
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{item.phase}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.subtitle}</p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <div>
                  <h3 className="font-space text-2xl font-black leading-tight text-white group-hover:text-cyan-100">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                <span>Bloque {String(index + 1).padStart(2, "0")}</span>
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
