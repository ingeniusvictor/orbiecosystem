import { ArrowRight, Compass, MessageCircle, Play, Sparkles } from "lucide-react";
import { competitionContent } from "../content/competition";

interface FinalCTAProps {
  onNavigate: (sectionId: string) => void;
}

export default function FinalCTA({ onNavigate }: FinalCTAProps) {
  return (
    <section id="season-one-final-cta" className="relative overflow-hidden border-t border-cyan-400/10 bg-[#050816] py-24 font-sans select-none">
      <div className="absolute inset-0 grid-overlay opacity-[0.04]" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="orbitron-panel overflow-hidden p-6 md:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div className="space-y-7">
              <div className="orbitron-chip inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ORBI SEASON 1 / LAUNCH READY</span>
              </div>

              <div className="space-y-5">
                <h2 className="orbitron-title max-w-5xl">
                  ORBI no es solo una idea. Es una plataforma en movimiento.
                </h2>
                <p className="orbitron-subtitle max-w-4xl">
                  Aplicaciones, inteligencia artificial, contenido educativo, energía, automatización, videojuegos, bienestar y noticias se ordenan bajo una misma visión: construir tecnología útil, visual y accionable.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="/climate-recovery" className="orbitron-primary-action">
                  <span>{competitionContent.home.cta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <button type="button" onClick={() => onNavigate("proyectos")} className="orbitron-secondary-action">
                  <Compass className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <span>Ver soluciones</span>
                </button>

                <button type="button" onClick={() => onNavigate("foton-prime")} className="orbitron-ghost-action">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Probar Foton Prime</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.06] p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Próximo paso</p>
                <h3 className="mt-3 font-space text-2xl font-black text-white">Convertir visitas en conversación.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  La web queda preparada para mostrar productos, recibir interés y evolucionar hacia ORBI ChatBox IA sin mezclar desarrollos internos en la vitrina pública.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-space text-lg font-black text-white">Contacto y comunidad</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Season 1 prioriza claridad, confianza y demostraciones. La capa comercial puede activarse después con canales verificados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                Welcome to the ORBI Ecosystem // Portal Up // Season 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
