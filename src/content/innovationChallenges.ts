export type CompetitionStatus =
  | "preparing"
  | "submitted"
  | "under-review"
  | "selected"
  | "finalist"
  | "winner"
  | "not-selected"
  | "closed"
  | "archived";

export type CompetitionConfidentiality = "public" | "limited" | "private";

export type CompetitionTimelineEvent = {
  id: string;
  label: string;
  description?: string;
  date?: string;
  status: "complete" | "current" | "future";
};

export type CompetitionSubmission = {
  id: string;
  solutionName: string;
  challengeName?: string;
  status: CompetitionStatus;
  tagline?: string;
  description: string;
  problem?: string;
  solution?: string;
  aiRole?: string;
  capabilities: string[];
  technologies: string[];
  impactAreas: string[];
  confidentiality: CompetitionConfidentiality;
  productRoute?: string;
  demoStatus?: string;
  media?: {
    type: "video" | "image" | "deck" | "demo";
    title: string;
    url?: string;
    thumbnail?: string;
    confidentiality: CompetitionConfidentiality;
  }[];
};

export type InnovationChallenge = {
  id: string;
  slug: string;
  programName: string;
  organizer: string[];
  edition?: string;
  year: number;
  country?: string;
  status: CompetitionStatus;
  featured?: boolean;
  summary: string;
  description: string;
  categories: string[];
  confidentiality: CompetitionConfidentiality;
  officialUrl?: string;
  productRoute?: string;
  timeline: CompetitionTimelineEvent[];
  submissions: CompetitionSubmission[];
  lastUpdated: string;
};

export const competitionStatusLabels: Record<CompetitionStatus, string> = {
  preparing: "En preparación",
  submitted: "Postulada",
  "under-review": "En evaluación",
  selected: "Seleccionada",
  finalist: "Finalista",
  winner: "Ganadora",
  "not-selected": "No seleccionada",
  closed: "Convocatoria cerrada",
  archived: "Archivada",
};

export const innovationChallenges: InnovationChallenge[] = [
  {
    id: "parque-arauco-startup-challenge-2026",
    slug: "parque-arauco-startup-challenge-2026",
    programName: "Startup Challenge 2026 by Parque Arauco",
    organizer: ["Parque Arauco", "INNSPIRAL"],
    edition: "2026",
    year: 2026,
    country: "Chile",
    status: "closed",
    featured: false,
    summary:
      "Participación de ORBI Ecosystem en desafíos de retail, producción digital con IA generativa e innovación para construcción.",
    description:
      "Convocatoria de innovación abierta donde ORBI presentó dos propuestas complementarias: una orientada a autonomía creativa con IA generativa y otra enfocada en inteligencia operacional para actividades de terreno.",
    categories: ["Retail", "Inteligencia artificial", "Construcción", "Innovación"],
    confidentiality: "public",
    timeline: [
      {
        id: "submission",
        label: "Propuestas postuladas",
        description: "ORBI presentó Brand Factory IA y Field Intelligence Suite dentro de una misma convocatoria.",
        status: "complete",
      },
      {
        id: "result-pending",
        label: "Resultado pendiente",
        description: "No se publica resultado hasta contar con confirmación oficial.",
        status: "future",
      },
    ],
    submissions: [
      {
        id: "orbi-brand-factory-ia",
        solutionName: "ORBI Brand Factory IA",
        challengeName: "Desafío 1 — Autonomía en producción digital con IA generativa",
        status: "submitted",
        tagline: "Producción digital asistida por IA para equipos de marketing y contenido.",
        description:
          "Solución orientada a aumentar la autonomía de equipos de marketing y producción digital mediante inteligencia artificial generativa, automatización creativa y flujos controlados de generación de contenido.",
        problem:
          "Los equipos de marketing requieren producir más contenido, con mayor velocidad y consistencia, sin perder control de marca.",
        solution:
          "Un sistema de generación y revisión asistida por IA para acelerar piezas creativas, mantener lineamientos y reducir tareas repetitivas.",
        aiRole:
          "La IA apoya generación, estructuración y variación de contenidos bajo reglas de marca y supervisión humana.",
        capabilities: ["Generación asistida", "Flujos creativos", "Control de marca", "Revisión humana"],
        technologies: ["IA generativa", "Automatización", "Sistemas de contenido"],
        impactAreas: ["Marketing", "Producción digital", "Eficiencia operativa"],
        confidentiality: "public",
      },
      {
        id: "orbi-field-intelligence-suite",
        solutionName: "ORBI Field Intelligence Suite",
        challengeName: "Desafío 2 — Tecnología e innovación para la construcción",
        status: "submitted",
        tagline: "Inteligencia operacional para terreno, evidencia y coordinación.",
        description:
          "Suite de inteligencia operacional orientada a mejorar procesos de terreno, coordinación, evidencia, seguimiento y control de actividades mediante herramientas digitales e inteligencia artificial.",
        problem:
          "Las operaciones de terreno requieren mayor trazabilidad, coordinación y evidencia confiable para tomar decisiones rápidas.",
        solution:
          "Una suite de apoyo operacional que organiza actividades, estados, evidencia y seguimiento para equipos en terreno.",
        aiRole:
          "La IA ayuda a ordenar información, priorizar señales y transformar evidencia dispersa en seguimiento accionable.",
        capabilities: ["Seguimiento de terreno", "Gestión de evidencia", "Coordinación operativa", "Estados locales"],
        technologies: ["IA aplicada", "Dashboards", "Gestión documental", "Flujos operacionales"],
        impactAreas: ["Construcción", "Operaciones", "Supervisión", "Control de actividades"],
        confidentiality: "limited",
        demoStatus:
          "DEMO READY / FINAL LOCK. La demostración utiliza datos ficticios y estados locales; no es una integración productiva.",
      },
    ],
    lastUpdated: "2026-08-04",
  },
  {
    id: "openai-build-week-2026",
    slug: "openai-build-week-2026",
    programName: "OpenAI Build Week 2026",
    organizer: ["OpenAI"],
    edition: "2026",
    year: 2026,
    status: "submitted",
    featured: false,
    summary:
      "Postulación de ORBI PVMetrics IA con un copiloto de inteligencia de incidentes para activos fotovoltaicos y BESS.",
    description:
      "Durante Build Week, ORBI preparó una evolución privada y sanitizada de PVMetrics IA centrada en incidentes, evidencia determinista, revisión humana y apoyo opcional de IA.",
    categories: ["Energía", "Inteligencia artificial", "Operaciones", "Solar", "BESS"],
    confidentiality: "limited",
    timeline: [
      {
        id: "submission-sent",
        label: "Postulación enviada",
        description: "La demo se mantiene privada, sanitizada y basada en datos sintéticos.",
        status: "complete",
      },
      {
        id: "review",
        label: "Revisión de la convocatoria",
        description: "No se publica resultado hasta contar con confirmación oficial.",
        status: "future",
      },
    ],
    submissions: [
      {
        id: "incident-intelligence-copilot",
        solutionName: "ORBI PVMetrics IA — Incident Intelligence Copilot",
        status: "submitted",
        tagline: "Copiloto de inteligencia para incidentes solares y BESS.",
        description:
          "Plataforma de inteligencia para activos fotovoltaicos y BESS. Incorpora copiloto de inteligencia de incidentes, motor determinista de evidencia, escenarios de demostración, revisión humana y una capa opcional de interpretación asistida por IA.",
        problem:
          "Los equipos de operación necesitan analizar incidentes con trazabilidad, evidencia clara y separación entre datos deterministas e interpretación asistida.",
        solution:
          "Un copiloto que organiza incidentes, evidencia, hallazgos y revisión humana en un flujo seguro basado en datos sintéticos.",
        aiRole:
          "La IA funciona como apoyo interpretativo opcional, sin tomar control de equipos ni sustituir la revisión humana.",
        capabilities: ["Gestión de incidentes", "Evidencia determinista", "Revisión humana", "Escenarios sintéticos"],
        technologies: ["React", "TypeScript", "IA asistida", "Motor determinista"],
        impactAreas: ["Solar", "BESS", "O&M", "Continuidad operacional"],
        confidentiality: "limited",
        demoStatus:
          "Demo privada y sanitizada. No controla SCADA, inversores, BESS, reconectadores ni equipos operacionales reales.",
      },
    ],
    lastUpdated: "2026-08-04",
  },
  {
    id: "ai-for-climate-innovation-factory-2026",
    slug: "ai-for-climate-innovation-factory-2026",
    programName: "AI for Climate Innovation Factory 2026",
    organizer: ["AI for Climate Innovation Factory"],
    edition: "2026",
    year: 2026,
    status: "preparing",
    featured: true,
    summary:
      "Evolución climática de ORBI PVMetrics IA para transformar incidentes, pérdidas y evidencia energética en oportunidades medibles de recuperación climática.",
    description:
      "ORBI PVMetrics IA — Climate Recovery Edition resume la participación de ORBI en una línea de innovación climática enfocada en resiliencia, reducción de emisiones y recuperación de valor energético.",
    categories: ["Climate Tech", "Energía", "Inteligencia artificial", "Sostenibilidad", "Resiliencia climática"],
    confidentiality: "public",
    productRoute: "/climate-recovery",
    timeline: [
      {
        id: "preparation",
        label: "Preparación de la edición climática",
        description: "La ficha resume la participación; el detalle técnico permanece en Climate Recovery.",
        status: "current",
      },
      {
        id: "future-assets",
        label: "Activos públicos por incorporar",
        description: "Video, pitch deck, demo pública y métricas climáticas autorizadas se agregan cuando existan.",
        status: "future",
      },
    ],
    submissions: [
      {
        id: "climate-recovery-edition",
        solutionName: "ORBI PVMetrics IA — Climate Recovery Edition",
        status: "preparing",
        tagline: "De incidentes energéticos a oportunidades medibles de recuperación climática.",
        description:
          "Evolución climática de ORBI PVMetrics IA orientada a transformar incidentes, pérdidas operacionales y evidencia energética en oportunidades medibles de recuperación, resiliencia y reducción de emisiones.",
        problem:
          "Los incidentes energéticos suelen quedar como pérdidas operacionales aisladas, sin traducirse en aprendizaje climático, resiliencia o métricas de recuperación.",
        solution:
          "Una capa climática que organiza evidencia, impactos y oportunidades de recuperación para apoyar decisiones sostenibles.",
        aiRole:
          "La IA ayuda a interpretar evidencia y oportunidades climáticas bajo una lógica de revisión y control humano.",
        capabilities: ["Climate Opportunity Score", "Evidencia energética", "Resiliencia operacional", "Reporte climático"],
        technologies: ["PVMetrics IA", "Analítica climática", "IA asistida", "Datos sintéticos"],
        impactAreas: ["Climate Tech", "Energía", "Sostenibilidad", "Resiliencia"],
        confidentiality: "public",
        productRoute: "/climate-recovery",
      },
    ],
    lastUpdated: "2026-08-04",
  },
];

export const publicInnovationChallenges = innovationChallenges.filter(
  (challenge) => challenge.confidentiality !== "private"
);

export const featuredInnovationChallenge = publicInnovationChallenges.find(
  (challenge) => challenge.featured
);

export const getInnovationChallengeBySlug = (slug: string) =>
  publicInnovationChallenges.find((challenge) => challenge.slug === slug);

export const getInnovationChallengeStats = () => {
  const submissionsCount = publicInnovationChallenges.reduce(
    (total, challenge) => total + challenge.submissions.length,
    0
  );

  const categories = new Set(publicInnovationChallenges.flatMap((challenge) => challenge.categories));
  const organizers = new Set(publicInnovationChallenges.flatMap((challenge) => challenge.organizer));

  return {
    challenges: publicInnovationChallenges.length,
    submissions: submissionsCount,
    categories: categories.size,
    organizers: organizers.size,
  };
};
