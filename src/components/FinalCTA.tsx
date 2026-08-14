import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { competitionContent } from "../content/competition";

interface FinalCTAProps {
  onNavigate: (sectionId: string) => void;
}

export default function FinalCTA({ onNavigate }: FinalCTAProps) {
  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden font-sans border-t border-slate-900 select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Banner sparkles icon */}
        <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-emerald-500/20 rounded-2xl border border-slate-800/80 animate-bounce duration-5000">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>

        {/* Dynamic Titles */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none uppercase">
            ORBI no es solo una idea.
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold gradient-text-accessible bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
            Es un ecosistema en construcción.
          </h3>
        </div>

        {/* Descriptive Summary Paragraph */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Aplicaciones, videojuegos, inteligencia artificial, energía, productividad y diseño convergen en una misma visión: crear tecnología útil, visualmente poderosa y preparada para evolucionar hacia desafíos planetarios reales.
        </p>

        {/* Action Buttons Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          <a
            href="/climate-recovery"
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm rounded-full shadow-lg shadow-blue-500/15 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>{competitionContent.home.cta}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>

          <button
            onClick={() => onNavigate("proyectos")}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 font-semibold text-sm rounded-full transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Ver Ecosistema</span>
          </button>
        </div>

        {/* Epílogo / Prominent Welcome Phrase */}
        <div className="pt-6">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase block select-none">
            Welcome to the ORBI Ecosystem.
          </span>
          <span className="text-[10px] font-mono text-slate-600 tracking-wider">
            SECURE_KEY: #ORB_INIT_2026 // PORTAL_UP
          </span>
        </div>

      </div>
    </section>
  );
}
