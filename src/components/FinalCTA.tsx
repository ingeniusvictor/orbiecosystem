import { ArrowRight, Compass, Mail, MessageCircle, Play, Sparkles } from "lucide-react";
import { competitionContent } from "../content/competition";

interface FinalCTAProps {
  onNavigate: (sectionId: string) => void;
}

const contactSubject = encodeURIComponent("Contacto ORBI Ecosystem");
const contactBody = encodeURIComponent(
  "Hola ORBI Ecosystem, quiero conversar sobre una solución, proyecto o colaboración."
);

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
                <span>ORBI SEASON 1 / CONVERSATION READY</span>
              </div>

              <div className="space-y-5">
                <h2 className="orbitron-title max-w-5xl">
                  ¿Tienes una idea, un negocio o un proceso que podría mejorar con tecnología?
                </h2>
                <p className="orbitron-subtitle max-w-4xl">
                  ORBI existe para transformar ideas en sistemas: desde una automatización simple hasta una solución con IA, una experiencia educativa, una herramienta energética o una plataforma digital completa.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={`mailto:ing.vmlp.chile@gmail.com?subject=${contactSubject}&body=${contactBody}`}
                  className="orbitron-primary-action"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Contactar a ORBI</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>

                <button type="button" onClick={() => onNavigate("proyectos")} className="orbitron-secondary-action">
                  <Compass className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <span>Ver soluciones</span>
                </button>

                <button type="button" onClick={() => onNavigate("foton-prime")} className="orbitron-ghost-action">
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Explorar Foton Prime</span>
                </button>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-400">
                También puedes explorar nuestra línea Climate Recovery: <a href="/climate-recovery" className="font-semibold text-cyan-200 underline-offset-4 hover:underline">{competitionContent.home.cta}</a>.
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.06] p-5">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Cómo podemos ayudarte</p>
                <h3 className="mt-3 font-space text-2xl font-black text-white">Ideas → prototipos → soluciones.</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Automatización de procesos, documentación inteligente, contenido educativo, soluciones solares, domótica, asistentes IA, landing pages, herramientas internas y vitrinas digitales.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-space text-lg font-black text-white">Primer paso simple</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Cuéntanos qué quieres mejorar, automatizar, enseñar o construir. ORBI puede ayudarte a ordenar la idea y convertirla en un primer plan ejecutable.
                    </p>
                  </div>
                </div>
              </div>

              <div className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                Welcome to the ORBI Ecosystem // Build With Purpose // Season 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
