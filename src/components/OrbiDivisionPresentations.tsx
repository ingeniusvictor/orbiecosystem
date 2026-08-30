import { ArrowRight, Briefcase, Code2, Gamepad2, GraduationCap, Home, Moon, Newspaper, Sparkles, Zap } from "lucide-react";

interface DivisionPresentation {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  imageLabel: string;
  imagePath: string;
  imageAlt: string;
  icon: "code" | "briefcase" | "graduation" | "home" | "solar" | "moon" | "gamepad" | "radar";
  accent: string;
  glow: string;
  pillars: string[];
  capabilities: string[];
  audience: string;
  projection: string;
  videoAnchor: string;
}

const divisionPresentations: DivisionPresentation[] = [
  {
    id: "development",
    eyebrow: "01 / ORBI DEVELOPMENT SYSTEM",
    title: "Development System",
    subtitle: "La fábrica tecnológica donde las ideas se convierten en productos digitales reales.",
    description:
      "ORBI Development System es la división dedicada a diseñar, construir y evolucionar software, automatizaciones, agentes de inteligencia artificial, conectores, prototipos, paneles web y sistemas internos. Su objetivo es transformar necesidades reales en herramientas funcionales, evitando la teoría excesiva y priorizando soluciones que se puedan probar, mostrar y escalar.",
    imageLabel: "Software / APIs / Agentes IA",
    imagePath: "/assets/divisions/orbi-development-system.png",
    imageAlt: "Presentación visual de ORBI Development System",
    icon: "code",
    accent: "from-violet-500 via-cyan-400 to-blue-500",
    glow: "shadow-violet-950/45",
    pillars: ["Desarrollo web y plataformas", "Automatización de procesos", "Agentes IA y asistentes", "Integraciones y APIs"],
    capabilities: [
      "Crear MVPs y prototipos funcionales.",
      "Diseñar paneles, dashboards y herramientas internas.",
      "Construir asistentes con lógica, memoria y flujos controlados.",
      "Conectar servicios externos mediante APIs, webhooks y procesos automatizados.",
    ],
    audience: "Emprendedores, empresas, equipos operativos y proyectos que necesitan pasar de una idea a una solución digital visible.",
    projection: "Esta división será la base técnica para escalar ORBI hacia productos SaaS, agentes especializados y soluciones a medida.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "corporate",
    eyebrow: "02 / ORBI CORPORATE SYSTEM",
    title: "Corporate System",
    subtitle: "Soluciones inteligentes para empresas, operaciones, reportabilidad y trabajo técnico real.",
    description:
      "ORBI Corporate System reúne las soluciones orientadas al mundo empresarial: control operacional, documentos, inspecciones, mantenimiento, datos, reportes, productividad y asistentes especializados. Su foco es llevar inteligencia artificial y automatización a procesos donde todavía se pierde tiempo en tareas manuales, reportes repetitivos o información dispersa.",
    imageLabel: "Empresas / Operación / Datos",
    imagePath: "/assets/divisions/orbi-corporate-system.png",
    imageAlt: "Presentación visual de ORBI Corporate System",
    icon: "briefcase",
    accent: "from-emerald-500 via-cyan-400 to-teal-500",
    glow: "shadow-emerald-950/45",
    pillars: ["Operación y mantenimiento", "Reportabilidad inteligente", "Documentos y trazabilidad", "Asistentes corporativos"],
    capabilities: [
      "Digitalizar flujos de trabajo internos.",
      "Ordenar información técnica, documental y operacional.",
      "Crear reportes y fichas para clientes, supervisores o gerencias.",
      "Apoyar decisiones con datos, contexto e inteligencia aplicada.",
    ],
    audience: "Empresas, áreas técnicas, operaciones de terreno, energía, mantenimiento, administración y equipos que necesitan mayor control y eficiencia.",
    projection: "Corporate System puede convertirse en una suite empresarial modular con asistentes, dashboards y flujos para distintos rubros.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "academy",
    eyebrow: "03 / ORBI ACADEMY",
    title: "Academy",
    subtitle: "Educación técnica clara, visual y accionable para aprender en la era de la IA.",
    description:
      "ORBI Academy es la división educativa del ecosistema. Su misión es transformar conocimiento técnico en contenido simple, visual y útil para todo público. Aquí viven series como Solar Academy, microcontenidos, explicaciones desde cero y rutas de aprendizaje que conectan tecnología, energía, IA y emprendimiento.",
    imageLabel: "Educación / Shorts / Microlearning",
    imagePath: "/assets/divisions/orbi-academy.png",
    imageAlt: "Presentación visual de ORBI Academy",
    icon: "graduation",
    accent: "from-amber-400 via-cyan-400 to-emerald-400",
    glow: "shadow-amber-950/45",
    pillars: ["Energía solar desde cero", "Educación con IA", "Microlearning", "Contenido técnico simple"],
    capabilities: [
      "Explicar temas complejos en lenguaje cotidiano.",
      "Crear series educativas cortas para redes sociales.",
      "Convertir experiencia técnica en contenido formativo.",
      "Construir comunidad alrededor del aprendizaje práctico.",
    ],
    audience: "Personas que quieren aprender, seguidores de contenido técnico, estudiantes, técnicos, emprendedores y público general.",
    projection: "Academy puede evolucionar hacia cursos, guías, rutas de aprendizaje y experiencias educativas interactivas.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "services",
    eyebrow: "04 / ORBI SERVICIOS FOTOVOLTAICOS",
    title: "Servicios Fotovoltaicos",
    subtitle: "Instalación de energía solar para hogares, bombeo rural y soluciones energéticas reales.",
    description:
      "ORBI Servicios Fotovoltaicos conecta el ecosistema con necesidades energéticas concretas: sistemas solares para viviendas, soluciones híbridas, off-grid, bombeo rural, evaluación técnica, instalación y acompañamiento. Es la línea que convierte el conocimiento solar en proyectos aplicables para hogares, parcelas y pequeños negocios.",
    imageLabel: "Solar / Bombeo / Terreno",
    imagePath: "/assets/divisions/orbi-solar-services.png",
    imageAlt: "Presentación visual de ORBI Servicios Fotovoltaicos",
    icon: "solar",
    accent: "from-lime-400 via-yellow-300 to-cyan-400",
    glow: "shadow-lime-950/45",
    pillars: ["Sistemas solares", "Bombeo rural", "Evaluación técnica", "Instalación y puesta en marcha"],
    capabilities: [
      "Orientar soluciones fotovoltaicas según consumo y necesidad.",
      "Explicar diferencias entre sistemas on-grid, híbridos y off-grid.",
      "Acompañar proyectos de bombeo solar y autonomía energética.",
      "Conectar diagnóstico técnico con propuestas realistas.",
    ],
    audience: "Hogares, familias, pequeños negocios, parcelas, zonas rurales y personas que buscan independencia energética o mejor uso de la energía.",
    projection: "Esta división será el puente entre educación solar, asesoría digital y servicios técnicos reales en terreno.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "automation",
    eyebrow: "05 / ORBI AUTOMATIZACIÓN DEL HOGAR",
    title: "Automatización Inteligente",
    subtitle: "Iluminación smart, control por voz, hogares conectados y soporte local.",
    description:
      "ORBI Automatización Inteligente del Hogar se enfoca en transformar espacios cotidianos con tecnología simple y útil: interruptores smart, iluminación inteligente, integración con Alexa, escenas, rutinas, confort, eficiencia y configuración técnica. Su valor está en hacer que la domótica sea práctica, comprensible y cercana.",
    imageLabel: "Domótica / Alexa / Hogar conectado",
    imagePath: "/assets/divisions/orbi-home-automation.png",
    imageAlt: "Presentación visual de ORBI Automatización Inteligente del Hogar",
    icon: "home",
    accent: "from-cyan-400 via-blue-500 to-violet-500",
    glow: "shadow-cyan-950/45",
    pillars: ["Iluminación inteligente", "Control por voz", "Escenas y rutinas", "Instalación y configuración"],
    capabilities: [
      "Diseñar soluciones básicas de hogar conectado.",
      "Configurar iluminación smart, asistentes y rutinas.",
      "Mejorar confort y eficiencia en espacios reales.",
      "Apoyar al usuario con instalación, conexión y uso cotidiano.",
    ],
    audience: "Familias, hogares, departamentos, pequeños espacios comerciales y personas que quieren automatizar sin complicarse técnicamente.",
    projection: "Automatización puede crecer como servicio local, paquete residencial y puente hacia futuras experiencias de hogar inteligente ORBI.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "sleep",
    eyebrow: "06 / ORBI SLEEP FREQUENCIES",
    title: "Sleep Frequencies",
    subtitle: "Tecnología también para descansar, desconectar y recuperar calma mental.",
    description:
      "ORBI Sleep Frequencies nace como una línea de bienestar digital dentro del ecosistema. Su propósito es crear frecuencias, ambientes sonoros y piezas audiovisuales para descansar en un mundo saturado de información. No reemplaza soluciones médicas; es un espacio creativo gratuito para acompañar momentos de calma, sueño, concentración o desconexión.",
    imageLabel: "Bienestar / Frecuencias / Descanso",
    imagePath: "/assets/divisions/orbi-sleep-frequencies.png",
    imageAlt: "Presentación visual de ORBI Sleep Frequencies",
    icon: "moon",
    accent: "from-blue-500 via-indigo-400 to-fuchsia-400",
    glow: "shadow-indigo-950/45",
    pillars: ["Frecuencias para descanso", "Ambientes sonoros", "Contenido gratuito", "Bienestar digital"],
    capabilities: [
      "Crear sonidos de descanso y relajación.",
      "Desarrollar experiencias audiovisuales para redes y YouTube.",
      "Recibir ideas de la comunidad: lluvia, mar, tonos suaves o ambientes específicos.",
      "Usar la tecnología como apoyo emocional y creativo.",
    ],
    audience: "Personas que buscan descansar, dormir mejor, desconectar del exceso de información o usar tecnología con un propósito más humano.",
    projection: "Puede crecer como biblioteca gratuita de frecuencias, playlists y experiencias sonoras de ORBI.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "games",
    eyebrow: "07 / ORBI GAME SYSTEM",
    title: "Game System",
    subtitle: "Historias, mundos, personajes y experiencias interactivas conectadas al universo ORBI.",
    description:
      "ORBI Game System es la división creativa orientada a videojuegos, narrativa, mundos interactivos, prototipos lúdicos y experiencias gamificadas. Su objetivo es convertir ideas, personajes y sistemas del universo ORBI en experiencias jugables o interactivas que puedan enseñar, entretener y expandir la identidad de marca.",
    imageLabel: "Gaming / Mundos / Experiencias",
    imagePath: "/assets/divisions/orbi-game-system.png",
    imageAlt: "Presentación visual de ORBI Game System",
    icon: "gamepad",
    accent: "from-blue-500 via-cyan-400 to-violet-500",
    glow: "shadow-blue-950/45",
    pillars: ["Videojuegos", "Narrativa interactiva", "Personajes ORBI", "Gamificación"],
    capabilities: [
      "Diseñar conceptos de juegos y mundos narrativos.",
      "Crear prototipos jugables o experiencias web interactivas.",
      "Transformar aprendizaje en dinámicas gamificadas.",
      "Expandir el universo ORBI con personajes, facciones e historias.",
    ],
    audience: "Comunidades creativas, seguidores de tecnología, educación gamificada, prototipos de juego y experiencias interactivas.",
    projection: "Game System puede convertirse en una línea de productos creativos, demos interactivas y mundos educativos conectados al ecosistema.",
    videoAnchor: "orbi-en-video",
  },
  {
    id: "radar",
    eyebrow: "08 / ORBI RADAR IA & TECNOLOGÍA",
    title: "Radar IA & Tecnología",
    subtitle: "Información que conecta. Conocimiento que transforma.",
    description:
      "ORBI Radar IA & Tecnología funciona como el frente de información, análisis y divulgación del ecosistema. Su misión es investigar avances, filtrar ruido, explicar herramientas, detectar oportunidades y transformar tendencias tecnológicas en contenido comprensible para profesionales, estudiantes, empresas y emprendedores.",
    imageLabel: "IA / Noticias / Tendencias",
    imagePath: "/assets/divisions/orbi-radar-ia-tecnologia.png",
    imageAlt: "Presentación visual de ORBI Radar IA y Tecnología",
    icon: "radar",
    accent: "from-cyan-400 via-blue-500 to-sky-400",
    glow: "shadow-cyan-950/45",
    pillars: ["Investigación", "Análisis", "Filtrado", "Comunicación"],
    capabilities: [
      "Monitorear avances globales de IA y tecnología.",
      "Analizar plataformas, modelos y herramientas emergentes.",
      "Traducir información técnica en contenido simple y accionable.",
      "Apoyar decisiones informadas dentro de la comunidad ORBI.",
    ],
    audience: "Profesionales, estudiantes, empresas y emprendedores que quieren entender la tecnología sin perderse entre ruido, hype y exceso de información.",
    projection: "Radar puede convertirse en una capa editorial constante para alimentar noticias, videos, análisis y futuras oportunidades para ORBI.",
    videoAnchor: "orbi-en-video",
  },
];

function DivisionIcon({ icon }: { icon: DivisionPresentation["icon"] }) {
  const className = "h-7 w-7";

  switch (icon) {
    case "code":
      return <Code2 className={className} />;
    case "briefcase":
      return <Briefcase className={className} />;
    case "graduation":
      return <GraduationCap className={className} />;
    case "home":
      return <Home className={className} />;
    case "solar":
      return <Zap className={className} />;
    case "moon":
      return <Moon className={className} />;
    case "gamepad":
      return <Gamepad2 className={className} />;
    case "radar":
      return <Newspaper className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export default function OrbiDivisionPresentations() {
  return (
    <section id="orbi-presentaciones" className="relative overflow-hidden border-y border-white/5 bg-[#050816] py-24 sm:py-28">
      <div className="absolute inset-0 grid-overlay opacity-[0.045]" aria-hidden="true" />
      <div className="absolute left-0 top-20 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-20 right-0 h-[32rem] w-[32rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="orbitron-chip inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ORBI PRESENTATIONS / DIVISION DOSSIERS</span>
          </div>
          <h2 className="mt-6 orbitron-title">Presentaciones detalladas de cada división ORBI.</h2>
          <p className="mt-5 orbitron-subtitle">
            Una capa tipo exposición para explicar con más profundidad qué hace cada división, a quién sirve, qué puede construir y cómo se proyecta dentro del ecosistema.
          </p>
        </div>

        <nav aria-label="Navegación rápida de dossiers ORBI" className="sticky top-24 z-30 mx-auto mt-10 max-w-6xl rounded-[1.75rem] border border-white/10 bg-slate-950/72 p-3 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
            <span className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-cyan-200">Acceso rápido</span>
            <span className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">Selecciona una división</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {divisionPresentations.map((division, index) => (
              <a
                key={division.id}
                href={`#orbi-presentation-${division.id}`}
                className="group inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3.5 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${division.accent} shadow-lg`} aria-hidden="true" />
                <span className="text-slate-500 group-hover:text-cyan-200">{String(index + 1).padStart(2, "0")}</span>
                <span>{division.title}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="mt-12 space-y-12">
          {divisionPresentations.map((division, index) => (
            <article
              key={division.id}
              id={`orbi-presentation-${division.id}`}
              className="orbitron-panel scroll-mt-44 overflow-hidden p-0"
            >
              <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
                <div className={`relative overflow-hidden border-b border-white/10 bg-slate-950 shadow-2xl ${division.glow} xl:border-b-0 xl:border-r`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${division.accent} opacity-18`} aria-hidden="true" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.82))]" aria-hidden="true" />
                  <div className="relative z-10 flex min-h-[280px] items-center justify-center p-3 sm:min-h-[360px] sm:p-4 lg:min-h-[430px] xl:min-h-full xl:p-5">
                    <img
                      src={division.imagePath}
                      alt={division.imageAlt}
                      loading={index < 2 ? "eager" : "lazy"}
                      className="mx-auto h-auto w-full max-w-[94%] max-h-[260px] object-contain opacity-95 drop-shadow-2xl transition duration-500 hover:scale-[1.01] sm:max-h-[340px] lg:max-h-[410px] xl:max-h-[520px]"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-white/15 bg-slate-950/55 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-2xl">
                        {division.imageLabel}
                      </span>
                      <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.08] px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-2xl">
                        Visual completo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative p-7 sm:p-9">
                  <div className={`absolute right-0 top-0 h-44 w-44 rounded-full bg-gradient-to-br ${division.accent} opacity-10 blur-3xl`} aria-hidden="true" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.08] text-white shadow-2xl backdrop-blur-2xl">
                        <DivisionIcon icon={division.icon} />
                      </div>
                      <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-2xl">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="mt-8 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">{division.eyebrow}</p>
                    <h3 className="mt-4 font-space text-4xl font-black tracking-tight text-white sm:text-5xl">{division.title}</h3>
                    <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-cyan-50/90">{division.subtitle}</p>
                    <p className="mt-6 text-sm leading-8 text-slate-300 sm:text-base">{division.description}</p>

                    <div className="mt-8 grid gap-5 md:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white">Pilares</h4>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {division.pillars.map((pillar) => (
                            <span key={pillar} className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-bold text-cyan-100">
                              {pillar}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                        <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white">Para quién</h4>
                        <p className="mt-4 text-sm leading-7 text-slate-300">{division.audience}</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/55 p-5">
                      <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white">Capacidades principales</h4>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {division.capabilities.map((capability) => (
                          <div key={capability} className="flex items-start gap-3 rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.06]">
                            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${division.accent}`} aria-hidden="true" />
                            <span className="text-sm leading-6 text-slate-300">{capability}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                      <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white">Proyección</h4>
                      <p className="mt-4 text-sm leading-7 text-slate-300">{division.projection}</p>
                    </div>

                    <div className="mt-7 flex flex-wrap gap-3">
                      <a href={`#${division.videoAnchor}`} className="orbitron-primary-action">
                        Ver video relacionado
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                      <a href="#proyectos" className="orbitron-secondary-action">
                        Ver catálogo técnico
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
