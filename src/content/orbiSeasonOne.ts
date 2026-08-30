export type OrbiSeasonOnePortal = {
  id: string;
  label: string;
  name: string;
  headline: string;
  description: string;
  accent: "cyan" | "violet" | "emerald" | "amber" | "rose" | "blue" | "slate";
  icon: "code" | "briefcase" | "graduation" | "zap" | "moon" | "gamepad" | "newspaper";
  status: "Activo" | "En expansión" | "Contenido listo" | "Video-ready";
  videoStatus: "ready" | "pending";
  primaryCta: string;
};

export const orbiSeasonOnePortals: OrbiSeasonOnePortal[] = [
  {
    id: "development",
    label: "01 / ORBI DEVELOPMENT SYSTEM",
    name: "Development System",
    headline: "Software, APIs, agentes y arquitectura IA.",
    description:
      "La división donde ORBI convierte ideas en productos digitales: aplicaciones, conectores, sistemas internos, prototipos, APIs y automatización inteligente.",
    accent: "violet",
    icon: "code",
    status: "Activo",
    videoStatus: "ready",
    primaryCta: "Explorar desarrollo"
  },
  {
    id: "corporate",
    label: "02 / ORBI CORPORATE SYSTEM",
    name: "Corporate System",
    headline: "Herramientas inteligentes para empresas reales.",
    description:
      "Soluciones para operación, mantenimiento, documentos, reportabilidad, inspecciones, productividad y asistencia IA aplicada al trabajo diario.",
    accent: "emerald",
    icon: "briefcase",
    status: "Activo",
    videoStatus: "ready",
    primaryCta: "Ver soluciones"
  },
  {
    id: "academy",
    label: "03 / ORBI ACADEMY",
    name: "Academy",
    headline: "Educación técnica clara, visual y accionable.",
    description:
      "La línea educativa de ORBI: energía solar desde cero, microcontenidos, formación práctica y conocimiento técnico presentado para todo público.",
    accent: "cyan",
    icon: "graduation",
    status: "Contenido listo",
    videoStatus: "ready",
    primaryCta: "Entrar a Academy"
  },
  {
    id: "services",
    label: "04 / ORBI INSTALACIONES Y SERVICIOS",
    name: "Instalaciones y Servicios",
    headline: "Soluciones fotovoltaicas, domótica y terreno.",
    description:
      "Servicios técnicos orientados a sistemas solares híbridos, off-grid, bombeo rural, automatización del hogar y asesoría aplicada a necesidades reales.",
    accent: "amber",
    icon: "zap",
    status: "En expansión",
    videoStatus: "ready",
    primaryCta: "Ver servicios"
  },
  {
    id: "sleep",
    label: "05 / ORBI SLEEP FREQUENCIES",
    name: "Sleep Frequencies",
    headline: "Tecnología también para descansar mejor.",
    description:
      "Frecuencias, ambientes sonoros y experiencias de descanso creadas para ayudar a desconectar en un mundo saturado de información.",
    accent: "blue",
    icon: "moon",
    status: "Contenido listo",
    videoStatus: "ready",
    primaryCta: "Escuchar frecuencias"
  },
  {
    id: "games",
    label: "06 / ORBI GAME SYSTEM",
    name: "Game System",
    headline: "Historias, mundos y experiencias interactivas.",
    description:
      "La división creativa del universo ORBI: videojuegos, personajes, narrativa energética, prototipos y mundos interactivos conectados con la marca.",
    accent: "rose",
    icon: "gamepad",
    status: "En expansión",
    videoStatus: "ready",
    primaryCta: "Explorar juegos"
  },
  {
    id: "news",
    label: "TRANSVERSAL / ORBI NEWS",
    name: "ORBI News",
    headline: "Radar de tecnología, IA, energía e innovación.",
    description:
      "Una capa transversal para publicar noticias, análisis y contexto tecnológico con voz ORBI, conectando actualidad con educación y oportunidades.",
    accent: "slate",
    icon: "newspaper",
    status: "Video-ready",
    videoStatus: "pending",
    primaryCta: "Leer noticias"
  }
];

export const orbiSeasonOneMetrics = [
  { value: "6+1", label: "divisiones conectadas" },
  { value: "24h", label: "enfoque launch-ready" },
  { value: "AI", label: "núcleo estratégico" },
  { value: "Video", label: "contenido como prueba" }
] as const;
