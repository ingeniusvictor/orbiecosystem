import { ArrowRight, ExternalLink, Film, Link, ListVideo, Play, Sparkles, Video } from "lucide-react";

interface VideoCard {
  id: string;
  title: string;
  description: string;
  badge: string;
  youtubeUrl: string;
  youtubeSearchLabel: string;
  youtubeId: string;
  note?: string;
}

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@ingeniusvictor";
const YOUTUBE_PLAYLISTS_URL = "https://www.youtube.com/@ingeniusvictor/playlists";

const videoCards: VideoCard[] = [
  {
    id: "ecosystem",
    title: "ORBI Ecosystem en 60 segundos",
    description: "Video principal para entender la visión completa: IA, software, energía, educación, automatización, bienestar y contenido tecnológico.",
    badge: "Video principal",
    youtubeUrl: "https://youtu.be/wNcZ1Nwsdmw",
    youtubeSearchLabel: "ORBI Ecosystem",
    youtubeId: "wNcZ1Nwsdmw",
  },
  {
    id: "corporate",
    title: "ORBI Corporate System",
    description: "La capa empresarial de ORBI para operaciones, control, datos, procesos internos y soluciones aplicadas a organizaciones.",
    badge: "División empresarial",
    youtubeUrl: "https://youtube.com/shorts/IweGvQzgJ74",
    youtubeSearchLabel: "ORBI Corporate System",
    youtubeId: "IweGvQzgJ74",
  },
  {
    id: "development",
    title: "ORBI Development System",
    description: "La división enfocada en desarrollo, automatización, agentes, plataformas web, integraciones y sistemas inteligentes.",
    badge: "Software + agentes",
    youtubeUrl: "https://youtube.com/shorts/OBx8K2szN2w",
    youtubeSearchLabel: "ORBI Development System",
    youtubeId: "OBx8K2szN2w",
  },
  {
    id: "game",
    title: "ORBI Game System",
    description: "La línea creativa para videojuegos, experiencias interactivas, mundos narrativos y nuevas formas de aprendizaje gamificado.",
    badge: "Gaming + mundos",
    youtubeUrl: "https://youtube.com/shorts/LbBord2Zyzg",
    youtubeSearchLabel: "ORBI Game System",
    youtubeId: "LbBord2Zyzg",
  },
  {
    id: "radar",
    title: "ORBI Radar IA & Tecnología",
    description: "El frente de noticias, análisis y divulgación para entender los avances de IA y tecnología con lenguaje simple.",
    badge: "Noticias + análisis",
    youtubeUrl: "https://youtube.com/shorts/KF5PcJTaDt4",
    youtubeSearchLabel: "ORBI Radar IA Tecnología",
    youtubeId: "KF5PcJTaDt4",
  },
  {
    id: "academy",
    title: "ORBI Solar Academy",
    description: "Contenido educativo para aprender energía solar desde cero, entender sistemas fotovoltaicos y tomar mejores decisiones.",
    badge: "Educación solar",
    youtubeUrl: "https://youtube.com/shorts/hIjzC7QPmks",
    youtubeSearchLabel: "ORBI Solar Academy",
    youtubeId: "hIjzC7QPmks",
  },
  {
    id: "sleep",
    title: "ORBI Sleep Frequencies",
    description: "La línea de bienestar digital creada para descansar, desconectar y usar la tecnología también como espacio de calma.",
    badge: "Bienestar digital",
    youtubeUrl: "https://youtube.com/shorts/rPgN-aqTwjI",
    youtubeSearchLabel: "ORBI Sleep Frequencies",
    youtubeId: "rPgN-aqTwjI",
    note: "Serie publicada con 6 shorts disponibles en el canal.",
  },
];

const sleepFrequencyLinks = [
  { label: "S1", url: "https://youtube.com/shorts/rPgN-aqTwjI", id: "rPgN-aqTwjI" },
  { label: "S2", url: "https://youtube.com/shorts/NWV4r8MWOCM", id: "NWV4r8MWOCM" },
  { label: "S3", url: "https://youtube.com/shorts/3AT6ja7XXLY", id: "3AT6ja7XXLY" },
  { label: "S4", url: "https://youtube.com/shorts/HAiGOQfxfUc", id: "HAiGOQfxfUc" },
  { label: "S5", url: "https://youtube.com/shorts/XFvN0VrzBck", id: "XFvN0VrzBck" },
  { label: "S6", url: "https://youtube.com/shorts/tXQNUJ3g22s", id: "tXQNUJ3g22s" },
];

function getCardActionLabel(card: VideoCard) {
  return card.id === "sleep" ? "Ver serie" : "Ver en YouTube";
}

function YoutubeActionLink({ card, primary = false }: { card: VideoCard; primary?: boolean }) {
  const className = primary
    ? "orbitron-primary-action"
    : "mt-5 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-red-100 ring-1 ring-red-300/18 transition hover:bg-red-500/16";

  return (
    <a href={card.youtubeUrl} target="_blank" rel="noreferrer" className={className} aria-label={`Abrir ${card.title} en YouTube`}>
      {primary ? getCardActionLabel(card) : <Film className="h-3.5 w-3.5" aria-hidden="true" />}
      {primary ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : getCardActionLabel(card)}
    </a>
  );
}

export default function OrbiVideoSection() {
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
            ORBI en Video / YouTube
          </div>
          <h2 className="mt-6 font-space text-4xl font-black tracking-tight text-white sm:text-5xl">
            Mira ORBI desde el canal oficial.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            Los videos viven en YouTube para mantener la web liviana, aumentar reproducciones del canal y conectar cada división con contenido real publicado por ORBI Ecosystem.
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
                  <span className="rounded-full bg-red-500/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-red-100 ring-1 ring-red-300/15">
                    Fuente YouTube
                  </span>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200 ring-1 ring-emerald-300/15">
                    ID: {featured.youtubeId}
                  </span>
                </div>

                <a
                  href={featured.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-10 block aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60 shadow-2xl shadow-cyan-950/30 transition hover:scale-[1.01] hover:border-red-200/25"
                  aria-label={`Abrir ${featured.title} en YouTube`}
                >
                  <div className="relative flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.26),transparent_33%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.72),rgba(8,47,73,0.78))]">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:42px_42px] opacity-35" aria-hidden="true" />
                    <div className="absolute left-5 top-5 rounded-full bg-slate-950/45 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/70 ring-1 ring-white/10 backdrop-blur-2xl">
                      Link directo: {featured.youtubeId}
                    </div>
                    <span className="group/play relative flex h-24 w-24 items-center justify-center rounded-full bg-red-500/15 text-white ring-1 ring-red-200/25 backdrop-blur-2xl transition hover:scale-105 hover:bg-red-500/22">
                      <span className="absolute inset-0 rounded-full bg-red-500/20 blur-2xl transition group-hover/play:bg-red-400/30" aria-hidden="true" />
                      <Play className="relative z-10 ml-1 h-10 w-10 fill-current" aria-hidden="true" />
                    </span>
                  </div>
                </a>

                <h3 className="mt-8 font-space text-3xl font-black text-white">{featured.title}</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{featured.description}</p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4 backdrop-blur-2xl">
                  <div className="flex items-start gap-3">
                    <Link className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" aria-hidden="true" />
                    <p className="text-xs leading-6 text-slate-300">
                      Esta sección ya no usa VideoModal ni videos locales. Cada tarjeta abre un enlace real distinto de YouTube.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <YoutubeActionLink card={featured} primary />
                <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer" className="orbitron-secondary-action">
                  Canal YouTube
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <a href={YOUTUBE_PLAYLISTS_URL} target="_blank" rel="noreferrer" className="orbitron-secondary-action">
                  Playlists
                  <ListVideo className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {secondaryCards.map((card) => (
              <article key={card.id} className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-200/22 hover:bg-white/[0.055]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_38%)] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-full bg-white/[0.06] px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-200 ring-1 ring-white/10">
                      {card.badge}
                    </span>
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.14em] text-red-100 ring-1 ring-red-300/15">
                      ID: {card.youtubeId}
                    </span>
                  </div>
                  <h3 className="mt-5 font-space text-xl font-black leading-tight text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{card.description}</p>
                  {card.note && (
                    <div className="mt-4 rounded-2xl bg-emerald-400/10 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100 ring-1 ring-emerald-300/15">
                      {card.note}
                    </div>
                  )}
                  <div className="mt-4 rounded-2xl bg-slate-950/25 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 ring-1 ring-white/[0.06]">
                    Buscar: {card.youtubeSearchLabel}
                  </div>
                  <YoutubeActionLink card={card} />
                  {card.id === "sleep" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sleepFrequencyLinks.map((item) => (
                        <a
                          key={item.url}
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-white/[0.045] px-2.5 py-1 font-mono text-[8px] font-black uppercase tracking-[0.12em] text-slate-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
                          title={item.id}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
