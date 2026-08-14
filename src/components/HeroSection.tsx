import React, { useState } from "react";
import { ArrowRight, Play, Compass, Grid, Sparkles, ChevronDown } from "lucide-react";
import { competitionContent } from "../content/competition";
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
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#050816] font-sans"
    >
      {/* Background Cinematic Video */}
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

      {/* Cinematic Dark Grid Overlay */}
      <div className="hero-overlay pointer-events-none" />
      <div className="absolute inset-0 grid-overlay opacity-[0.08] pointer-events-none z-1" />

      {/* Hero Content Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 flex flex-col items-center justify-center text-center space-y-8 select-none py-28 w-full">
        
        {/* Animated Cybernetic Badge */}
        <div className="inline-flex items-center space-x-2 bg-[#0B1026]/80 border border-cyan-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-energy-cyan tracking-widest shadow-lg shadow-black/80 animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5 text-energy-cyan animate-spin-slow" />
          <span className="uppercase font-mono">ENERGY • INTELLIGENCE • GAMES • PRODUCTIVITY</span>
        </div>

        {/* Brand Official Logo with smooth interactive error handler */}
        <div className="relative py-4 flex items-center justify-center min-h-[140px] w-full max-w-[540px]">
          <h1 className="flex items-center justify-center">
            {!logoFailed ? (
              <img
                src="/assets/logo.jpeg"
                alt="ORBI Ecosystem"
                className="hero-logo cursor-pointer object-contain transition-transform duration-500 hover:scale-[1.03]"
                onError={() => setLogoFailed(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex flex-col items-center justify-center animate-[logoReveal_1.2s_ease-out_both]" aria-label="ORBI Ecosystem">
                <span className="text-6xl sm:text-8xl font-black tracking-[0.2em] font-orbitron gradient-text-accessible bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 drop-shadow-[0_0_35px_rgba(0,195,255,0.8)] leading-none select-none">
                  ORBI
                </span>
                <span className="text-sm sm:text-lg font-bold font-mono tracking-[0.6em] text-cyan-400/80 drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] mt-3">
                  ECOSYSTEM
                </span>
              </span>
            )}
          </h1>
        </div>

        {/* High impact slogan and subtitle */}
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide font-space">
            El futuro no es una sola aplicación. <br className="hidden sm:inline" />
            <span className="gradient-text-accessible bg-gradient-to-r from-energy-cyan to-purple-400">
              Es un ecosistema conectado.
            </span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base md:text-md max-w-2xl mx-auto leading-relaxed font-light">
            {competitionContent.home.supportText}
          </p>
          <a
            href="/climate-recovery"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-950/20 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {competitionContent.home.cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        {/* Action Buttons Box */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-4">
          
          {/* Button 1: Explorar Ecosistema */}
          <button
            onClick={() => onNavigate("ecosistema-mirada")}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-400 text-white font-extrabold tracking-widest text-xs rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-[2.5px] hover:shadow-cyan-500/10 flex items-center justify-center space-x-2 group cursor-pointer border border-cyan-500/20 uppercase animate-in fade-in duration-500"
          >
            <Compass className="w-4 h-4 text-cyan-200 group-hover:rotate-45 transition-transform" />
            <span>Explorar Ecosistema</span>
          </button>

          {/* Button 2: Ver Proyectos */}
          <button
            onClick={() => onNavigate("proyectos")}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-100 hover:text-white border border-slate-800 hover:border-slate-700 font-extrabold tracking-widest text-xs rounded-full transition-all duration-300 transform hover:-translate-y-[2px] flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-black/80 uppercase animate-in fade-in duration-500"
          >
            <Grid className="w-4 h-4 text-purple-400" />
            <span>Ver Proyectos</span>
          </button>

          {/* Button 3: Reproducir Presentación (Calls global play event) */}
          <button
            onClick={() => onPlayVideo && onPlayVideo("eco-general")}
            className="w-full sm:w-auto px-8 py-4 bg-slate-950 hover:bg-slate-900 text-energy-cyan hover:text-white border border-cyan-500/30 hover:border-cyan-500/50 font-extrabold tracking-widest text-xs rounded-full transition-all duration-300 transform hover:-translate-y-[2px] flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-cyan-950/20 uppercase animate-in fade-in duration-500"
          >
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <Play className="w-4 h-4 text-energy-cyan" />
            <span>Reproducir Presentación</span>
          </button>
        </div>

      </div>

      {/* Cinematic HUD details */}
      <div className="absolute left-6 bottom-22 z-20 hidden lg:flex flex-col text-[8px] font-mono tracking-widest text-slate-500 space-y-1">
        <span>RESOLVER: SEC_ORB_CHNL</span>
        <span>LATENCY: ZERO_LOSS</span>
      </div>
      <div className="absolute right-6 bottom-22 z-20 hidden lg:flex flex-col text-right text-[8px] font-mono tracking-widest text-slate-500 space-y-1">
        <span>FPS: AUTO_PRESETS</span>
        <span>RESOLUTION: MAX_READY</span>
      </div>

      {/* Scroll indicator with click navigation */}
      <button
        type="button"
        onClick={() => onNavigate("ecosistema-mirada")}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center space-y-2 cursor-pointer rounded-xl px-3 py-2 text-slate-400 transition-colors hover:text-energy-cyan focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-label="Ir a la mirada del ecosistema"
      >
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase font-bold">
          Desliza para explorar
        </span>
        <ChevronDown className="w-5 h-5 {animate-bounce} text-cyan-400 animate-bounce" />
      </button>
    </section>
  );
}
