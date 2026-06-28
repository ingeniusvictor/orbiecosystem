import React from "react";

interface SectionVideoProps {
  src: string;
  title?: string;
  className?: string;
  videoClassName?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
}

export default function SectionVideo({
  src,
  title,
  className = "",
  videoClassName = "aspect-video object-cover",
  controls = false,
  autoPlay,
  loop,
  muted,
  poster
}: SectionVideoProps) {
  const shouldAutoPlay = autoPlay ?? !controls;
  const shouldLoop = loop ?? !controls;
  const shouldMute = muted ?? !controls;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl ${className}`}>
      {title && (
        <div className="absolute left-3 top-3 z-10 rounded-full border border-cyan-500/20 bg-slate-950/75 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-300 backdrop-blur">
          {title}
        </div>
      )}
      <video
        className={`block w-full ${videoClassName}`}
        controls={controls}
        autoPlay={shouldAutoPlay}
        muted={shouldMute}
        loop={shouldLoop}
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={src} type="video/mp4" />
        Tu navegador no soporta video HTML5.
      </video>
    </div>
  );
}
