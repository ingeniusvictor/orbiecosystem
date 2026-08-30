import { ArrowRight, Film, Play, Sparkles, Video } from "lucide-react";

interface OrbiVideoSectionProps {
  onPlayVideo: (compId: string) => void;
}

interface VideoCard {
  id: string;
  title: string;
  description: string;
  badge: string;
  videoComponentId?: string;
  status: "available" | "soon";
}

const videoCards: VideoCard[] = [
  {
    id: "ecosystem",
    title: "ORBI Ecosystem en 60 segundos",
    description: "Una presentación rápida para entender la visión completa: IA, software, energía, educación, automatización y contenido tecnológico.",
    badge: "Video principal",
    videoComponentId: "eco-general",
    status: "available",
  },
  {
    id: "corporate",
    title: "ORBI Corporate System",
    description: "La capa empresarial de ORBI para operaciones, control, datos, procesos internos y soluciones aplicadas a organizaciones.",
    badge: "División empresarial",
    videoComponentId: "orbi-corp",
    status: "available",
  },
  {
    id: "development",
    title: "ORBI Development System",
    description: "La división enfocada en desarrollo, automatización, agentes, plataformas web, integraciones y sistemas inteligentes.",
    badge: "Software + agentes",
    videoComponentId: "orbi-development",
    status: "soon",
  },
  {
    id: "game",
    title: "ORBI Game System",
    description: "La línea creativa para videojuegos, experiencias interactivas, mundos narrativos y nuevas formas de aprendizaje gamificado.",
    badge: "Gaming + mundos",
    videoComponentId: "orbi-games",
    status: "soon",
  },
  {
    id: "radar",
    title: "ORBI Radar IA & Tecnología",
    description: "El frente de noticias, análisis y divulgación para entender los avances de IA y tecnología con lenguaje simple.",
    badge: "Noticias + análisis",
    status: "soon",
  },
  {
    id: "academy",
    title: "ORBI Solar Academy",
    description: "Contenido educativo para aprender energía solar desde cero, entender sistemas fotovoltaicos y tomar mejores decisiones.",
    badge: "Educación solar",
    status: "soon",
  },
  {
    id: "sleep",
    title: "ORBI Sleep Frequencies",
    description: "La línea de bienestar digital creada para descansar, desconectar y usar la tecnología también como espacio de calma.",
    badge: "Bienestar digital",
    status: "soon",
  },
];

export default function OrbiVideoSection({ onPlayVideo }: OrbiVideoSectionProps) {
  const featured = videoCards[0];
  const secondaryCards = videoCards.slice(1);

  return (
    <section id="orbi-en-video" className="relative overflow-hidden py-24 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(168,85,247,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.22),rgba(2,6,23,0.92))]" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-px w-[min(980px,calc(100%-2rem))] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" aria-hidden="true" />
      <div className="absolute bottom-0 left-1/2 h-px w-[min(980px,calc(100%-2rem))] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-300/25 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.12)] backdrop-blur-2xl">
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            ORBI en Video
          </div>
          <h2 className="mt-6 font-space text-4xl font-black tracking-tight text-white sm:text-5xl">
            Mira ORBI explicado en formato rápido.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            La mayoría de las personas entiende mejor cuando ve una historia. Esta sección conecta la plataforma con videos cortos, presentaciones y contenido educativo de ORBI Ecosystem.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <article className="group relative overflow-hidden rounded-[2rem] border border-cyan-300/18 bg-white/[0.045] p-6 shadow-[0_22px_90px_rgba(8,47,73,0.22)] backdrop-blur-2xl sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.16),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-8">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 ring-1 ring-cyan-200/15">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    {featured.badge}
                  </span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-emerald-300/15">
                    Disponible
                  </span>
                </div>

                <div className="mt-10 aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-cyan-950/30">
                  <div className="relative flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.26),transparent_33%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.72),rgba(8,47,73,0.78))]">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => onPlayVideo(featured.videoComponentId ?? "eco-general")}
                      className="group/play relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-2xl transition hover:scale-105 hover:bg-white/16"
                      aria-label={`Ver ${featured.title}`}
                    >
                      <span className="absolute inset-0 rounded-full bg-cyan-300/20 blur-2xl transition group-hover/play:bg-cyan-200/30" aria-hidden="true" />
                      <Play className="relative z-10 ml-1 h-10 w-10 fill-current" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-8 font-space text-3xl font-black text-white">{featured.title}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{featured.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => onPlayVideo(featured.videoComponentId ?? "eco-general")} className="orbitron-primary-action">
                  Ver video principal
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a href="https://www.youtube.com/@ingeniusvictor" target="_blank" rel="noreferrer" className="orbitron-secondary-action">
                  Canal YouTube
                </a>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {secondaryCards.map((card) => {
              const isAvailable = card.status === "available" && card.videoComponentId;

              return (
                <article key={card.id} className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-200/22 hover:bg-white/[0.055]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_38%)] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white/[0.06] px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-200 ring-1 ring-white/10">
                        {card.badge}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] ring-1 ${isAvailable ? "bg-emerald-400/10 text-emerald-200 ring-emerald-300/15" : "bg-amber-300/10 text-amber-100 ring-amber-200/15"}`}>
                        {isAvailable ? "Disponible" : "Próximamente"}
                      </span>
                    </div>
                    <h3 className="mt-5 font-space text-xl font-black leading-tight text-white">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
                    <button
                      type="button"
                      onClick={() => isAvailable && onPlayVideo(card.videoComponentId as string)}
                      disabled={!isAvailable}
                      className={`mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] transition ${isAvailable ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-200/18 hover:bg-cyan-300/16" : "cursor-not-allowed bg-white/[0.04] text-slate-500 ring-1 ring-white/[0.06]"}`}
                    >
                      <Film className="h-3.5 w-3.5" aria-hidden="true" />
                      {isAvailable ? "Ver video" : "En preparación"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
