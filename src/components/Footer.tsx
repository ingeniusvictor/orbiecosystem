import { Briefcase, Code2, Gamepad2, GraduationCap, Home, Linkedin, Moon, Newspaper, Rss, SunMedium, Youtube } from "lucide-react";

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

const ecosystemLinks = [
  { label: "Development System", icon: Code2 },
  { label: "Corporate System", icon: Briefcase },
  { label: "Academy", icon: GraduationCap },
  { label: "Instalaciones y Servicios", icon: SunMedium },
  { label: "Sleep Frequencies", icon: Moon },
  { label: "Game System", icon: Gamepad2 },
  { label: "ORBI News", icon: Newspaper }
];

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-slate-950 py-14 font-sans text-slate-400 select-none">
      <div className="absolute inset-0 grid-overlay opacity-[0.025]" aria-hidden="true" />
      <div className="absolute -bottom-32 left-1/2 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.1fr_1.1fr_0.8fr]">
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => onNavigate("hero")}
              className="flex w-fit items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              aria-label="Volver al inicio de ORBI Ecosystem"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
                <span className="font-orbitron text-lg font-black text-white">Ø</span>
              </div>
              <div className="text-left">
                <div className="font-orbitron text-sm font-black uppercase tracking-[0.22em] text-white">ORBI</div>
                <div className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300">Ecosystem</div>
              </div>
            </button>

            <p className="max-w-md text-sm leading-7 text-slate-500">
              Ecosistema tecnológico chileno que desarrolla soluciones de inteligencia artificial, software, educación, energía, automatización, bienestar, videojuegos y contenido de innovación.
            </p>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Season 1 Active
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-mono text-xs font-black uppercase tracking-[0.24em] text-white">ORBI Platform Season 1</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {ecosystemLinks.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onNavigate(label === "ORBI News" ? "roadmap" : "ecosystem-season-one")}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2 text-left text-xs font-semibold text-slate-400 transition hover:border-cyan-400/20 hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-5 font-mono text-xs font-black uppercase tracking-[0.24em] text-white">Canales</h4>
            <p className="mb-4 text-sm leading-7 text-slate-500">
              Sigue la construcción de ORBI y sus contenidos educativos, técnicos y de innovación.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500" title="YouTube">
                <Youtube className="h-4.5 w-4.5" />
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500" title="LinkedIn">
                <Linkedin className="h-4.5 w-4.5" />
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500" title="Noticias ORBI">
                <Rss className="h-4.5 w-4.5" />
              </span>
              <button
                type="button"
                onClick={() => onNavigate("hero")}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 transition hover:border-cyan-300/40 hover:text-white"
                title="Volver arriba"
              >
                <Home className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} ORBI Ecosystem SpA. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span>Rancagua · Chile</span>
            <span className="text-slate-800">//</span>
            <span>AI Native</span>
            <span className="text-slate-800">//</span>
            <span>Season 1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
