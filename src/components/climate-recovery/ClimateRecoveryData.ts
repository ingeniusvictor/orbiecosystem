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

export const flowSteps = [
  "Datos operacionales",
  "Detección",
  "Evidencia",
  "Priorización",
  "Intervención humana",
  "Verificación",
];

export const pillars: RecoveryPillar[] = [
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
];

export const impactCategories: ImpactCategory[] = [
  { label: "Medición", description: "Datos reales verificados cuando existan fuente y autorización." },
  { label: "Estimación", description: "Cálculos derivados con metodología declarada." },
  { label: "Simulación", description: "Escenarios modelados y claramente rotulados." },
  { label: "Proyección", description: "Visión futura separada de evidencia operacional." },
];

export const architectureBlocks: ArchitectureBlock[] = [
  { title: "Operational Data Layer", description: "Datos operacionales autorizados y no sensibles.", icon: Database },
  { title: "Explainable AI Layer", description: "Hipótesis, evidencia, confianza e incertidumbre.", icon: Brain },
  { title: "Human Decision Layer", description: "El equipo de O&M decide y ejecuta acciones.", icon: Hand },
  { title: "Verification Layer", description: "Comparación posterior sin mezclar categorías de evidencia.", icon: ShieldCheck },
];

export const problemSignals = [
  "Datos fragmentados",
  "Diagnóstico lento",
  "Dificultad para priorizar",
  "Dificultad para verificar recuperación",
  "Pérdida económica y menor energía limpia entregada a la red",
];

export const explainabilityItems = ["Evidencia", "Nivel de confianza", "Incertidumbre", "Limitaciones", "Supervisión humana"];

export const syntheticDemoItems = ["Alarma operativa sintética", "Hipótesis explicable", "Acción humana simulada"];

export const roadmap: RoadmapItem[] = [
  { stage: "Baseline", state: "Existing Foundation", description: "Auditoría, respaldo y manifiesto técnico del repositorio." },
  { stage: "Foundation", state: "Competition Edition", description: "Registro canónico, claims y estructura visual inicial." },
  { stage: "Diagnosis", state: "Planned", description: "Identificación explicable de oportunidades recuperables." },
  { stage: "Command Center", state: "Planned", description: "Priorización operacional para equipos de mantenimiento." },
  { stage: "Verification", state: "Planned", description: "Separación entre medición, estimación, simulación y proyección." },
  { stage: "Pilot Validation", state: "Planned", description: "Validación futura solo con autorización y evidencia." },
];
