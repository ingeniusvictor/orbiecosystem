import {
  AlertTriangle,
  ArrowRight,
  CircleDot,
  FileWarning,
  Layers,
  Leaf,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from "lucide-react";
import type { competitionContent } from "../../content/competition";
import {
  architectureBlocks,
  explainabilityItems,
  flowSteps,
  impactCategories,
  pillars,
  problemSignals,
  roadmap,
  syntheticDemoItems,
  type CapabilityGroup,
} from "./ClimateRecoveryData";
import { CapabilityStatusBadge, ClimateButton, GlassCard, SectionShell, StatusBadge } from "./ClimateRecoveryPrimitives";

type CompetitionContent = typeof competitionContent;

const statusOrder: CapabilityGroup["label"][] = ["Existing Foundation", "Competition Edition", "Planned", "Prototype"];

export function buildCapabilityGroups(content: CompetitionContent): CapabilityGroup[] {
  return [
    {
      label: "Existing Foundation",
      status: content.statusLabels.existing,
      items: ["Base funcional de PBMetrics sujeta a confirmación del baseline.", "Registro centralizado de contenido y claims."],
    },
    {
      label: "Competition Edition",
      status: content.statusLabels.competitionEdition,
      items: ["Enfoque Climate Recovery para pérdidas recuperables.", "Marco explicable con operador como decisor final."],
    },
    {
      label: "Planned",
      status: content.statusLabels.planned,
      items: ["Command Center para priorización operativa.", "Ruta reusable para ficha técnica de PBMetrics."],
    },
    {
      label: "Prototype",
      status: content.statusLabels.prototype,
      items: ["Escenarios demostrativos rotulados como Synthetic Data.", "Visualizaciones de flujo y verificación sin datos reales."],
    },
  ];
}

export function CompetitionHero({ content, onNavigate }: { content: CompetitionContent; onNavigate: (id: string) => void }) {
  return (
    <section id="climate-hero" className="relative overflow-hidden bg-[#050816]">
      <div className="absolute inset-0 grid-overlay opacity-25" aria-hidden="true" />
      <div className="absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl sm:h-[32rem] sm:w-[32rem]" aria-hidden="true" />
      <div className="absolute bottom-[-10rem] right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-purple-600/10 blur-3xl sm:h-[30rem] sm:w-[30rem]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-9 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="space-y-7 sm:space-y-8">
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:tracking-[0.2em]"
          >
            ORBI Ecosystem SpA
          </a>

          <div className="max-w-4xl space-y-5">
            <StatusBadge>{content.product.statusLabel}</StatusBadge>
            <h1 className="font-space text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">{content.climateRecovery.title}</h1>
            <p className="font-orbitron text-sm font-bold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-energy-cyan via-blue-400 to-purple-400 sm:text-lg sm:tracking-[0.18em]">
              {content.climateRecovery.phrase}
            </p>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{content.climateRecovery.description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ClimateButton onClick={() => onNavigate("solution-flow")}>
              Explorar la solución
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ClimateButton>
            <ClimateButton variant="secondary" onClick={() => onNavigate("climate-method")}>
              Ver metodología
            </ClimateButton>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:grid-cols-5">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-xl border border-slate-800 bg-slate-950/65 px-3 py-3 text-center">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">{pillar.title}</span>
              </div>
            ))}
          </div>
        </div>

        <RecoveryLoopPreview />
      </div>
    </section>
  );
}

function RecoveryLoopPreview() {
  return (
    <GlassCard className="glass-panel-glow-blue relative p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Climate Recovery Loop</p>
          <p className="text-sm text-slate-400">Synthetic demonstration preview</p>
        </div>
        <Leaf className="h-8 w-8 shrink-0 text-energy-green" aria-hidden="true" />
      </div>
      <ol className="space-y-3">
        {flowSteps.map((step, index) => (
          <li key={step} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#050816]/70 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 font-mono text-xs font-black text-cyan-300">
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-slate-100">{step}</span>
          </li>
        ))}
      </ol>
    </GlassCard>
  );
}

export function ProblemSection({ content }: { content: CompetitionContent }) {
  return (
    <SectionShell id="problem" eyebrow="Problem" title="Datos operacionales que todavía no se convierten en recuperación">
      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard className="p-6">
          <p className="text-sm leading-7 text-slate-300">{content.climateRecovery.problem}</p>
        </GlassCard>
        <div className="grid gap-3">
          {problemSignals.map((item) => (
            <GlassCard key={item} className="flex items-start gap-3 bg-slate-900/30 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-solar-gold" aria-hidden="true" />
              <p className="text-sm font-medium leading-6 text-slate-200">{item}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function RecoveryFlowSection() {
  return (
    <SectionShell id="solution-flow" eyebrow="From Data To Recovery" title="Del dato operacional a la verificación">
      <ol className="grid gap-3 lg:grid-cols-6">
        {flowSteps.map((step, index) => (
          <li key={step} className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="mb-3 font-mono text-[10px] font-black text-cyan-300">STEP {index + 1}</p>
            <h3 className="text-base font-bold leading-snug text-white">{step}</h3>
            {index < flowSteps.length - 1 && <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-slate-600 lg:block" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function RecoveryPillarsSection() {
  return (
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
  );
}

export function CapabilitiesSection({ groups }: { groups: CapabilityGroup[] }) {
  const sortedGroups = [...groups].sort((a, b) => statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label));

  return (
    <SectionShell id="capabilities" eyebrow="Capabilities And Status" title="Capacidades diferenciadas por estado">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {sortedGroups.map((group) => (
          <article key={group.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <CapabilityStatusBadge state={group.label} />
            <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Registry label: {group.status}</p>
            <h3 className="mt-4 text-lg font-bold text-white">{group.label}</h3>
            <ul className="mt-4 space-y-3">
              {group.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-300">
                  <CircleDot className="mt-1 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function ExplainabilityPanel({ content }: { content: CompetitionContent }) {
  return (
    <SectionShell id="explainable-ai" eyebrow="Explainable AI" title="La IA recomienda; el operador decide">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="border-purple-400/20 bg-purple-950/10 p-6">
          <p className="text-sm leading-7 text-slate-300">{content.climateRecovery.explainableAI}</p>
        </GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          {explainabilityItems.map((item) => (
            <GlassCard key={item} className="p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-purple-300" aria-hidden="true" />
              <h3 className="text-sm font-bold text-white">{item}</h3>
            </GlassCard>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

export function ClimateImpactMethod({ content }: { content: CompetitionContent }) {
  return (
    <SectionShell id="climate-method" eyebrow="Climate Impact Method" title="Impacto climático explicado por categorías de evidencia">
      <GlassCard className="mb-6 p-6">
        <p className="text-sm leading-7 text-slate-300">{content.climateRecovery.climateImpact}</p>
      </GlassCard>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {impactCategories.map((category) => (
          <article key={category.label} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
            <h3 className="mb-2 text-lg font-bold text-white">{category.label}</h3>
            <p className="text-sm leading-6 text-slate-400">{category.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function SyntheticDemoScenario({ syntheticLabel }: { syntheticLabel: string }) {
  return (
    <SectionShell id="synthetic-demo" eyebrow={syntheticLabel} title="Escenario demostrativo sintético">
      <div className="grid gap-5 lg:grid-cols-3">
        {syntheticDemoItems.map((item) => (
          <article key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-950/10 p-5">
            <StatusBadge>{syntheticLabel}</StatusBadge>
            <h3 className="mt-4 text-lg font-bold text-white">{item}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">Demostración visual sin datos reales, clientes, pilotos ni resultados climáticos.</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function PublicArchitectureDiagram() {
  return (
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
      <GlassCard className="mt-5 flex items-start gap-2 p-4">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-solar-gold" aria-hidden="true" />
        <p className="text-sm leading-6 text-slate-400">No se exponen algoritmos privados, credenciales, endpoints internos, detalles propietarios ni información sensible.</p>
      </GlassCard>
    </SectionShell>
  );
}

export function ProductStatusTimeline({ content }: { content: CompetitionContent }) {
  return (
    <>
      <SectionShell id="product-status" eyebrow="Product Status" title="Estado del producto y condición de publicación">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <GlassCard className="p-6">
            <StatusBadge>{content.product.statusLabel}</StatusBadge>
            <p className="mt-4 text-sm leading-7 text-slate-300">{content.product.productStatus}</p>
          </GlassCard>
          <GlassCard className="border-amber-400/30 bg-amber-950/10 p-6">
            <FileWarning className="mb-4 h-6 w-6 text-solar-gold" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-bold text-white">Pendiente de confirmación</h3>
            <p className="text-sm leading-6 text-slate-300">{content.product.productStatusWarning}</p>
          </GlassCard>
        </div>
      </SectionShell>

      <SectionShell id="roadmap" eyebrow="Roadmap" title="Etapas de evolución para Climate Recovery">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmap.map((item) => (
            <article key={item.stage} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <CapabilityStatusBadge state={item.state} />
              <h3 className="mt-4 text-lg font-bold text-white">{item.stage}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>
    </>
  );
}

export function CompanyContextSection({ content }: { content: CompetitionContent }) {
  return (
    <>
      <SectionShell id="company" eyebrow="ORBI Ecosystem SpA" title="Empresa postulante">
        <GlassCard className="p-6">
          <MapPin className="mb-4 h-6 w-6 text-energy-green" aria-hidden="true" />
          <p className="text-sm leading-7 text-slate-300">{content.company.canonicalDescription}</p>
        </GlassCard>
      </SectionShell>

      <SectionShell id="founder" eyebrow="Founder" title="Fundador">
        <GlassCard className="p-6">
          <p className="text-sm leading-7 text-slate-300">{content.company.founderDescription}</p>
        </GlassCard>
      </SectionShell>
    </>
  );
}

export function CompetitionBadgeSection({ content }: { content: CompetitionContent }) {
  return (
    <SectionShell id="competition" eyebrow="Competition" title="AI for Climate Innovation Factory 2026">
      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard className="p-6">
          <SunMedium className="mb-4 h-6 w-6 text-solar-gold" aria-hidden="true" />
          <h3 className="mb-2 text-lg font-bold text-white">{content.competition.name}</h3>
          <p className="text-sm leading-6 text-slate-400">{content.competition.category}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <Layers className="mb-4 h-6 w-6 text-energy-cyan" aria-hidden="true" />
          <p className="text-sm leading-7 text-slate-300">{content.competition.resultBoundary}</p>
        </GlassCard>
      </div>
    </SectionShell>
  );
}

export function ContactCTA() {
  return (
    <section id="contact" className="border-t border-slate-900 bg-slate-950 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Sparkles className="mx-auto mb-5 h-8 w-8 text-energy-cyan" aria-hidden="true" />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-energy-cyan sm:tracking-[0.22em]">Contact CTA</p>
        <h2 className="mt-3 font-space text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">Canal de contacto pendiente de verificación</h2>
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
  );
}
