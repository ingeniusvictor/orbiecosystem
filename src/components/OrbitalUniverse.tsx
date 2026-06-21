import React, { useState } from "react";
import { PRODUCTS } from "../data";
import { Product } from "../types";
import { 
  Bot, 
  Gamepad2, 
  Briefcase, 
  Code, 
  Sparkles, 
  Cpu, 
  Globe, 
  ChevronRight, 
  Zap, 
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface UniverseNode {
  id: string;
  name: string;
  division: "games" | "corporate" | "development";
  category: string;
  status: string;
  description: string;
  orbitRadius: number; // For rendering multiple orbits
  angleDeg: number;    // Coordinates on circle
}

export default function OrbitalUniverse() {
  const [activeNode, setActiveNode] = useState<UniverseNode | null>(null);

  const solarNodes: UniverseNode[] = [
    // Ring 1 (Inner Orbit - Core Systems)
    {
      id: "orbi-corporate-assistant",
      name: "Orbi Corporate Assistant",
      division: "corporate",
      category: "Enterprise AI Suite",
      status: "En expansión",
      description: "Suite unificada que consolida asistentes B2B inteligentes con el nexo de procesamiento principal.",
      orbitRadius: 130,
      angleDeg: 0,
    },
    {
      id: "orbi-grid-defense",
      name: "Orbi Grid Defense",
      division: "games",
      category: "Tower Defense Game",
      status: "Prototipo",
      description: "Héroes de energía pura sincronizados protegiendo la red interconectada contra The Blackout.",
      orbitRadius: 130,
      angleDeg: 120,
    },
    {
      id: "orbi-development-system",
      name: "Orbi Development Core",
      division: "development",
      category: "Ecosystem Backbone Core",
      status: "Estable",
      description: "Estructura conectora, SDKs y APIs habilitadas para inyectar modelos cognitivos del ecosistema.",
      orbitRadius: 130,
      angleDeg: 240,
    },

    // Ring 2 (Middle Orbit - Productivity & Battlefield)
    {
      id: "orbi-geo",
      name: "Orbi GEO",
      division: "corporate",
      category: "Smart Field Inspection",
      status: "Android funcional",
      description: "Carga de metadatos con posicionamiento satelital y lectura inteligente de variables con OCR.",
      orbitRadius: 210,
      angleDeg: 45,
    },
    {
      id: "orbi-survival-protocol",
      name: "Orbi Survival Protocol",
      division: "games",
      category: "Action Survival Game",
      status: "En desarrollo",
      description: "Batallas cooperativas y evolución de aptitudes en escenarios apocalípticos de The Blackout.",
      orbitRadius: 210,
      angleDeg: 135,
    },
    {
      id: "orbi-sign",
      name: "Orbi Sign",
      division: "corporate",
      category: "Document Signature",
      status: "En desarrollo",
      description: "Gestión y firma legal descentralizada y gratuita de documentos PDF en el entorno.",
      orbitRadius: 210,
      angleDeg: 225,
    },
    {
      id: "orbi-blocks",
      name: "Orbi Blocks",
      division: "games",
      category: "Puzzle / Arcade Game",
      status: "En desarrollo",
      description: "Física de energía recombinante con rompecabezas tácticos de alta tensión espacial.",
      orbitRadius: 210,
      angleDeg: 315,
    },

    // Ring 3 (Outer Orbit - Expansion)
    {
      id: "orbi-plan-ia",
      name: "Orbi Plan IA",
      division: "corporate",
      category: "Construction & Planning",
      status: "En desarrollo",
      description: "Planificación de recintos de obras civiles mediante análisis OCR de planos en PDF.",
      orbitRadius: 290,
      angleDeg: 90,
    },
    {
      id: "orbi-life",
      name: "Orbi Life",
      division: "games",
      category: "Virtual Companion",
      status: "Concepto avanzado",
      description: "Nutrición y maduración de seres de energía que estimulan y educan el uso ecológico.",
      orbitRadius: 290,
      angleDeg: 210,
    },
    {
      id: "orbi-legends",
      name: "Orbi Legends",
      division: "games",
      category: "Platform Adventure",
      status: "Concepto en expansión",
      description: "Plataformas de acción modernos reactivando los reactores planetarios apagados en ruinas.",
      orbitRadius: 290,
      angleDeg: 330,
    }
  ];

  const getDivisionTheme = (division: "games" | "corporate" | "development") => {
    switch (division) {
      case "games":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500",
          text: "text-blue-400",
          glow: "shadow-blue-500/35",
          accentColor: "#2979FF",
          label: "GAMES SYSTEM"
        };
      case "corporate":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500",
          text: "text-emerald-400",
          glow: "shadow-emerald-500/35",
          accentColor: "#3CFF9B",
          label: "CORPORATE SYSTEM"
        };
      case "development":
        return {
          bg: "bg-purple-500/10",
          border: "border-purple-500",
          text: "text-purple-400",
          glow: "shadow-purple-500/35",
          accentColor: "#8A2BE2",
          label: "DEVELOPMENT SYSTEM"
        };
    }
  };

  const currentTheme = activeNode ? getDivisionTheme(activeNode.division) : null;

  return (
    <section id="connected-universe" className="py-24 bg-slate-950 font-sans border-t border-slate-900 overflow-hidden relative">
      {/* Decorative tech grid backdrop */}
      <div className="absolute inset-0 grid-overlay opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 radial-shield pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 select-none">
          <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-energy-cyan tracking-wider">
            <Globe className="w-3.5 h-3.5 animate-spin-slow" />
            <span>ARQUITECTURA DE INTEGRACIÓN // ORB-NET</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-space">
            ORBI Connected Universe
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Nuestra visión unificada se comporta como un universo digital conectado. Cada aplicación móvil, videojuego táctico y conector corporativo orbita alrededor del núcleo de inteligencia central **Orbi Foton Prime**.
          </p>
        </div>

        {/* Outer Grid for Desktop Map & Details Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* DESKTOP SOLAR MAP ARCHITECTURE (Shown only on lg screens) */}
          <div className="hidden lg:flex lg:col-span-8 justify-center items-center h-[650px] relative">
            
            {/* Master Center - Orbi Foton Prime Nucleus */}
            <div className="absolute z-20 w-36 h-36 rounded-full bg-gradient-to-tr from-ia-violet via-electric-blue to-energy-cyan p-[3px] shadow-2xl shadow-ia-violet/30 animate-pulse-slow">
              <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
                <Bot className="w-8 h-8 text-white animate-float mb-1.5" />
                <span className="text-white text-[11px] font-black tracking-widest text-center leading-none uppercase font-orbitron">
                  FOTON
                </span>
                <span className="text-energy-cyan text-[9px] font-mono tracking-widest text-center mt-1 uppercase font-bold">
                  PRIME
                </span>
              </div>
            </div>

            {/* Orbit Circles */}
            {/* Orbit 1 */}
            <div className="absolute w-[260px] h-[260px] rounded-full border border-slate-800/40 border-dashed pointer-events-none" />
            
            {/* Orbit 2 */}
            <div className="absolute w-[420px] h-[420px] rounded-full border border-slate-850 pointer-events-none" />
            
            {/* Orbit 3 */}
            <div className="absolute w-[580px] h-[580px] rounded-full border border-slate-900 pointer-events-none" />

            {/* Orbit paths and connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-45 -z-10 bg-transparent">
              {/* Dynamic line connecting to active node */}
              {activeNode && (
                (() => {
                  const angleRad = (activeNode.angleDeg * Math.PI) / 180;
                  const xTarget = 325 + activeNode.orbitRadius * Math.cos(angleRad);
                  const yTarget = 325 + activeNode.orbitRadius * Math.sin(angleRad);
                  return (
                    <line 
                      x1={325} 
                      y1={325} 
                      x2={xTarget} 
                      y2={yTarget} 
                      stroke={getDivisionTheme(activeNode.division).accentColor} 
                      strokeWidth="2" 
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  );
                })()
              )}
            </svg>

            {/* Cosmic Nodes Generator */}
            {solarNodes.map((node) => {
              const theme = getDivisionTheme(node.division);
              const angleRad = (node.angleDeg * Math.PI) / 180;
              // Translate circle center polar (325, 325) relative
              const xPos = 320 + node.orbitRadius * Math.cos(angleRad);
              const yPos = 320 + node.orbitRadius * Math.sin(angleRad);

              const isActive = activeNode?.id === node.id;

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setActiveNode(node)}
                  className={`absolute rounded-full cursor-pointer transition-all duration-300 z-10 select-none ${
                    isActive 
                      ? "scale-110 p-[2px] " + theme.border + " " + theme.glow
                      : "p-[1px] border border-slate-800 hover:border-slate-500 hover:scale-105"
                  }`}
                  style={{
                    left: `${xPos}px`,
                    top: `${yPos}px`,
                    width: "56px",
                    height: "56px"
                  }}
                >
                  <div className="w-full h-full bg-slate-900/90 rounded-full flex flex-col items-center justify-center relative group">
                    {/* Tiny visual node inside */}
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      node.division === 'games' 
                        ? 'bg-blue-500 shadow-blue-500/50' 
                        : node.division === 'corporate' 
                        ? 'bg-emerald-500 shadow-emerald-500/50' 
                        : 'bg-purple-500 shadow-purple-500/50'
                    } shadow-md`} />
                    
                    {/* Node initials */}
                    <span className="text-[7.5px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
                      {node.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                    </span>

                    {/* Popover label tooltip */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform duration-200 bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded text-[9px] font-mono tracking-wide text-white whitespace-nowrap z-30">
                      {node.name}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Instruction tooltip overlay */}
            <div className="absolute bottom-4 left-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex items-center space-x-2 text-xs text-slate-400 select-none">
              <Zap className="w-3.5 h-3.5 text-solar-gold animate-bounce" />
              <span>Pasa el cursor sobre un nodo solar para leer su espectro holográfico.</span>
            </div>

          </div>

          {/* SIDEBAR DETAILED holographic card (Right on lg, top/full-width when active) */}
          <div className="col-span-1 lg:col-span-4 self-center">
            <div className={`glass-panel border rounded-2xl overflow-hidden p-6 shadow-2xl relative transition-all duration-300 min-h-[420px] flex flex-col justify-between ${
              activeNode 
                ? (activeNode.division === 'games' 
                    ? "border-blue-500/20 shadow-blue-950/10" 
                    : activeNode.division === 'corporate' 
                    ? "border-emerald-500/20 shadow-emerald-950/10" 
                    : "border-purple-500/20 shadow-purple-950/10")
                : "border-slate-800"
            }`}>
              
              {/* Corner tech lines */}
              <div className="absolute top-0 right-0 w-8 h-[1px] bg-slate-700" />
              <div className="absolute top-0 right-0 w-[1px] h-8 bg-slate-700" />

              {/* Hologram Card Body */}
              {activeNode ? (
                <div className="space-y-6">
                  {/* Division Category tag */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 ${currentTheme?.bg} ${currentTheme?.text} rounded border border-transparent`}>
                      {currentTheme?.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">SYSTEM READY // SECURE_NODE</span>
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white tracking-wide font-space uppercase">
                      {activeNode.name}
                    </h3>
                    <p className={`text-xs font-semibold tracking-wider uppercase font-mono ${currentTheme?.text}`}>
                      {activeNode.category}
                    </p>
                  </div>

                  {/* Status indicator row */}
                  <div className="flex items-center space-x-2 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-850 max-w-fit select-none">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        activeNode.division === 'games' ? 'bg-blue-400' : activeNode.division === 'corporate' ? 'bg-emerald-400' : 'bg-purple-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                        activeNode.division === 'games' ? 'bg-blue-500' : activeNode.division === 'corporate' ? 'bg-emerald-500' : 'bg-purple-500'
                      }`}></span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 font-bold tracking-wider">
                      SITUACIÓN: {activeNode.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Narrative details */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Resumen de Capacidad:</span>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                      {activeNode.description}
                    </p>
                  </div>

                  {/* Dynamic checklist attributes */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${currentTheme?.text}`} />
                      <span>Sincronización remota con Orbi Sync.</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400">
                      <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${currentTheme?.text}`} />
                      <span>Cerebro IA inyectado por Foton Prime.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto select-none">
                  <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-500 animate-pulse">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-white font-bold text-base tracking-wide uppercase">Selector de Espectro</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Pasa el cursor por encima de cualquier objeto orbital en el mapa para sincronizar la telemetría del espectro tecnológico en este panel.
                  </p>
                </div>
              )}

              {/* Footer label */}
              {activeNode && (
                <div className="pt-6 mt-6 border-t border-slate-800/80 text-center select-none">
                  <span className="text-[9px] text-slate-600 tracking-wider font-mono">
                    NUX MATRIX ADDR: 0xOR_MODUL_{activeNode.id.toUpperCase().replace(/-/g, "_")}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* MOBILE VERSION COLLAPSED: Structured Vertical Tree */}
        <div className="block lg:hidden mt-10 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-center select-none mb-6">
            <span className="text-[10px] text-solar-gold font-mono font-bold tracking-widest block uppercase mb-1">
              • NODO MAESTRO INTELIGENTE
            </span>
            <h4 className="text-white font-black text-lg tracking-wide uppercase font-orbitron">
              ORBI FOTON PRIME
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1.5">
              Cerebro articulador de inteligencia distribuyendo servicios de datos a todas las capas operacionales.
            </p>
          </div>

          <div className="text-[10px] text-slate-500 uppercase font-mono tracking-widest pl-2 mb-2">
            Nodos del Ecosistema Conectados:
          </div>

          <div className="space-y-3">
            {solarNodes.map((node) => {
              const theme = getDivisionTheme(node.division);
              return (
                <div 
                  key={node.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 ${theme.bg} ${theme.text} rounded`}>
                      {theme.label}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">STATUS: {node.status}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-wide">{node.name}</h4>
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide block">{node.category}</span>
                    <p className="text-slate-400 text-xs mt-2 leading-relaxed">{node.description}</p>
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
