import {
  Brain,
  CheckCircle2,
  Database,
  Eye,
  Hand,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
  Target,
} from "lucide-react";

export type ClimateLocale = "es" | "en";

export interface RecoveryPillar {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface CapabilityGroup {
  label: "Existing Foundation" | "Competition Edition" | "Planned" | "Prototype";
  status: string;
  items: string[];
}

export interface ImpactCategory {
  label: string;
  description: string;
}

export interface ArchitectureBlock {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface RoadmapItem {
  stage: string;
  state: CapabilityGroup["label"];
  description: string;
}

export interface ClimateRecoveryDataSet {
  flowSteps: string[];
  pillars: RecoveryPillar[];
  impactCategories: ImpactCategory[];
  architectureBlocks: ArchitectureBlock[];
  problemSignals: string[];
  explainabilityItems: string[];
  syntheticDemoItems: string[];
  roadmap: RoadmapItem[];
}

export const climateRecoveryData: Record<ClimateLocale, ClimateRecoveryDataSet> = {
  es: {
    flowSteps: ["Datos operacionales", "Detección", "Evidencia", "Priorización", "Intervención humana", "Verificación"],
    pillars: [
      {
        title: "Detectar",
        description: "Identificar señales operacionales que puedan indicar pérdidas recuperables.",
        icon: Eye,
      },
      {
        title: "Explicar",
        description: "Mostrar evidencia, confianza, incertidumbre y límites del análisis.",
        icon: Brain,
      },
      {
        title: "Priorizar",
        description: "Ordenar oportunidades para apoyar decisiones de mantenimiento.",
        icon: Target,
      },
      {
        title: "Recuperar",
        description: "Conectar hallazgos con acciones operacionales ejecutadas por equipos humanos.",
        icon: RefreshCw,
      },
      {
        title: "Verificar",
        description: "Diferenciar medición, estimación, simulación y proyección tras la intervención.",
        icon: CheckCircle2,
      },
    ],
    impactCategories: [
      { label: "Medición", description: "Datos reales verificados cuando existan fuente y autorización." },
      { label: "Estimación", description: "Cálculos derivados con metodología declarada." },
      { label: "Simulación", description: "Escenarios modelados y claramente rotulados." },
      { label: "Proyección", description: "Visión futura separada de evidencia operacional." },
    ],
    architectureBlocks: [
      { title: "Operational Data Layer", description: "Datos operacionales autorizados y no sensibles.", icon: Database },
      { title: "Explainable AI Layer", description: "Hipótesis, evidencia, confianza e incertidumbre.", icon: Brain },
      { title: "Human Decision Layer", description: "El equipo de O&M decide y ejecuta acciones.", icon: Hand },
      { title: "Verification Layer", description: "Comparación posterior sin mezclar categorías de evidencia.", icon: ShieldCheck },
    ],
    problemSignals: [
      "Datos fragmentados",
      "Diagnóstico lento",
      "Dificultad para priorizar",
      "Dificultad para verificar recuperación",
      "Pérdida económica y menor energía limpia entregada a la red",
    ],
    explainabilityItems: ["Evidencia", "Nivel de confianza", "Incertidumbre", "Limitaciones", "Supervisión humana"],
    syntheticDemoItems: ["Alarma operativa sintética", "Hipótesis explicable", "Acción humana simulada"],
    roadmap: [
      { stage: "Baseline", state: "Existing Foundation", description: "Auditoría, respaldo y manifiesto técnico del repositorio." },
      { stage: "Foundation", state: "Competition Edition", description: "Registro canónico, claims y estructura visual inicial." },
      { stage: "Diagnosis", state: "Planned", description: "Identificación explicable de oportunidades recuperables." },
      { stage: "Command Center", state: "Planned", description: "Priorización operacional para equipos de mantenimiento." },
      { stage: "Verification", state: "Planned", description: "Separación entre medición, estimación, simulación y proyección." },
      { stage: "Pilot Validation", state: "Planned", description: "Validación futura solo con autorización y evidencia." },
    ],
  },
  en: {
    flowSteps: ["Operational data", "Detection", "Evidence", "Prioritization", "Human intervention", "Verification"],
    pillars: [
      {
        title: "Detect",
        description: "Identify operational signals that may indicate recoverable losses.",
        icon: Eye,
      },
      {
        title: "Explain",
        description: "Show evidence, confidence, uncertainty and the limits of the analysis.",
        icon: Brain,
      },
      {
        title: "Prioritize",
        description: "Order opportunities to support maintenance decisions.",
        icon: Target,
      },
      {
        title: "Recover",
        description: "Connect findings with operational actions executed by human teams.",
        icon: RefreshCw,
      },
      {
        title: "Verify",
        description: "Separate measurement, estimate, simulation and projection after intervention.",
        icon: CheckCircle2,
      },
    ],
    impactCategories: [
      { label: "Measurement", description: "Verified real data when a source and authorization exist." },
      { label: "Estimate", description: "Derived calculations with a declared methodology." },
      { label: "Simulation", description: "Modeled scenarios that are clearly labeled." },
      { label: "Projection", description: "Future view separated from operational evidence." },
    ],
    architectureBlocks: [
      { title: "Operational Data Layer", description: "Authorized, non-sensitive operational data.", icon: Database },
      { title: "Explainable AI Layer", description: "Hypotheses, evidence, confidence and uncertainty.", icon: Brain },
      { title: "Human Decision Layer", description: "The O&M team decides and executes actions.", icon: Hand },
      { title: "Verification Layer", description: "Post-action comparison without mixing evidence categories.", icon: ShieldCheck },
    ],
    problemSignals: [
      "Fragmented data",
      "Slow diagnosis",
      "Difficulty prioritizing",
      "Difficulty verifying recovery",
      "Economic loss and less clean energy delivered to the grid",
    ],
    explainabilityItems: ["Evidence", "Confidence level", "Uncertainty", "Limitations", "Human oversight"],
    syntheticDemoItems: ["Synthetic operational alarm", "Explainable hypothesis", "Simulated human action"],
    roadmap: [
      { stage: "Baseline", state: "Existing Foundation", description: "Audit, backup and technical repository manifest." },
      { stage: "Foundation", state: "Competition Edition", description: "Canonical registry, claims and initial visual structure." },
      { stage: "Diagnosis", state: "Planned", description: "Explainable identification of recoverable opportunities." },
      { stage: "Command Center", state: "Planned", description: "Operational prioritization for maintenance teams." },
      { stage: "Verification", state: "Planned", description: "Separation between measurement, estimate, simulation and projection." },
      { stage: "Pilot Validation", state: "Planned", description: "Future validation only with authorization and evidence." },
    ],
  },
};
