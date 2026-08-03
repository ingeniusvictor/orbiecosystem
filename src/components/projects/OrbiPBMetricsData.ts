import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileQuestion,
  Gauge,
  Hand,
  Layers,
  Lock,
  type LucideIcon,
  RefreshCw,
  ShieldCheck,
  Target,
} from "lucide-react";
import { competitionContent } from "../../content/competition";

export type ProductState = "complete" | "in progress" | "planned" | "requires validation" | "pending baseline confirmation" | "competition edition" | "prototype";

export interface ProductInfoItem {
  label: string;
  value: string;
}

export interface ProductListItem {
  title: string;
  description: string;
  state?: ProductState;
  icon?: LucideIcon;
}

export interface RoadmapStage {
  stage: string;
  state: ProductState;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const productOverview: ProductInfoItem[] = [
  { label: "Nombre", value: competitionContent.product.name },
  { label: "Edición", value: competitionContent.product.edition },
  { label: "Empresa", value: competitionContent.company.legalName },
  { label: "Categoría", value: competitionContent.competition.category },
  { label: "Posicionamiento", value: competitionContent.product.positioning },
  { label: "Principio humano", value: competitionContent.product.humanPrinciple },
];

export const operationalProblems: ProductListItem[] = [
  { title: "Datos operacionales fragmentados", description: "Las plantas fotovoltaicas pueden reunir datos, alarmas y registros en fuentes dispersas.", icon: Database },
  { title: "Diagnóstico lento", description: "Convertir información operacional en acción priorizada sigue siendo un desafío técnico.", icon: Gauge },
  { title: "Priorización compleja", description: "Los equipos deben decidir qué oportunidades revisar primero sin afirmar certezas automáticas.", icon: Target },
  { title: "Verificación posterior", description: "La recuperación debe diferenciar medición, estimación, simulación y proyección.", icon: ClipboardList },
  { title: "Pérdida de rendimiento", description: "Una pérdida no identificada o no priorizada puede reducir la energía limpia entregada a la red.", icon: AlertTriangle },
];

export const targetUsers: ProductListItem[] = [
  { title: "Equipos de operación y mantenimiento", description: "Usuarios técnicos que revisan señales, alarmas y acciones de mantenimiento." },
  { title: "Supervisores de plantas fotovoltaicas", description: "Responsables de coordinar criterios operacionales y seguimiento técnico." },
  { title: "Analistas de rendimiento", description: "Perfiles que comparan evidencia, tendencias y categorías de verificación." },
  { title: "Responsables de activos", description: "Equipos que necesitan priorizar mantenimiento sin depender de afirmaciones no verificadas." },
  { title: "Equipos técnicos y energéticos", description: "Especialistas que evalúan IA aplicada a eficiencia renovable y operación fotovoltaica." },
];

export const existingVerifiedCapabilities: ProductListItem[] = [
  {
    title: "Baseline técnico del repositorio",
    description: "El baseline documenta React/Vite, servidor Express, npm, scripts disponibles, rutas iniciales y limitaciones conocidas.",
    state: "complete",
    icon: CheckCircle2,
  },
  {
    title: "Registro documental y tipado de claims",
    description: "Los claims públicos están controlados por CLAIMS_REGISTER.md y por el registro tipado en src/content/competition.ts.",
    state: "complete",
    icon: ShieldCheck,
  },
  {
    title: "Fallback SPA para rutas públicas",
    description: "La aplicación cuenta con fallback SPA para abrir rutas como /climate-recovery y /projects/orbi-pbmetrics directamente.",
    state: "complete",
    icon: Layers,
  },
  {
    title: "Base funcional de PBMetrics",
    description: competitionContent.product.productStatusWarning,
    state: "pending baseline confirmation",
    icon: FileQuestion,
  },
];

export const climateRecoveryCapabilities: ProductListItem[] = [
  { title: "Detectar", description: "Identificar señales operacionales que puedan indicar pérdidas recuperables.", state: "competition edition", icon: Activity },
  { title: "Explicar", description: "Mostrar evidencia, nivel de confianza, incertidumbre y limitaciones del análisis.", state: "competition edition", icon: Brain },
  { title: "Priorizar", description: "Ordenar oportunidades para apoyar decisiones de mantenimiento.", state: "planned", icon: Target },
  { title: "Recuperar", description: "Conectar hallazgos con acciones operacionales ejecutadas por equipos humanos.", state: "planned", icon: RefreshCw },
  { title: "Verificar", description: "Separar medición, estimación, simulación y proyección tras la intervención.", state: "prototype", icon: BarChart3 },
];

export const publicArchitectureFlow = [
  "Datos operacionales",
  "Normalización",
  "Análisis",
  "Evidencia",
  "Priorización",
  "Decisión humana",
  "Intervención",
  "Verificación",
];

export const statusAndLimitations: ProductListItem[] = [
  {
    title: "Lo confirmado",
    description: "Existe una base web/documental auditada, un registro de contenido y claims, y una ruta pública de competencia ya implementada.",
    state: "complete",
  },
  {
    title: "Lo pendiente",
    description: "La afirmación sobre una base funcional de PBMetrics permanece sujeta a confirmación contra evidencia técnica del baseline.",
    state: "pending baseline confirmation",
  },
  {
    title: "Lo planificado",
    description: "Diagnosis, Command Center y Verification se presentan como evolución futura o propuesta, no como disponibilidad productiva.",
    state: "planned",
  },
  {
    title: "Lo no demostrado todavía",
    description: "No se publican porcentajes de recuperación, CO2 evitado, clientes, pilotos, alianzas, premios ni disponibilidad comercial.",
    state: "requires validation",
  },
];

export const productRoadmap: RoadmapStage[] = [
  { stage: "Baseline", state: "complete", description: "Auditoría técnica, respaldo y manifiesto base del repositorio." },
  { stage: "Foundation", state: "in progress", description: "Contenido canónico, claims, ruta Climate Recovery y ficha técnica pública." },
  { stage: "Diagnosis", state: "planned", description: "Identificación explicable de oportunidades recuperables." },
  { stage: "Command Center", state: "planned", description: "Priorización operacional para equipos de mantenimiento." },
  { stage: "Verification", state: "planned", description: "Separación de mediciones, estimaciones, simulaciones y proyecciones." },
  { stage: "Pilot Validation", state: "requires validation", description: "Validación futura solo con evidencia y autorización." },
];

export const faqItems: FAQItem[] = [
  {
    question: "¿Qué es ORBI PBMetrics IA?",
    answer: "Es el producto presentado por ORBI Ecosystem SpA para la edición Climate Recovery, descrito como una capa de inteligencia operacional para operación fotovoltaica.",
  },
  {
    question: "¿Qué problema busca resolver?",
    answer: competitionContent.climateRecovery.problem,
  },
  {
    question: "¿Cómo utiliza inteligencia artificial?",
    answer: competitionContent.climateRecovery.explainableAI,
  },
  {
    question: "¿La IA toma decisiones automáticamente?",
    answer: "No. El principio público es: The AI recommends; the operator decides. Los equipos técnicos conservan la decisión final.",
  },
  {
    question: "¿Qué significa Climate Recovery Edition?",
    answer: "Es la evolución o edición de competencia orientada a identificar, priorizar y verificar oportunidades de recuperación de energía renovable.",
  },
  {
    question: "¿Los datos demostrativos son reales?",
    answer: "No deben presentarse como reales si son sintéticos. Cualquier escenario demostrativo debe estar claramente rotulado como Synthetic Data.",
  },
  {
    question: "¿Qué capacidades existen actualmente?",
    answer: "El repositorio confirma baseline técnico, registro de claims y estructura pública. La base funcional de PBMetrics sigue pendiente de confirmación antes de publicarse como hecho productivo.",
  },
  {
    question: "¿Qué capacidades están planificadas?",
    answer: "Diagnosis, Command Center, priorización operativa y verificación se muestran como planned, prototype o competition edition según corresponda.",
  },
  {
    question: "¿Cómo se verificará la energía recuperada?",
    answer: competitionContent.climateRecovery.climateImpact,
  },
  {
    question: "¿La solución está disponible comercialmente?",
    answer: "La disponibilidad comercial no está confirmada en el baseline y no se afirma públicamente en esta ficha.",
  },
  {
    question: "¿Cómo conocer la propuesta climática completa?",
    answer: "La propuesta completa está en la ruta pública /climate-recovery.",
  },
];

export const privateBoundaries: ProductListItem[] = [
  { title: "Sin algoritmos propietarios", description: "La arquitectura pública se mantiene a nivel conceptual.", icon: Lock },
  { title: "Sin secretos ni credenciales", description: "No se exponen variables de entorno, tokens, claves ni endpoints internos.", icon: ShieldCheck },
  { title: "Sin datos personales", description: "La ficha no publica datos privados de clientes, pilotos o personas.", icon: Hand },
];
