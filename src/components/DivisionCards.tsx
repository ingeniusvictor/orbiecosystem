import React from "react";
import { DIVISIONS } from "../data";
import { Gamepad2, Briefcase, Code, Cpu, ArrowRight, CheckCircle2, Play } from "lucide-react";

interface DivisionCardsProps {
  onSelectDivision: (divisionId: "games" | "corporate" | "development") => void;
  onPlayVideo?: (compId: string) => void;
}

export default function DivisionCards({ onSelectDivision, onPlayVideo }: DivisionCardsProps) {
  const getIcon = (name: string, colorClass: string) => {
    switch (name) {
      case "Gamepad2":
        return <Gamepad2 className={`w-8 h-8 ${colorClass === "blue" ? "text-blue-400" : colorClass === "green" ? "text-emerald-400" : "text-purple-400"}`} />;
      case "Briefcase":
        return <Briefcase className={`w-8 h-8 ${colorClass === "blue" ? "text-blue-400" : colorClass === "green" ? "text-emerald-400" : "text-purple-400"}`} />;
      case "Code":
        return <Code className={`w-8 h-8 ${colorClass === "blue" ? "text-blue-400" : colorClass === "green" ? "text-emerald-400" : "text-purple-400"}`} />;
      default:
        return <Cpu className={`w-8 h-8 ${colorClass === "blue" ? "text-blue-400" : colorClass === "green" ? "text-emerald-400" : "text-purple-400"}`} />;
    }
  };

  const getColorTheme = (colorClass: string) => {
    switch (colorClass) {
      case "blue":
        return {
          tagBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          itemBg: "bg-blue-500/5 text-blue-300",
          btnBg: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-500/20",
          glassClass: "glass-panel-glow-blue",
          hoverBorder: "hover:border-blue-500/40 hover:shadow-blue-500/10",
          ringColor: "ring-blue-500/20",
          indicator: "bg-blue-400"
        };
      case "green":
        return {
          tagBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          itemBg: "bg-emerald-500/5 text-emerald-300",
          btnBg: "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-500/20",
          glassClass: "glass-panel-glow-green",
          hoverBorder: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
          ringColor: "ring-emerald-500/20",
          indicator: "bg-emerald-400"
        };
      case "purple":
        return {
          tagBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          itemBg: "bg-purple-500/5 text-purple-300",
          btnBg: "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-650 shadow-purple-500/20",
          glassClass: "glass-panel-glow-purple",
          hoverBorder: "hover:border-purple-500/40 hover:shadow-purple-500/10",
          ringColor: "ring-purple-500/20",
          indicator: "bg-purple-400"
        };
      default:
        return {
          tagBg: "bg-slate-500/10 text-slate-400 border-slate-500/20",
          itemBg: "bg-slate-500/5 text-slate-300",
          btnBg: "bg-slate-700 hover:bg-slate-650 shadow-slate-500/10",
          glassClass: "glass-panel",
          hoverBorder: "hover:border-slate-500/30 hover:shadow-slate-500/5",
          ringColor: "ring-slate-500/20",
          indicator: "bg-slate-400"
        };
    }
  };

  return (
    <section id="divisiones" className="py-24 bg-[#050816] relative font-sans border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 select-none">
          <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold text-energy-cyan tracking-wider">
            <span>DIVISIONES ESTRUCTURALES // ORB-SYS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-space">
            Tres Divisiones, Un Solo Universo
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            El ecosistema ORBI se organiza en tres pilares operativos diseñados para retroalimentarse continuamente: videojuegos interactivos, aplicaciones de control en terreno y la red de infraestructura de desarrollo inteligente con IA.
          </p>
        </div>

        {/* Division Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {DIVISIONS.map((division) => {
            const theme = getColorTheme(division.colorClass);
            return (
              <div
                key={division.id}
                className={`glass-panel border rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl ${theme.glassClass} ${theme.hoverBorder} hover:-translate-y-1 relative group overflow-hidden`}
              >
                {/* Glowing edge sweep */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
                   division.colorClass === "blue" 
                     ? "from-blue-500/25 via-blue-400 to-blue-500/25" 
                     : division.colorClass === "green" 
                     ? "from-emerald-500/25 via-emerald-400 to-emerald-500/25" 
                     : "from-purple-500/25 via-purple-400 to-purple-500/25"
                } opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Content top side */}
                <div className="space-y-6">
                  {/* Icon & Title */}
                  <div className="flex items-center justify-between select-none">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
                      {getIcon(division.iconName, division.colorClass)}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className={`text-[10px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-full border ${theme.tagBg}`}>
                        {division.id.toUpperCase()} // MATRIX
                      </div>
                      {/* Video presentation trigger icon */}
                      {onPlayVideo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const videoId = 
                              division.id === "games" ? "orbi-games" :
                              division.id === "corporate" ? "orbi-corp" : "eco-general";
                            onPlayVideo(videoId);
                          }}
                          className="flex items-center gap-1 text-[8px] font-mono text-cyan-400 hover:text-white px-2 py-0.5 rounded bg-cyan-950/20 hover:bg-cyan-600/30 border border-cyan-500/10 hover:border-cyan-500/40 transition-all cursor-pointer uppercase font-black"
                          title="Reproducir presentación"
                        >
                          <Play className="w-2 h-2 fill-cyan-400 text-cyan-400" />
                          <span>Ver Video</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-wide font-space">{division.name}</h3>
                    <p className={`text-xs font-semibold tracking-wider font-mono uppercase ${division.colorClass === "blue" ? "text-blue-400" : division.colorClass === "green" ? "text-emerald-400" : "text-purple-400"}`}>
                      {division.subtitle}
                    </p>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed font-light">
                    {division.description}
                  </p>

                  {/* Highlights section */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/60 select-none">
                    <div className="text-[10px] uppercase text-slate-500 font-mono tracking-widest leading-none">
                      Incluye soluciones operativas:
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {division.includes.slice(0, 4).map((elem, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300">
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${division.colorClass === "blue" ? "text-blue-500" : division.colorClass === "green" ? "text-emerald-500" : "text-purple-500"}`} />
                          <span className="font-medium text-slate-300">{elem}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action button bottom side */}
                <div className="pt-8">
                  <button
                    onClick={() => onSelectDivision(division.id)}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold tracking-wider text-xs uppercase transition-all duration-350 cursor-pointer flex items-center justify-center space-x-2 shadow-lg ${theme.btnBg} transform hover:-translate-y-0.5`}
                  >
                    <span>EXPLORAR CATÁLOGO</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
