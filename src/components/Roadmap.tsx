import { ROADMAP } from "../data";
import { CheckCircle2, Clock, Calendar, ShieldCheck, Play, ArrowUpRight } from "lucide-react";

export default function Roadmap() {
  const getStatusBadge = (status: "completo" | "actual" | "siguiente" | "futuro") => {
    switch (status) {
      case "completo":
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>COMPLETO</span>
          </span>
        );
      case "actual":
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase animate-pulse">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>FASE ACTUAL</span>
          </span>
        );
      case "siguiente":
        return (
          <span className="inline-flex items-center space-x-1 bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase">
            <Play className="w-3 h-3 text-purple-400" />
            <span>SIGUIENTE</span>
          </span>
        );
      case "futuro":
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-800 border border-slate-700 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase">
            <span>PLANIFICADO</span>
          </span>
        );
    }
  };

  const getTimelineIndicatorStyles = (status: "completo" | "actual" | "siguiente" | "futuro") => {
    switch (status) {
      case "completo":
        return {
          bullet: "bg-emerald-500 ring-4 ring-emerald-900/40 border-slate-900",
          border: "border-emerald-500/40"
        };
      case "actual":
        return {
          bullet: "bg-blue-500 ring-4 ring-blue-900/40 border-slate-900",
          border: "border-blue-500/40"
        };
      case "siguiente":
        return {
          bullet: "bg-purple-500 ring-4 ring-purple-900/40 border-slate-900",
          border: "border-purple-500/20"
        };
      case "futuro":
        return {
          bullet: "bg-slate-800 ring-4 ring-slate-900 border-slate-950",
          border: "border-slate-800/40"
        };
    }
  };

  return (
    <section id="roadmap" className="py-24 bg-slate-900 border-t border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 select-none">
          <div className="inline-flex items-center space-x-1 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-purple-400 tracking-wider">
            <span>HOJA DE RUTA // ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Roadmap del Universo ORBI
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Progreso evolutivo secuencial. Desarrollamos la infraestructura central paso a paso para garantizar que cada módulo interconectado sea óptimo, escalable y confiable.
          </p>
        </div>

        {/* Roadmap Timeline Layout (Left-Aligned timeline on responsive, centered conceptually) */}
        <div className="max-w-4xl mx-auto relative">
          
          {/* Vertical central path line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-slate-850 -translate-x-1/2 pointer-events-none" />

          {/* Timeline Cards */}
          <div className="space-y-12 relative">
            {ROADMAP.map((item, index) => {
              const indicator = getTimelineIndicatorStyles(item.status);
              const isEven = index % 2 === 0;

              return (
                <div 
                  key={index} 
                  className={`flex flex-col md:flex-row items-stretch relative ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Left Column Spacer/Node */}
                  <div className="w-full md:w-1/2 flex items-center justify-end px-0 md:px-8" />
                  
                  {/* Timeline bullet dot marker */}
                  <div className="absolute left-4 md:left-1/2 w-4.5 h-4.5 rounded-full border-2 border-slate-950 top-1.5 md:top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'completo' ? 'bg-emerald-400' : item.status === 'actual' ? 'bg-blue-400 animate-ping' : item.status === 'siguiente' ? 'bg-purple-400' : 'bg-slate-600'}`} />
                  </div>

                  {/* Card Content Column */}
                  <div className="w-full md:w-1/2 pl-12 md:pl-0 md:px-8">
                    <div className={`bg-slate-950 border border-slate-800/80 rounded-2xl p-6 md:p-7 shadow-xl hover:border-slate-700 transition-all duration-300 relative group`}>
                      
                      {/* Sub-indicator overlay glow */}
                      <div className={`absolute top-0 right-4 w-12 h-[2px] bg-gradient-to-l opacity-20 group-hover:opacity-60 transition-opacity`} />

                      {/* Info & Status row */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 select-none">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                            {item.phase}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 font-mono">
                            {item.subtitle}
                          </span>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Main Titles */}
                      <h3 className="text-xl font-bold text-white tracking-wide mb-3">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {item.description}
                      </p>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
