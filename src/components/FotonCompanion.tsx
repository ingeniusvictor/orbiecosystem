import React, { useEffect, useState } from "react";
import { ArrowRight, Bot, Compass, MessageCircle, Play, Sparkles, X, Zap } from "lucide-react";

interface FotonCompanionProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

const FOTON_MODEL_SRC = "/assets/models/orbi-foton.glb";

export default function FotonCompanion({ onNavigate, onPlayVideo }: FotonCompanionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);

  useEffect(() => {
    const customElementsRegistry = window.customElements;

    if (customElementsRegistry.get("model-viewer")) {
      setModelViewerReady(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-orbi-model-viewer="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => setModelViewerReady(true), { once: true });
      existingScript.addEventListener("error", () => setModelFailed(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.dataset.orbiModelViewer = "true";
    script.onload = () => setModelViewerReady(true);
    script.onerror = () => setModelFailed(true);
    document.head.appendChild(script);
  }, []);

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

  const goToEcosystem = () => {
    setIsMinimized(true);
    onNavigate("ecosystem-season-one");
  };

  const renderFotonModel = (mode: "compact" | "panel") => {
    const isCompact = mode === "compact";
    const modelClassName = isCompact ? "h-20 w-20" : "h-32 w-32";

    return (
      <div className={`relative flex shrink-0 items-center justify-center ${modelClassName}`}>
        <span className="absolute inset-2 rounded-full bg-yellow-300/15 blur-2xl" aria-hidden="true" />
        <span className="absolute inset-4 rounded-full border border-yellow-300/15" aria-hidden="true" />

        {modelViewerReady && !modelFailed ? (
          React.createElement("model-viewer", {
            src: FOTON_MODEL_SRC,
            alt: "Modelo 3D de ORBI FOTON",
            className: "relative z-10 h-full w-full animate-[orbi-foton-float_4.8s_ease-in-out_infinite]",
            "auto-rotate": true,
            "rotation-per-second": "18deg",
            "camera-controls": true,
            "disable-zoom": true,
            "interaction-prompt": "none",
            "shadow-intensity": "0.55",
            exposure: "1.05",
            loading: "lazy",
            reveal: "auto",
            onError: () => setModelFailed(true),
          })
        ) : (
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-300/20 bg-slate-950/70 text-yellow-200 shadow-2xl shadow-yellow-950/25">
            <Bot className="h-8 w-8" aria-hidden="true" />
          </div>
        )}

        <span className="absolute right-3 top-3 z-20 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-lg shadow-emerald-500/40" />
      </div>
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] hidden w-[min(380px,calc(100vw-2rem))] select-none lg:block">
      <style>{`
        @keyframes orbi-foton-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.025); }
        }
      `}</style>

      {!isMinimized && (
        <div className="mb-4 overflow-hidden rounded-[2rem] bg-slate-950/38 shadow-[0_22px_90px_rgba(0,0,0,0.42)] ring-1 ring-white/[0.06] backdrop-blur-2xl">
          <div className="relative overflow-hidden p-5">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-yellow-200/[0.08] via-cyan-300/[0.025] to-violet-500/[0.08]" aria-hidden="true" />
            <div className="absolute inset-0 rounded-[2rem] bg-slate-950/[0.18]" aria-hidden="true" />
            <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-yellow-300/14 blur-3xl" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 flex items-start gap-4">
              {renderFotonModel("panel")}

              <div className="min-w-0 flex-1 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-yellow-100/90">ORBI FOTON ONLINE</p>
                    <h3 className="mt-1 font-space text-lg font-black leading-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.5)]">Guía IA visual del ecosistema.</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="rounded-full bg-white/[0.04] p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                    aria-label="Minimizar ORBI FOTON"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-200/92 drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)]">
                  Hola, soy ORBI FOTON. Puedo guiarte por las divisiones, soluciones, videos y próximos lanzamientos de ORBI Ecosystem.
                </p>

                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={goToFoton} className="orbitron-primary-action !min-h-10 !justify-between !px-4 !py-2 !text-[11px]">
                    <span className="inline-flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Hablar con FOTON
                    </span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={goToEcosystem} className="rounded-2xl bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-slate-100 transition hover:bg-white/[0.1] hover:text-white">
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-100" aria-hidden="true" />
                        ORBI
                      </span>
                    </button>
                    <button type="button" onClick={goToSolutions} className="rounded-2xl bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-slate-100 transition hover:bg-white/[0.1] hover:text-white">
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-cyan-100" aria-hidden="true" />
                        Soluciones
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlayVideo?.("eco-general")}
                      className="rounded-2xl bg-white/[0.055] px-3 py-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-slate-100 transition hover:bg-white/[0.1] hover:text-white"
                    >
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <Play className="h-3.5 w-3.5 text-cyan-100" aria-hidden="true" />
                        Video
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-slate-400/80">
                  <Zap className="h-3 w-3 text-yellow-100" aria-hidden="true" />
                  <span>3D companion layer / GLB ready</span>
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
          className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-slate-950/52 text-yellow-100 shadow-[0_20px_70px_rgba(0,0,0,0.42)] ring-1 ring-yellow-100/10 backdrop-blur-2xl transition hover:scale-105 hover:ring-yellow-100/25"
          aria-label={isMinimized ? "Abrir ORBI FOTON" : "Minimizar ORBI FOTON"}
        >
          <span className="absolute inset-0 rounded-full bg-yellow-300/10 blur-xl transition group-hover:bg-yellow-200/18" />
          {renderFotonModel("compact")}
        </button>
      </div>
    </div>
  );
}
