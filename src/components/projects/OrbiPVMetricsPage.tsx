import {
  ArrowRight,
  BookOpen,
  Brain,
  CircleDot,
  ExternalLink,
  FileWarning,
  HelpCircle,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { competitionContent } from "../../content/competition";
import { CompetitionAssetLinks } from "../competition/CompetitionAssetLinks";
import {
  climateRecoveryCapabilities,
  existingVerifiedCapabilities,
  faqItems,
  operationalProblems,
  privateBoundaries,
  productOverview,
  productRoadmap,
  publicArchitectureFlow,
  statusAndLimitations,
  targetUsers,
  type ProductListItem,
} from "./OrbiPVMetricsData";
import { ProductBadge, ProductCard, ProductLinkButton, ProductSection, ProductStateBadge } from "./OrbiPVMetricsPrimitives";

function FeatureCard({ item }: { item: ProductListItem }) {
  const Icon = item.icon ?? CircleDot;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2.5 text-energy-cyan">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {item.state && <ProductStateBadge state={item.state} />}
      </div>
      <h3 className="text-lg font-bold leading-snug text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
    </article>
  );
}

function ProductHero() {
  return (
    <section id="product-overview" className="relative overflow-hidden bg-[#050816]">
      <div className="absolute inset-0 grid-overlay opacity-25" aria-hidden="true" />
      <div className="absolute left-[-10rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-[-12rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-purple-600/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-7">
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            ORBI Ecosystem SpA
          </a>
          <div className="space-y-5">
            <ProductBadge>Technical Product Profile</ProductBadge>
            <h1 className="font-space text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">{competitionContent.product.name}</h1>
            <p className="font-orbitron text-sm font-bold uppercase tracking-[0.14em] gradient-text-accessible bg-gradient-to-r from-energy-cyan via-blue-400 to-purple-400 sm:text-lg sm:tracking-[0.18em]">
              {competitionContent.product.edition}
            </p>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{competitionContent.product.positioning}.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ProductLinkButton href="/climate-recovery">
              Conocer Climate Recovery
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ProductLinkButton>
            <ProductLinkButton href="/" variant="secondary">
              Volver al ecosistema
            </ProductLinkButton>
          </div>
        </div>

        <ProductCard className="glass-panel-glow-blue p-4 sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Product Overview</h2>
              <p className="mt-1 text-sm text-slate-400">Ficha pública reutilizable sin métricas no verificadas.</p>
            </div>
            <BookOpen className="h-8 w-8 shrink-0 text-energy-cyan" aria-hidden="true" />
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {productOverview.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-[#050816]/70 p-4">
                <dt className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-sm font-semibold leading-6 text-slate-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        </ProductCard>
      </div>
    </section>
  );
}

function OperationalProblemSection() {
  return (
    <ProductSection id="operational-problem" eyebrow="Technical Context" title="Operational Problem">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <ProductCard className="p-6">
          <p className="text-sm leading-7 text-slate-300">{competitionContent.climateRecovery.problem}</p>
        </ProductCard>
        <div className="grid gap-4 sm:grid-cols-2">
          {operationalProblems.map((item) => (
            <FeatureCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </ProductSection>
  );
}

function TargetUsersSection() {
  return (
    <ProductSection id="target-users" eyebrow="Audience" title="Target Users">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {targetUsers.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <h3 className="text-base font-bold leading-snug text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
          </article>
        ))}
      </div>
      <ProductCard className="mt-5 flex items-start gap-3 border-amber-400/30 bg-amber-950/10 p-4">
        <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-solar-gold" aria-hidden="true" />
        <p className="text-sm leading-6 text-slate-300">Esta sección describe usuarios razonables para evaluación técnica. No afirma clientes activos, pilotos ni disponibilidad comercial.</p>
      </ProductCard>
    </ProductSection>
  );
}

function ExistingCapabilitiesSection() {
  return (
    <ProductSection id="existing-verified-capabilities" eyebrow="Baseline Evidence" title="Existing Verified Capabilities">
      <div className="grid gap-5 md:grid-cols-2">
        {existingVerifiedCapabilities.map((item) => (
          <FeatureCard key={item.title} item={item} />
        ))}
      </div>
    </ProductSection>
  );
}

function ClimateCapabilitiesSection() {
  return (
    <ProductSection id="climate-recovery-capabilities" eyebrow="Competition Edition" title="Climate Recovery Capabilities">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {climateRecoveryCapabilities.map((item) => (
          <FeatureCard key={item.title} item={item} />
        ))}
      </div>
    </ProductSection>
  );
}

function PublicArchitectureSection() {
  return (
    <ProductSection id="public-architecture" eyebrow="Safe Architecture" title="Public Architecture">
      <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {publicArchitectureFlow.map((step, index) => (
          <li key={step} className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="mb-3 font-mono text-[10px] font-black text-cyan-300">LAYER {index + 1}</p>
            <h3 className="text-base font-bold leading-snug text-white">{step}</h3>
            {index < publicArchitectureFlow.length - 1 && <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-slate-600 lg:block" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {privateBoundaries.map((item) => (
          <FeatureCard key={item.title} item={item} />
        ))}
      </div>
    </ProductSection>
  );
}

function ProductStatusSection() {
  return (
    <ProductSection id="product-status-limitations" eyebrow="Publication Boundary" title="Product Status and Limitations">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {statusAndLimitations.map((item) => (
          <FeatureCard key={item.title} item={item} />
        ))}
      </div>
      <ProductCard className="mt-5 border-purple-400/20 bg-purple-950/10 p-6">
        <div className="mb-3 flex items-center gap-2 text-purple-300">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <h3 className="text-lg font-bold text-white">Regla de publicación</h3>
        </div>
        <p className="text-sm leading-7 text-slate-300">{competitionContent.competition.resultBoundary}</p>
      </ProductCard>
    </ProductSection>
  );
}

function RoadmapSection() {
  return (
    <ProductSection id="roadmap" eyebrow="Roadmap" title="Roadmap">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productRoadmap.map((item) => (
          <article key={item.stage} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <ProductStateBadge state={item.state} />
            <h3 className="mt-4 text-lg font-bold text-white">{item.stage}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
          </article>
        ))}
      </div>
    </ProductSection>
  );
}

function FAQSection() {
  return (
    <ProductSection id="faq" eyebrow="FAQ" title="FAQ">
      <div className="grid gap-4 lg:grid-cols-2">
        {faqItems.map((item) => (
          <details key={item.question} className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-left text-base font-bold leading-snug text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950">
              <HelpCircle className="h-5 w-5 shrink-0 text-energy-cyan" aria-hidden="true" />
              {item.question}
            </summary>
            <p className="mt-4 text-sm leading-7 text-slate-400">{item.answer}</p>
          </details>
        ))}
      </div>
    </ProductSection>
  );
}

function ClimateCTASection() {
  return (
    <section id="climate-recovery-cta" className="border-t border-slate-900 bg-slate-950 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Sparkles className="mx-auto mb-5 h-8 w-8 text-energy-cyan" aria-hidden="true" />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-energy-cyan sm:tracking-[0.22em]">CTA</p>
        <h2 className="mt-3 font-space text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">CTA hacia /climate-recovery</h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400">
          La landing Climate Recovery explica la candidatura, el problema operacional, la IA explicable y las categorías de verificación climática.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ProductLinkButton href="/climate-recovery">
            Conocer Climate Recovery
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </ProductLinkButton>
          <ProductLinkButton href="/" variant="secondary">
            Volver al ecosistema
          </ProductLinkButton>
        </div>
        <CompetitionAssetLinks locale="es" className="mt-4" />
      </div>
    </section>
  );
}

export default function OrbiPVMetricsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-400/30 selection:text-white">
      <ProductHero />
      <OperationalProblemSection />
      <TargetUsersSection />
      <ExistingCapabilitiesSection />
      <ClimateCapabilitiesSection />
      <PublicArchitectureSection />
      <ProductStatusSection />
      <RoadmapSection />
      <FAQSection />
      <ClimateCTASection />
    </main>
  );
}
