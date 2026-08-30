import React, { useState } from "react";
import { ArrowRight, Bot, Compass, MessageCircle, Play, Sparkles, X } from "lucide-react";

interface FotonCompanionProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

export default function FotonCompanion({ onNavigate, onPlayVideo }: FotonCompanionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) {
    return null;
  }

  const goToFoton = () => {
    setIsMinimized(true);
    onNavigate("foton-prime");
  };

  const goToSolutions = () => {
    setIsMinimized(true);
    onNavigate("proyectos");
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] hidden w-[min(360px,calc(100vw-2rem))] select-none lg:block">
      {!isMinimized && (
        <div className="mb-4 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950/88 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
          <div className="relative overflow-hidden p-5">
            <div className="absolute -right-12 -top-16 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-violet-500/20 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 flex items-start gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/30">
                <Bot className="h-7 w-7" aria-hidden="true" />
                <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300">FOTON ONLINE</p>
                    <h3 className="mt-1 font-space text-lg font-black leading-tight text-white">Tu guía del ecosistema ORBI.</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="rounded-full border border-white/10 bg-white/[0.03] p-1.5 text-slate-500 transition hover:text-white"
                    aria-label="Minimizar FOTON"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Soy FOTON. Puedo orientarte por las divisiones, soluciones, contenido y próximos pasos de ORBI Platform Season 1.
                </p>

                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={goToFoton} className="orbitron-primary-action !min-h-10 !justify-between !px-4 !py-2 !text-[11px]">
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Hablar con FOTON
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={goToSolutions} className="orbitron-secondary-action !min-h-10 !px-3 !py-2 !text-[10px]">
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                      Soluciones
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlayVideo?.("eco-general")}
                      className="orbitron-ghost-action !min-h-10 !px-3 !py-2 !text-[10px]"
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      60 segundos
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Sparkles className="h-3 w-3 text-cyan-300" aria-hidden="true" />
                  <span>Companion layer / sin API externa</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsMinimized((value) => !value)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-300/30 bg-slate-950/92 text-cyan-100 shadow-2xl shadow-cyan-950/50 backdrop-blur-2xl transition hover:scale-105 hover:border-cyan-200/60"
          aria-label={isMinimized ? "Abrir FOTON Companion" : "Minimizar FOTON Companion"}
        >
          <span className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl transition group-hover:bg-cyan-300/20" />
          <Bot className="relative h-7 w-7" aria-hidden="true" />
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400" />
        </button>
      </div>
    </div>
  );
}
