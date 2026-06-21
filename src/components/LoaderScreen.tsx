import React, { useState, useEffect } from "react";
import { Cpu, Sparkles } from "lucide-react";

export default function LoaderScreen() {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("STARTING COGNITIVE NUCLEUS...");
  const [isDone, setIsDone] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Fast initialization simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 25) {
      setStatusText("NEXUS CONNECTING TO FOTON PRIME CORE...");
    } else if (progress < 50) {
      setStatusText("ESTABLISHING ORBI SYNC CONNECTORS...");
    } else if (progress < 75) {
      setStatusText("LOADING VIDEO CHANNELS & PRESENTATION...");
    } else if (progress < 95) {
      setStatusText("CALIBRATING MODULAR MATRIX SENSORS...");
    } else {
      setStatusText("ECOSYSTEM ENGAGED // ONLINE");
      
      const timeoutDone = setTimeout(() => {
        setIsDone(true);
      }, 500);

      const timeoutRender = setTimeout(() => {
        setShouldRender(false);
      }, 1100);

      return () => {
        clearTimeout(timeoutDone);
        clearTimeout(timeoutRender);
      };
    }
  }, [progress]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#050812] flex flex-col items-center justify-center transition-all duration-750 ease-out select-none ${
        isDone ? "opacity-0 pointer-events-none scale-[1.05]" : "opacity-100"
      }`}
    >
      {/* Background Matrix Mesh */}
      <div className="absolute inset-0 bg-grid-matrix opacity-[0.03] pointer-events-none" />

      {/* Cybernetic Circle Ring Structure */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Pulsing glow background */}
        <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-emerald-500/10 blur-2xl animate-pulse" />

        {/* Outer Rotating Dash Energy Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/20 animate-[spin_40s_linear_infinite]" />
        
        {/* Inner Counter-Rotating Orbit Rings */}
        <div className="absolute w-[80%] h-[92%] rounded-full border border-blue-500/20 animate-[spin_12s_linear_infinite]" />
        <div className="absolute w-[92%] h-[80%] rounded-full border border-emerald-500/20 animate-[spin_16s_linear_infinite_reverse]" />

        {/* Central Logo Symbol */}
        <div className="relative w-36 h-36 rounded-full bg-[#0B1026] border border-slate-900 shadow-2xl flex flex-col items-center justify-center">
          <div className="text-white font-black text-4xl tracking-widest font-orbitron drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] relative">
            Ø
            <span className="absolute -top-1.5 -right-1">
              <Sparkles className="w-3.5 h-3.5 text-energy-cyan animate-pulse" />
            </span>
          </div>
          <div className="text-[7.5px] uppercase tracking-[0.3em] text-cyan-400 font-mono font-bold mt-2">
            ORBI SYSTEM
          </div>
        </div>

        {/* Rotating Energy Particles */}
        <div className="absolute inset-3 animate-[spin_8s_linear_infinite]">
          <div className="w-2 h-2 rounded-full bg-energy-cyan shadow-[0_0_8px_#00e5ff] absolute top-0 left-1/2 -translate-x-1/2" />
        </div>
        <div className="absolute inset-6 animate-[spin_11s_linear_infinite_reverse]">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7] absolute bottom-0 left-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Loading telemetry and indicators */}
      <div className="mt-10 space-y-4 text-center max-w-sm px-6 w-full relative z-10">
        <div className="space-y-1">
          <h2 className="text-white font-extrabold text-sm tracking-[0.25em] font-space font-orbitron">
            ORBI ECOSYSTEM
          </h2>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            {statusText}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5 w-full">
          <div className="h-[3px] bg-slate-950 rounded-full border border-slate-900 overflow-hidden relative">
            {/* Energy progress segment */}
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-400 transition-all duration-150 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[9px] text-slate-500 font-bold">
            <span>SYS_INIT</span>
            <span className="text-purple-400">{Math.min(progress, 100)}%</span>
          </div>
        </div>
      </div>

      {/* HUD Watermark footer */}
      <div className="absolute bottom-6 text-center select-none">
        <span className="text-[8px] text-slate-600 tracking-[0.3em] font-mono">
          NEXUS LAYER SECURE_CON // MULTI_SYS ACTIVE
        </span>
      </div>
    </div>
  );
}
