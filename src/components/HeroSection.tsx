import React, { useState } from "react";
import { ArrowRight, Play, Compass, Sparkles, ChevronDown, ShieldCheck } from "lucide-react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

const heroSignals = ["IA aplicada", "Software", "Energía", "Educación", "Contenido"];
const heroProofs = [
  {
    label: "Para empresas",
    value: "automatización, documentos, chatbots y productividad"
  },
  {
    label: "Para personas",
    value: "aprendizaje, bienestar digital y soluciones prácticas"
  },
  {
    label: "Para energía",
    value: "solar, operación, análisis y cultura técnica"
  }
];

export default function HeroSection({ onNavigate, onPlayVideo }: HeroSectionProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-[#050816] font-sans"
    >
      {!prefersReducedMotion && (
        <video
          className="hero-video pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => {
            console.warn("Ecosystem background video not ready, falling back to cinematic animated canvas.");
          }}
        >
          <source src="/assets/videos/orbi-intro.mp4" type="video/mp4" />
          <source src="https://assets.mixkit.co/videos/preview/mixkit-background-of-digital-glowing-lines-41584-large.mp4" type="video/mp4" />
        </video>
      )}

      <div className="hero-overlay pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 z-1 grid-overlay opacity-[0.08]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-slate-950 via-slate-950/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-gradient-to-t from-slate-950 via-slate-950/82 to-transparent" />

      <div className="orbitron-shell relative z-20 grid min-h-[calc(100vh-5rem)] items-start pb-28 pt-24 sm:pt-28 lg:pt-32 xl:pt-32">
        <div className="orbitron-reveal flex max-w-6xl flex-col items-start text-left">
          <div className="orbitron-chip mb-7">
            <Sparkles className="h-3.5 w-3.5 text-energy-cyan" aria-hidden="true" />
            <span>ORBI Ecosystem · Season 1 Live</span>
          </div>

          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-400/20 bg-slate-950/60 shadow-2xl shadow-cyan-950/30 sm:h-20 sm:w-20">
              {!logoFailed ? (
                <img
                  src="/assets/logo.jpeg"
                  alt="ORBI Ecosystem"
                  className="h-14 w-14 object-contain drop-shadow-[0_0_18px_rgba(0,229,255,0.55)] transition-transform duration-500 hover:scale-[1.04] sm:h-16 sm:w-16"
                  onError={() => setLogoFailed(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-orbitron text-2xl font-black tracking-[0.08em] text-white">Ø</span>
              )}
            </div>
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/80">ORBI Ecosystem SpA</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">IA, software, energía y contenido en una sola plataforma</p>
            </div>
          </div>

          <h1 className="orbitron-title max-w-6xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl xl:text-[5.7rem]">
            Un ecosistema de IA y tecnología para convertir ideas en soluciones reales.
          </h1>

          <p className="orbitron-subtitle mt-7 max-w-4xl text-base sm:text-lg">
            ORBI conecta desarrollo de software, inteligencia artificial, educación técnica, energía solar, automatización, bienestar digital, videojuegos y noticias para crear herramientas útiles para personas, empresas y comunidades.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {heroSignals.map((signal) => (
              <span
                key={signal}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-slate-300"
              >
                {signal}
              </span>
            ))}
          </div>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => onNavigate("ecosystem-season-one")}
              className="orbitron-primary-action"
            >
              <Compass className="h-4 w-4 text-cyan-100" aria-hidden="true" />
              <span>Entrar al ecosistema</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              onClick={() => onNavigate("proyectos")}
              className="orbitron-secondary-action"
            >
              <ShieldCheck className="h-4 w-4 text-purple-300" aria-hidden="true" />
              <span>Ver soluciones</span>
            </button>

            <button
              onClick={() => onPlayVideo && onPlayVideo("eco-general")}
              className="orbitron-ghost-action"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
              </span>
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Ver en 60 segundos</span>
            </button>
          </div>

          <div className="mt-10 grid w-full max-w-5xl gap-3 md:grid-cols-3">
            {heroProofs.map((proof) => (
              <div key={proof.label} className="rounded-3xl border border-cyan-400/10 bg-slate-950/45 p-4 backdrop-blur-xl">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">{proof.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{proof.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-22 left-6 z-20 hidden flex-col space-y-1 font-mono text-[8px] tracking-widest text-slate-500 lg:flex">
        <span>SEASON: ONE</span>
        <span>MISSION: CONVERT</span>
      </div>
      <div className="absolute bottom-22 right-6 z-20 hidden flex-col space-y-1 text-right font-mono text-[8px] tracking-widest text-slate-500 lg:flex">
        <span>BUILD: ACTIVE</span>
        <span>QUALITY: PREMIUM</span>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("ecosystem-season-one")}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center space-y-2 rounded-xl px-3 py-2 text-slate-400 transition-colors hover:text-energy-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-label="Ir al mapa del ecosistema ORBI"
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
          Desliza para descubrir
        </span>
        <ChevronDown className="h-5 w-5 animate-bounce text-cyan-400" />
      </button>
    </section>
  );
}
