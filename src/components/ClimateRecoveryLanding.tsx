import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleDot,
  Database,
  Eye,
  FileWarning,
  Hand,
  Layers,
  Leaf,
  Lock,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Target,
} from "lucide-react";
import { competitionContent } from "../content/competition";

const flowSteps = [
  "Datos operacionales",
  "Detección",
  "Evidencia",
  "Priorización",
  "Intervención humana",
  "Verificación",
];

const pillars = [
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

const capabilityGroups = [
  {
    label: "Existing Foundation",
    status: competitionContent.statusLabels.existing,
    items: ["Base funcional de PBMetrics sujeta a confirmación del baseline.", "Registro centralizado de contenido y claims."],
  },
  {
    label: "Competition Edition",
    status: competitionContent.statusLabels.competitionEdition,
    items: ["Enfoque Climate Recovery para pérdidas recuperables.", "Marco explicable con operador como decisor final."],
  },
  {
    label: "Planned",
    status: competitionContent.statusLabels.planned,
    items: ["Command Center para priorización operativa.", "Ruta reusable para ficha técnica de PBMetrics."],
  },
  {
    label: "Prototype",
    status: competitionContent.statusLabels.prototype,
    items: ["Escenarios demostrativos rotulados como Synthetic Data.", "Visualizaciones de flujo y verificación sin datos reales."],
  },
];

const impactCategories = [
  { label: "Medición", description: "Datos reales verificados cuando existan fuente y autorización." },
  { label: "Estimación", description: "Cálculos derivados con metodología declarada." },
  { label: "Simulación", description: "Escenarios modelados y claramente rotulados." },
  { label: "Proyección", description: "Visión futura separada de evidencia operacional." },
];

const architectureBlocks = [
  { title: "Operational Data Layer", description: "Datos operacionales autorizados y no sensibles.", icon: Database },
  { title: "Explainable AI Layer", description: "Hipótesis, evidencia, confianza e incertidumbre.", icon: Brain },
  { title: "Human Decision Layer", description: "El equipo de O&M decide y ejecuta acciones.", icon: Hand },
  { title: "Verification Layer", description: "Comparación posterior sin mezclar categorías de evidencia.", icon: ShieldCheck },
];

const roadmap = [
  { stage: "Baseline", state: "Existing Foundation", description: "Auditoría, respaldo y manifiesto técnico del repositorio." },
  { stage: "Foundation", state: "Competition Edition", description: "Registro canónico, claims y estructura visual inicial." },
  { stage: "Diagnosis", state: "Planned", description: "Identificación explicable de oportunidades recuperables." },
  { stage: "Command Center", state: "Planned", description: "Priorización operacional para equipos de mantenimiento." },
  { stage: "Verification", state: "Planned", description: "Separación entre medición, estimación, simulación y proyección." },
  { stage: "Pilot Validation", state: "Planned", description: "Validación futura solo con autorización y evidencia." },
];

function SectionShell({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-slate-900 bg-[#050816] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-energy-cyan">{eyebrow}</p>
          <h2 className="font-space text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
      {children}
    </span>
  );
}

export default function ClimateRecoveryLanding() {
  const content = competitionContent;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-400/30 selection:text-white">
      <section className="relative overflow-hidden bg-[#050816]">
        <div className="absolute inset-0 grid-overlay opacity-30" aria-hidden="true" />
        <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-purple-600/10 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="space-y-8">
            <a
              href="/"
              className="inline-flex min-h-11 items-center rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              ORBI Ecosystem SpA
            </a>

            <div className="space-y-5">
              <StatusBadge>{content.product.statusLabel}</StatusBadge>
              <h1 className="max-w-4xl font-space text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {content.climateRecovery.title}
              </h1>
              <p className="font-orbitron text-lg font-bold uppercase tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-r from-energy-cyan via-blue-400 to-purple-400">
                {content.climateRecovery.phrase}
              </p>
              <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{content.climateRecovery.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollTo("solution-flow")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg shadow-cyan-500/15 transition hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              >
                Explorar la solución
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo("climate-method")}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-slate-200 transition hover:border-purple-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                Ver metodología
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3 text-center">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">{pillar.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel-glow-blue relative rounded-2xl border border-cyan-400/20 bg-slate-950/50 p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Climate Recovery Loop</p>
                <p className="mt-1 text-sm text-slate-400">Synthetic demonstration preview</p>
              </div>
              <Leaf className="h-8 w-8 text-energy-green" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              {flowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#050816]/70 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-mono text-xs font-black text-cyan-300">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionShell id="problem" eyebrow="Problem" title="Datos operacionales que todavía no se convierten en recuperación">
        <div className="grid gap-5 md:grid-cols-2">
          <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm leading-7 text-slate-300">{content.climateRecovery.problem}</p>
          <div className="grid gap-3">
            {["Datos fragmentados", "Diagnóstico lento", "Dificultad para priorizar", "Dificultad para verificar recuperación", "Pérdida económica y menor energía limpia entregada a la red"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-solar-gold" aria-hidden="true" />
                <p className="text-sm font-medium text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="solution-flow" eyebrow="From Data To Recovery" title="Del dato operacional a la verificación">
        <div className="grid gap-3 lg:grid-cols-6">
          {flowSteps.map((step, index) => (
            <div key={step} className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="mb-3 font-mono text-[10px] font-black text-cyan-300">STEP {index + 1}</p>
              <h3 className="text-base font-bold text-white">{step}</h3>
              {index < flowSteps.length - 1 && <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-slate-600 lg:block" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="pillars" eyebrow="Five Recovery Pillars" title="Cinco pilares para recuperar energía limpia sin inventar certezas">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <Icon className="mb-4 h-6 w-6 text-energy-cyan" aria-hidden="true" />
                <h3 className="mb-2 text-lg font-bold text-white">{pillar.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell id="capabilities" eyebrow="Capabilities And Status" title="Capacidades diferenciadas por estado">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {capabilityGroups.map((group) => (
            <article key={group.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <StatusBadge>{group.status}</StatusBadge>
              <h3 className="mt-4 text-lg font-bold text-white">{group.label}</h3>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
                    <CircleDot className="mt-1 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="explainable-ai" eyebrow="Explainable AI" title="La IA recomienda; el operador decide">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-purple-400/20 bg-purple-950/10 p-6">
            <p className="text-sm leading-7 text-slate-300">{content.climateRecovery.explainableAI}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Evidencia", "Nivel de confianza", "Incertidumbre", "Limitaciones", "Supervisión humana"].map((item) => (
              <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-purple-300" aria-hidden="true" />
                <h3 className="text-sm font-bold text-white">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell id="climate-method" eyebrow="Climate Impact Method" title="Impacto climático explicado por categorías de evidencia">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 text-sm leading-7 text-slate-300">{content.climateRecovery.climateImpact}</div>
        <div className="grid gap-5 md:grid-cols-4">
          {impactCategories.map((category) => (
            <article key={category.label} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
              <h3 className="mb-2 text-lg font-bold text-white">{category.label}</h3>
              <p className="text-sm leading-6 text-slate-400">{category.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="synthetic-demo" eyebrow="Synthetic Data" title="Escenario demostrativo sintético">
        <div className="grid gap-5 lg:grid-cols-3">
          {["Alarma operativa sintética", "Hipótesis explicable", "Acción humana simulada"].map((item) => (
            <article key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-950/10 p-5">
              <StatusBadge>Synthetic Data</StatusBadge>
              <h3 className="mt-4 text-lg font-bold text-white">{item}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">Demostración visual sin datos reales, clientes, pilotos ni resultados climáticos.</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="public-architecture" eyebrow="Public Architecture" title="Arquitectura pública de alto nivel">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {architectureBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <article key={block.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <Icon className="mb-4 h-6 w-6 text-energy-cyan" aria-hidden="true" />
                <h3 className="mb-2 text-base font-bold text-white">{block.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{block.description}</p>
              </article>
            );
          })}
        </div>
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-solar-gold" aria-hidden="true" />
          No se exponen algoritmos privados, credenciales, endpoints internos, detalles propietarios ni información sensible.
        </p>
      </SectionShell>

      <SectionShell id="product-status" eyebrow="Product Status" title="Estado del producto y condición de publicación">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <StatusBadge>{content.product.statusLabel}</StatusBadge>
            <p className="mt-4 text-sm leading-7 text-slate-300">{content.product.productStatus}</p>
          </div>
          <div className="rounded-2xl border border-amber-400/30 bg-amber-950/10 p-6">
            <FileWarning className="mb-4 h-6 w-6 text-solar-gold" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-bold text-white">Pendiente de confirmación</h3>
            <p className="text-sm leading-6 text-slate-300">{content.product.productStatusWarning}</p>
          </div>
        </div>
      </SectionShell>

      <SectionShell id="roadmap" eyebrow="Roadmap" title="Etapas de evolución para Climate Recovery">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmap.map((item) => (
            <article key={item.stage} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <StatusBadge>{item.state}</StatusBadge>
              <h3 className="mt-4 text-lg font-bold text-white">{item.stage}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="company" eyebrow="ORBI Ecosystem SpA" title="Empresa postulante">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <MapPin className="mb-4 h-6 w-6 text-energy-green" aria-hidden="true" />
          <p className="text-sm leading-7 text-slate-300">{content.company.canonicalDescription}</p>
        </div>
      </SectionShell>

      <SectionShell id="founder" eyebrow="Founder" title="Fundador">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
          <p className="text-sm leading-7 text-slate-300">{content.company.founderDescription}</p>
        </div>
      </SectionShell>

      <SectionShell id="competition" eyebrow="Competition" title="AI for Climate Innovation Factory 2026">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <SunMedium className="mb-4 h-6 w-6 text-solar-gold" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-bold text-white">{content.competition.name}</h3>
            <p className="text-sm leading-6 text-slate-400">{content.competition.category}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
            <Layers className="mb-4 h-6 w-6 text-energy-cyan" aria-hidden="true" />
            <p className="text-sm leading-7 text-slate-300">{content.competition.resultBoundary}</p>
          </div>
        </div>
      </SectionShell>

      <section id="contact" className="border-t border-slate-900 bg-slate-950 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Sparkles className="mx-auto mb-5 h-8 w-8 text-energy-cyan" aria-hidden="true" />
          <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-energy-cyan">Contact CTA</p>
          <h2 className="mt-3 font-space text-3xl font-extrabold text-white sm:text-4xl">Canal de contacto pendiente de verificación</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Esta sección queda preparada sin formulario falso ni correo no verificado. El canal público se habilitará cuando exista un medio corporativo confirmado.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-8 inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-slate-500"
          >
            Contacto no habilitado
          </button>
        </div>
      </section>
    </main>
  );
}
