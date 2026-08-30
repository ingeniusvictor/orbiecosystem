import React from "react";
import { Brain, Clapperboard, Layers3, Radar, Sparkles } from "lucide-react";

export default function AtAGlance() {
  const principles = [
    {
      title: "Una marca, múltiples soluciones",
      description: "Software, IA, educación, energía, bienestar, videojuegos y noticias bajo una identidad clara.",
      icon: <Layers3 className="h-5 w-5 text-cyan-300" />,
      tag: "ECOSYSTEM"
    },
    {
      title: "Contenido que demuestra capacidad",
      description: "Videos, fichas, noticias y demos explican lo que ORBI construye sin discursos interminables.",
      icon: <Clapperboard className="h-5 w-5 text-violet-300" />,
      tag: "VIDEO READY"
    },
    {
      title: "IA aplicada a problemas reales",
      description: "Soporte, automatización, documentación, análisis, operación y aprendizaje técnico.",
      icon: <Brain className="h-5 w-5 text-emerald-300" />,
      tag: "AI NATIVE"
    },
    {
      title: "Radar permanente de innovación",
      description: "ORBI News conecta la marca con tendencias, competencias y oportunidades de construcción rápida.",
      icon: <Radar className="h-5 w-5 text-amber-200" />,
      tag: "LIVE SIGNAL"
    }
  ];

  return (
    <section id="ecosistema-mirada" className="relative overflow-hidden border-t border-white/5 bg-[#050816] py-16 font-sans xl:py-20">
      <div className="absolute inset-0 grid-overlay opacity-[0.035]" aria-hidden="true" />
      <div className="absolute left-1/3 top-0 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute right-[-12%] bottom-[-30%] h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-[min(1680px,calc(100vw-2rem))] px-2 sm:px-4 lg:px-6 2xl:w-[min(1760px,calc(100vw-3rem))]">
        <div className="orbitron-panel p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end xl:gap-12">
            <div className="space-y-5">
              <div className="orbitron-chip inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ORBI AT A GLANCE</span>
              </div>
              <h2 className="font-space text-4xl font-black leading-[0.95] tracking-[-0.055em] text-white sm:text-5xl xl:text-6xl">
                ORBI se entiende rápido porque todo está conectado.
              </h2>
            </div>

            <div className="space-y-5 lg:pb-1">
              <p className="max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                La web no debe explicar una empresa con textos interminables. Debe mostrar una dirección clara: crear soluciones inteligentes, educar con contenido real y demostrar ejecución visible desde el primer scroll.
              </p>
              <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] px-5 py-4">
                <p className="text-sm leading-7 text-slate-300">
                  Season 1 muestra lo suficiente para generar confianza: qué somos, qué construimos, cómo se organiza el ecosistema y por qué vale la pena conversar.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-slate-950/75"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    {principle.icon}
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {principle.tag}
                  </span>
                </div>
                <h3 className="font-space text-lg font-black leading-tight text-white">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
