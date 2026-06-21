import React, { useEffect, useState } from "react";

interface SeededStar {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function BackgroundFX() {
  const [stars, setStars] = useState<SeededStar[]>([]);

  useEffect(() => {
    // Generate deterministic values for stars to prevent hydration mismatch
    const generatedStars: SeededStar[] = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      top: Math.floor(Math.random() * 100),
      left: Math.floor(Math.random() * 100),
      size: Math.random() < 0.3 ? 2 : 1, // some 2px stars, mostly 1px
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 5,
      opacity: 0.15 + Math.random() * 0.45
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 select-none">
      {/* Absolute Dark Master Base */}
      <div className="absolute inset-0 bg-[#05081a]" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 grid-overlay opacity-30" />

      {/* Ambient Gradient Orbs */}
      {/* Orb 1: Blue Purple glow top-left */}
      <div className="absolute top-[5%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-electric-blue/10 via-ia-violet/5 to-transparent blur-[120px]" />
      
      {/* Orb 2: Energy Cyan bottom-right */}
      <div className="absolute bottom-[10%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-energy-cyan/8 via-electric-blue/3 to-transparent blur-[140px]" />

      {/* Orb 3: Solar Gold soft center reflection */}
      <div className="absolute top-[40%] left-[25%] w-[450px] h-[450px] rounded-full bg-solar-gold/4 blur-[130px] animate-pulse-slow" />

      {/* Orb 4: Energy Green deep field */}
      <div className="absolute top-[65%] -left-[5%] w-[400px] h-[400px] rounded-full bg-energy-green/4 blur-[110px]" />

      {/* Constellation Star Generator */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animation: `pulse-glow ${star.duration}s infinite ease-in-out`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>

      {/* Subtle scanline overlay to enhance tech mood */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-15" />
    </div>
  );
}
