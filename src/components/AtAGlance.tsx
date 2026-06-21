import React from "react";
import { Briefcase, Gamepad2, Brain, Grid, Sparkles, ArrowRight } from "lucide-react";

export default function AtAGlance() {
  const pillars = [
    {
      title: "Apps Corporativas",
      description: "Herramientas reales de nivel empresarial para inspección en terreno (GEO), planificación con IA, firma segura de documentos y optimización de productividad corporativa.",
      icon: <Briefcase className="w-6 h-6 text-emerald-400" />,
      tag: "ORB-CORP",
      borderColor: "group-hover:border-emerald-500/35",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      title: "Videojuegos ORBI",
      description: "Experiencias interactivas con héroes energéticos, mundos cruzados y lore interconectado. Videojuegos que integran mecánicas tácticas, de simulación y rol en un universo unificado.",
      icon: <Gamepad2 className="w-6 h-6 text-blue-400" />,
      tag: "ORB-PLAY",
      borderColor: "group-hover:border-blue-500/35",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    {
      title: "Inteligencia Artificial",
      description: "El núcleo inteligente Orbi Foton Prime conecta y alimenta asistentes cognitivos especializados que interactúan, clasifican datos y resuelven peticiones en cada aplicación.",
      icon: <Brain className="w-6 h-6 text-purple-400" />,
      tag: "ORB-CORE",
      borderColor: "group-hover:border-purple-500/35",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
    },
    {
      title: "Sistema Modular",
      description: "Ingeniería de software robusta donde cada micro-módulo o servicio opera de manera totalmente independiente, pero se acopla nativamente al canal común Orbi Sync.",
      icon: <Grid className="w-6 h-6 text-cyan-400" />,
      tag: "ORB-DATA",
      borderColor: "group-hover:border-cyan-500/35",
      glowColor: "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    }
  ];

  return (
    <section id="ecosistema-mirada" className="py-20 bg-[#050816] relative overflow-hidden border-t border-slate-900 select-none">
      {/* Background visual detail */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-gradient-radial from-purple-950/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold text-energy-cyan tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 text-energy-cyan animate-pulse" />
            <span>ORBI AT A GLANCE // SINCRONIZACIÓN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-space uppercase">
            ORBI Ecosystem en una mirada
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light">
            Soluciones estructuradas de alto rendimiento técnico, diseñadas para transformar procesos de negocio y enriquecer la experiencia interactiva digital.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className={`group bg-[#0B1026]/40 border border-slate-900 rounded-2xl p-6 transition-all duration-300 hover:bg-[#0B1026]/80 hover:translate-y-[-4px] flex flex-col justify-between ${pillar.borderColor} ${pillar.glowColor}`}
            >
              <div className="space-y-4">
                {/* Icon wrapper */}
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-[#050816] border border-slate-850 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                    {pillar.icon}
                  </div>
                  <span className={`text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border ${pillar.badgeColor}`}>
                    {pillar.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-wide font-space group-hover:text-energy-cyan transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
                    {pillar.description}
                  </p>
                </div>
              </div>

              <div className="pt-5 flex items-center text-[10px] font-mono font-bold tracking-wider text-slate-500 group-hover:text-white transition-colors">
                <span>VER INTEGRACIONES</span>
                <ArrowRight className="w-3 h-3 ml-1.5 transition-transform group-hover:translate-x-1 text-energy-cyan" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
