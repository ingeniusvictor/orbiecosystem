import React, { useState } from "react";
import { ArrowRight, Play, Compass, Sparkles, ChevronDown, ShieldCheck } from "lucide-react";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface HeroSectionProps {
  onNavigate: (sectionId: string) => void;
  onPlayVideo?: (compId: string) => void;
}

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

      <div className="orbitron-shell relative z-20 grid min-h-[calc(100vh-5rem)] items-start pb-28 pt-28 sm:pt-32 lg:pt-36 xl:pt-36">
        <div className="orbitron-reveal flex max-w-5xl flex-col items-start text-left">
          <div className="orbitron-chip mb-7">
            <Sparkles className="h-3.5 w-3.5 text-energy-cyan" aria-hidden="true" />
            <span>ORBI Universe · Season 1</span>
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
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/80">ORBI Ecosystem</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">Sede digital de una empresa AI-native</p>
            </div>
          </div>

          <h1 className="orbitron-title max-w-5xl text-5xl leading-[0.96] sm:text-6xl lg:text-7xl xl:text-8xl">
            Transformamos ideas en soluciones inteligentes.
          </h1>

          <p className="orbitron-subtitle mt-7 max-w-3xl text-base sm:text-lg">
            ORBI Ecosystem integra inteligencia artificial, ingeniería, educación, energía, automatización, medios y desarrollo para construir soluciones útiles para personas y empresas.
          </p>

          <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={() => onNavigate("ecosistema-mirada")}
              className="orbitron-primary-action"
            >
              <Compass className="h-4 w-4 text-cyan-100" aria-hidden="true" />
              <span>Explorar ORBI</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              onClick={() => onNavigate("divisiones")}
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
              <span>Ver presentación</span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-22 left-6 z-20 hidden flex-col space-y-1 font-mono text-[8px] tracking-widest text-slate-500 lg:flex">
        <span>SEASON: ONE</span>
        <span>MISSION: WOW</span>
      </div>
      <div className="absolute bottom-22 right-6 z-20 hidden flex-col space-y-1 text-right font-mono text-[8px] tracking-widest text-slate-500 lg:flex">
        <span>BUILD: FAST</span>
        <span>QUALITY: PREMIUM</span>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("ecosistema-mirada")}
        className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 cursor-pointer flex-col items-center space-y-2 rounded-xl px-3 py-2 text-slate-400 transition-colors hover:text-energy-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-label="Ir a la mirada del ecosistema"
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em]">
          Desliza para descubrir
        </span>
        <ChevronDown className="h-5 w-5 animate-bounce text-cyan-400" />
      </button>
    </section>
  );
}
