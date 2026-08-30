import React, { useEffect, useState } from "react";
import { ArrowRight, Bot, Compass, MessageCircle, Play, Sparkles, X, Zap } from "lucide-react";

interface FotonCompanionProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

const FOTON_MODEL_SRC = "/assets/models/orbi-foton.glb";
const LEFT_LOOK_ORBIT = -85;
const RIGHT_LOOK_ORBIT = 85;

export default function FotonCompanion({ onNavigate, onPlayVideo }: FotonCompanionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [modelViewerReady, setModelViewerReady] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const [orbitAngle, setOrbitAngle] = useState(LEFT_LOOK_ORBIT);

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

  useEffect(() => {
    if (!modelViewerReady || modelFailed) {
      return;
    }

    const lookAroundTimer = window.setInterval(() => {
      setOrbitAngle((currentAngle) => (currentAngle < 0 ? RIGHT_LOOK_ORBIT : LEFT_LOOK_ORBIT));
    }, 4200);

    return () => window.clearInterval(lookAroundTimer);
  }, [modelViewerReady, modelFailed]);

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

  const glassActionClass =
    "min-w-0 rounded-2xl bg-white/[0.065] px-2 py-2 font-mono text-[8.5px] font-black uppercase tracking-[0.035em] text-slate-50 ring-1 ring-white/[0.09] backdrop-blur-xl transition hover:bg-white/[0.13] hover:text-white";

  const renderFotonModel = (mode: "compact" | "panel") => {
    const isCompact = mode === "compact";
    const modelClassName = isCompact ? "h-20 w-20" : "h-32 w-32";

    return (
      <div className={`relative flex shrink-0 items-center justify-center ${modelClassName}`}>
        <span className="absolute inset-2 rounded-full bg-yellow-300/15 blur-2xl" aria-hidden="true" />
        <span className="absolute inset-4 rounded-full border border-yellow-300/12" aria-hidden="true" />

        {modelViewerReady && !modelFailed ? (
          React.createElement("model-viewer", {
            src: FOTON_MODEL_SRC,
            alt: "Modelo 3D de ORBI FOTON",
            className: "relative z-10 h-full w-full animate-[orbi-foton-float_5.4s_ease-in-out_infinite] transition-transform duration-700",
            "camera-orbit": `${orbitAngle}deg 72deg 105%`,
            "min-camera-orbit": "-90deg 62deg 105%",
            "max-camera-orbit": "90deg 82deg 105%",
            "field-of-view": "30deg",
            "interpolation-decay": "95",
            "camera-controls": false,
            "disable-zoom": true,
            "interaction-prompt": "none",
            "shadow-intensity": "0.55",
            exposure: "1.05",
            loading: "lazy",
            reveal: "auto",
            onError: () => setModelFailed(true),
          })
        ) : (
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.07] text-yellow-200 shadow-2xl shadow-yellow-950/20 ring-1 ring-yellow-100/10 backdrop-blur-2xl">
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
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>

      {!isMinimized && (
        <div className="mb-4 overflow-hidden rounded-[2rem] bg-white/[0.026] shadow-[0_18px_48px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.10] backdrop-blur-[40px]">
          <div className="relative overflow-hidden p-5">
            <div className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.012)_48%,rgba(34,211,238,0.035)_100%)]" aria-hidden="true" />
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(250,204,21,0.08),transparent_28%),radial-gradient(circle_at_0%_100%,rgba(34,211,238,0.075),transparent_38%)]" aria-hidden="true" />
            <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden="true" />
            <div className="absolute inset-y-7 left-0 w-px bg-gradient-to-b from-transparent via-white/14 to-transparent" aria-hidden="true" />

            <div className="relative z-10 flex items-start gap-4">
              {renderFotonModel("panel")}

              <div className="min-w-0 flex-1 pt-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[8.5px] font-black uppercase tracking-[0.22em] text-yellow-100/95 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]">ORBI FOTON ONLINE</p>
                    <h3 className="mt-1 font-space text-lg font-black leading-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.78)]">Guía IA visual del ecosistema.</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMinimized(true)}
                    className="shrink-0 rounded-full bg-white/[0.07] p-1.5 text-slate-200 ring-1 ring-white/10 backdrop-blur-2xl transition hover:bg-white/[0.14] hover:text-white"
                    aria-label="Minimizar ORBI FOTON"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-100/94 drop-shadow-[0_2px_16px_rgba(0,0,0,0.74)]">
                  Hola, soy ORBI FOTON. Puedo guiarte por las divisiones, soluciones, videos y próximos lanzamientos de ORBI Ecosystem.
                </p>

                <div className="mt-4 grid gap-2">
                  <button type="button" onClick={goToFoton} className="group relative min-h-10 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500/82 via-violet-500/80 to-cyan-400/78 px-4 py-2 font-mono text-[10.5px] font-black uppercase tracking-[0.08em] text-white shadow-[0_10px_30px_rgba(37,99,235,0.20)] ring-1 ring-white/14 transition hover:brightness-110">
                    <span className="absolute inset-0 bg-white/[0.075] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    <span className="relative z-10 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Hablar con FOTON
                      </span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </button>

                  <div className="grid grid-cols-[0.82fr_1.18fr_0.82fr] gap-1.5">
                    <button type="button" onClick={goToEcosystem} className={glassActionClass}>
                      <span className="flex min-w-0 items-center justify-center gap-1 truncate">
                        <Sparkles className="h-3 w-3 shrink-0 text-yellow-100" aria-hidden="true" />
                        <span className="truncate">ORBI</span>
                      </span>
                    </button>
                    <button type="button" onClick={goToSolutions} className={glassActionClass}>
                      <span className="flex min-w-0 items-center justify-center gap-1 truncate">
                        <Compass className="h-3 w-3 shrink-0 text-cyan-100" aria-hidden="true" />
                        <span className="truncate">Soluciones</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPlayVideo?.("eco-general")}
                      className={glassActionClass}
                    >
                      <span className="flex min-w-0 items-center justify-center gap-1 truncate">
                        <Play className="h-3 w-3 shrink-0 text-cyan-100" aria-hidden="true" />
                        <span className="truncate">Video</span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-white/[0.09] pt-3 font-mono text-[8.5px] font-black uppercase tracking-[0.16em] text-slate-200/62 drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                  <Zap className="h-3 w-3 shrink-0 text-yellow-100" aria-hidden="true" />
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
          className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-white/[0.048] text-yellow-100 shadow-[0_18px_54px_rgba(0,0,0,0.24)] ring-1 ring-white/12 backdrop-blur-[34px] transition hover:scale-105 hover:bg-white/[0.08] hover:ring-yellow-100/25"
          aria-label={isMinimized ? "Abrir ORBI FOTON" : "Minimizar ORBI FOTON"}
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),rgba(250,204,21,0.075)_42%,transparent_70%)] transition group-hover:opacity-90" aria-hidden="true" />
          {renderFotonModel("compact")}
        </button>
      </div>
    </div>
  );
}
