import { ArrowRight, Briefcase, Code2, Gamepad2, GraduationCap, Home, Moon, Sparkles, Zap } from "lucide-react";

interface DivisionPresentation {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  imageLabel: string;
  icon: "code" | "briefcase" | "graduation" | "home" | "moon" | "gamepad";
  accent: string;
  pillars: string[];
  capabilities: string[];
  audience: string;
  projection: string;
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
    icon: "code",
    accent: "from-violet-500 via-cyan-400 to-blue-500",
    pillars: ["Desarrollo web y plataformas", "Automatización de procesos", "Agentes IA y asistentes", "Integraciones y APIs"],
    capabilities: [
      "Crear MVPs y prototipos funcionales.",
      "Diseñar paneles, dashboards y herramientas internas.",
      "Construir asistentes con lógica, memoria y flujos controlados.",
      "Conectar servicios externos mediante APIs, webhooks y procesos automatizados.",
    ],
    audience: "Emprendedores, empresas, equipos operativos y proyectos que necesitan pasar de una idea a una solución digital visible.",
    projection: "Esta división será la base técnica para escalar ORBI hacia productos SaaS, agentes especializados y soluciones a medida.",
  },
  {
    id: "corporate",
    eyebrow: "02 / ORBI CORPORATE SYSTEM",
    title: "Corporate System",
    subtitle: "Soluciones inteligentes para empresas, operaciones, reportabilidad y trabajo técnico real.",
    description:
      "ORBI Corporate System reúne las soluciones orientadas al mundo empresarial: control operacional, documentos, inspecciones, mantenimiento, datos, reportes, productividad y asistentes especializados. Su foco es llevar inteligencia artificial y automatización a procesos donde todavía se pierde tiempo en tareas manuales, reportes repetitivos o información dispersa.",
    imageLabel: "Empresas / Operación / Datos",
    icon: "briefcase",
    accent: "from-emerald-500 via-cyan-400 to-teal-500",
    pillars: ["Operación y mantenimiento", "Reportabilidad inteligente", "Documentos y trazabilidad", "Asistentes corporativos"],
    capabilities: [
      "Digitalizar flujos de trabajo internos.",
      "Ordenar información técnica, documental y operacional.",
      "Crear reportes y fichas para clientes, supervisores o gerencias.",
      "Apoyar decisiones con datos, contexto e inteligencia aplicada.",
    ],
    audience: "Empresas, áreas técnicas, operaciones de terreno, energía, mantenimiento, administración y equipos que necesitan mayor control y eficiencia.",
    projection: "Corporate System puede convertirse en una suite empresarial modular con asistentes, dashboards y flujos para distintos rubros.",
  },
  {
    id: "academy",
    eyebrow: "03 / ORBI ACADEMY",
    title: "Academy",
    subtitle: "Educación técnica clara, visual y accionable para aprender en la era de la IA.",
    description:
      "ORBI Academy es la división educativa del ecosistema. Su misión es transformar conocimiento técnico en contenido simple, visual y útil para todo público. Aquí viven series como Solar Academy, microcontenidos, explicaciones desde cero y rutas de aprendizaje que conectan tecnología, energía, IA y emprendimiento.",
    imageLabel: "Educación / Shorts / Microlearning",
    icon: "graduation",
    accent: "from-cyan-500 via-blue-400 to-sky-500",
    pillars: ["Energía solar desde cero", "Educación con IA", "Microlearning", "Contenido técnico simple"],
    capabilities: [
      "Explicar temas complejos en lenguaje cotidiano.",
      "Crear series educativas cortas para redes sociales.",
      "Convertir experiencia técnica en contenido formativo.",
      "Construir comunidad alrededor del aprendizaje práctico.",
    ],
    audience: "Personas que quieren aprender, seguidores de contenido técnico, estudiantes, técnicos, emprendedores y público general.",
    projection: "Academy puede evolucionar hacia cursos, guías, rutas de aprendizaje y experiencias educativas interactivas.",
  },
  {
    id: "services",
    eyebrow: "04 / ORBI INSTALACIONES Y SERVICIOS",
    title: "Instalaciones y Servicios",
    subtitle: "Soluciones fotovoltaicas, domótica, asesoría técnica y servicios aplicados en terreno.",
    description:
      "ORBI Instalaciones y Servicios conecta el ecosistema digital con necesidades físicas reales: energía solar residencial, sistemas híbridos, off-grid, bombeo rural, automatización del hogar, asesoría técnica y levantamiento de necesidades. Es la división que aterriza ORBI en proyectos concretos para personas, hogares y pequeños negocios.",
    imageLabel: "Solar / Domótica / Terreno",
    icon: "home",
    accent: "from-amber-400 via-yellow-300 to-cyan-400",
    pillars: ["Sistemas solares", "Bombeo rural", "Automatización del hogar", "Asesoría técnica"],
    capabilities: [
      "Orientar soluciones fotovoltaicas según consumo y necesidad.",
      "Explicar diferencias entre sistemas on-grid, híbridos y off-grid.",
      "Apoyar proyectos de domótica, monitoreo y control básico.",
      "Conectar diagnóstico técnico con propuestas realistas.",
    ],
    audience: "Hogares, familias, pequeños negocios, parcelas, zonas rurales y personas que buscan independencia energética o automatización simple.",
    projection: "Esta división puede convertirse en el puente entre contenido educativo, asesoría digital y servicios reales en terreno.",
  },
  {
    id: "sleep",
    eyebrow: "05 / ORBI SLEEP FREQUENCIES",
    title: "Sleep Frequencies",
    subtitle: "Tecnología también para descansar, desconectar y recuperar calma mental.",
    description:
      "ORBI Sleep Frequencies nace como una línea de bienestar digital dentro del ecosistema. Su propósito es crear frecuencias, ambientes sonoros y piezas audiovisuales para descansar en un mundo saturado de información. No reemplaza soluciones médicas; es un espacio creativo gratuito para acompañar momentos de calma, sueño, concentración o desconexión.",
    imageLabel: "Bienestar / Frecuencias / Descanso",
    icon: "moon",
    accent: "from-blue-500 via-indigo-400 to-cyan-300",
    pillars: ["Frecuencias para descanso", "Ambientes sonoros", "Contenido gratuito", "Bienestar digital"],
    capabilities: [
      "Crear sonidos de descanso y relajación.",
      "Desarrollar experiencias audiovisuales para redes y YouTube.",
      "Recibir ideas de la comunidad: lluvia, mar, tonos suaves o ambientes específicos.",
      "Usar la tecnología como apoyo emocional y creativo.",
    ],
    audience: "Personas que buscan descansar, dormir mejor, desconectar del exceso de información o usar tecnología con un propósito más humano.",
    projection: "Puede crecer como biblioteca gratuita de frecuencias, playlists y experiencias sonoras de ORBI.",
  },
  {
    id: "games",
    eyebrow: "06 / ORBI GAME SYSTEM",
    title: "Game System",
    subtitle: "Historias, mundos, personajes y experiencias interactivas conectadas al universo ORBI.",
    description:
      "ORBI Game System es la división creativa orientada a videojuegos, narrativa, mundos interactivos, prototipos lúdicos y experiencias gamificadas. Su objetivo es convertir ideas, personajes y sistemas del universo ORBI en experiencias jugables o interactivas que puedan enseñar, entretener y expandir la identidad de marca.",
    imageLabel: "Gaming / Mundos / Experiencias",
    icon: "gamepad",
    accent: "from-rose-500 via-violet-500 to-blue-500",
    pillars: ["Videojuegos", "Narrativa interactiva", "Personajes ORBI", "Gamificación"],
    capabilities: [
      "Diseñar conceptos de juegos y mundos narrativos.",
      "Crear prototipos jugables o experiencias web interactivas.",
      "Transformar aprendizaje en dinámicas gamificadas.",
      "Expandir el universo ORBI con personajes, facciones e historias.",
    ],
    audience: "Comunidades creativas, seguidores de tecnología, educación gamificada, prototipos de juego y experiencias interactivas.",
    projection: "Game System puede convertirse en una línea de productos creativos, demos interactivas y mundos educativos conectados al ecosistema.",
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
    case "moon":
      return <Moon className={className} />;
    case "gamepad":
      return <Gamepad2 className={className} />;
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

        <div className="mt-16 space-y-10">
          {divisionPresentations.map((division, index) => (
            <article
              key={division.id}
              id={`orbi-presentation-${division.id}`}
              className="orbitron-panel scroll-mt-28 overflow-hidden p-0"
            >
              <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative min-h-[360px] overflow-hidden border-b border-white/10 bg-slate-950 lg:border-b-0 lg:border-r">
                  <div className={`absolute inset-0 bg-gradient-to-br ${division.accent} opacity-18`} aria-hidden="true" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_28%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.08),rgba(2,6,23,0.9))]" aria-hidden="true" />
                  <div className="absolute inset-0 grid-overlay opacity-[0.09]" aria-hidden="true" />
                  <div className="relative flex h-full min-h-[360px] flex-col justify-between p-7 sm:p-9">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.08] text-white shadow-2xl backdrop-blur-2xl">
                        <DivisionIcon icon={division.icon} />
                      </div>
                      <span className="rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/80 backdrop-blur-2xl">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div>
                      <div className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/55">{division.imageLabel}</div>
                      <h3 className="mt-4 font-space text-4xl font-black tracking-tight text-white sm:text-5xl">{division.title}</h3>
                      <p className="mt-4 max-w-xl text-base font-bold leading-7 text-cyan-50/90">{division.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="p-7 sm:p-9">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">{division.eyebrow}</p>
                  <p className="mt-5 text-sm leading-8 text-slate-300 sm:text-base">{division.description}</p>

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

                  <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                    <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white">Capacidades principales</h4>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {division.capabilities.map((capability) => (
                        <div key={capability} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm leading-6 text-slate-300">
                          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
                          <span>{capability}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.045] p-5">
                    <h4 className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">Proyección dentro de ORBI</h4>
                    <p className="mt-3 text-sm leading-7 text-emerald-50/82">{division.projection}</p>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <a href="#orbi-en-video" className="orbitron-primary-action">
                      Ver video relacionado
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a href="#proyectos" className="orbitron-secondary-action">
                      Ver catálogo técnico
                    </a>
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
