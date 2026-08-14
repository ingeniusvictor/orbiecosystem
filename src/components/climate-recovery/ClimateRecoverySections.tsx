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
import type { ClimateLocale, competitionContent } from "../../content/competition";
import type { CapabilityGroup, ClimateRecoveryDataSet } from "./ClimateRecoveryData";
import { CapabilityStatusBadge, ClimateButton, GlassCard, SectionShell, StatusBadge } from "./ClimateRecoveryPrimitives";

type CompetitionContent = typeof competitionContent;
type LocaleContent = CompetitionContent["climateRecoveryLocales"][ClimateLocale];

const statusOrder: CapabilityGroup["label"][] = ["Existing Foundation", "Competition Edition", "Planned", "Prototype"];

export function buildCapabilityGroups(content: CompetitionContent, localeContent: LocaleContent): CapabilityGroup[] {
  const statusByLabel: Record<CapabilityGroup["label"], string> = {
    "Existing Foundation": content.statusLabels.existing,
    "Competition Edition": content.statusLabels.competitionEdition,
    Planned: content.statusLabels.planned,
    Prototype: content.statusLabels.prototype,
  };

  return localeContent.capabilities.groups.map((group) => ({
    label: group.label,
    status: statusByLabel[group.label],
    items: [...group.items],
  }));
}

function LanguageSelector({ locale, localeContent }: { locale: ClimateLocale; localeContent: LocaleContent }) {
  const options = [
    {
      locale: "es" as const,
      href: "/climate-recovery",
      short: "ES",
      label: localeContent.languageSwitch.spanish,
    },
    {
      locale: "en" as const,
      href: "/climate-recovery/en",
      short: "EN",
      label: localeContent.languageSwitch.english,
    },
  ];

  return (
    <nav
      aria-label={localeContent.languageSwitch.label}
      className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950/85 p-1 shadow-xl shadow-black/20 backdrop-blur sm:right-6 lg:right-8"
    >
      {options.map((option, index) => {
        const isActive = locale === option.locale;
        return (
          <span key={option.locale} className="flex items-center gap-1">
            <a
              href={option.href}
              hrefLang={option.locale}
              aria-label={option.label}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 font-mono text-xs font-black uppercase tracking-widest transition focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                isActive
                  ? "border-cyan-400/60 bg-cyan-400/15 text-white"
                  : "border-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <span>{option.short}</span>
              {isActive && (
                <>
                  {" "}
                  <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] text-slate-950">{localeContent.languageSwitch.current}</span>
                </>
              )}
            </a>
            {index === 0 && <span className="px-0.5 text-slate-600" aria-hidden="true">|</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function CompetitionHero({
  content,
  locale,
  localeContent,
  data,
  onNavigate,
}: {
  content: CompetitionContent;
  locale: ClimateLocale;
  localeContent: LocaleContent;
  data: ClimateRecoveryDataSet;
  onNavigate: (id: string) => void;
}) {
  return (
    <section id="climate-hero" className="relative overflow-hidden bg-[#050816]">
      <LanguageSelector locale={locale} localeContent={localeContent} />
      <div className="absolute inset-0 grid-overlay opacity-25" aria-hidden="true" />
      <div className="absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl sm:h-[32rem] sm:w-[32rem]" aria-hidden="true" />
      <div className="absolute bottom-[-10rem] right-[-10rem] h-[24rem] w-[24rem] rounded-full bg-purple-600/10 blur-3xl sm:h-[30rem] sm:w-[30rem]" aria-hidden="true" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-9 px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="space-y-7 sm:space-y-8">
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-400/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:tracking-[0.2em]"
          >
            {content.company.legalName}
          </a>

          <div className="max-w-4xl space-y-5">
            <StatusBadge>{localeContent.product.statusLabel}</StatusBadge>
            <h1 className="font-space text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">{localeContent.title}</h1>
            <p className="font-orbitron text-sm font-bold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-energy-cyan via-blue-400 to-purple-400 sm:text-lg sm:tracking-[0.18em]">
              {localeContent.phrase}
            </p>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{localeContent.description}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ClimateButton onClick={() => onNavigate("solution-flow")}>
              {localeContent.hero.primaryCta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ClimateButton>
            <ClimateButton variant="secondary" onClick={() => onNavigate("climate-method")}>
              {localeContent.hero.secondaryCta}
            </ClimateButton>
          </div>

          <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2 sm:grid-cols-5">
            {data.pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-xl border border-slate-800 bg-slate-950/65 px-3 py-3 text-center">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">{pillar.title}</span>
              </div>
            ))}
          </div>
        </div>

        <RecoveryLoopPreview localeContent={localeContent} data={data} />
      </div>
    </section>
  );
}

function RecoveryLoopPreview({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <GlassCard className="glass-panel-glow-blue relative p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{localeContent.hero.loopTitle}</p>
          <p className="text-sm text-slate-400">{localeContent.hero.loopSubtitle}</p>
        </div>
        <Leaf className="h-8 w-8 shrink-0 text-energy-green" aria-hidden="true" />
      </div>
      <ol className="space-y-3">
        {data.flowSteps.map((step, index) => (
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

export function ProblemSection({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="problem" eyebrow={localeContent.sections.problemEyebrow} title={localeContent.sections.problemTitle}>
      <div className="grid gap-5 md:grid-cols-2">
        <GlassCard className="p-6">
          <p className="text-sm leading-7 text-slate-300">{localeContent.problem}</p>
        </GlassCard>
        <div className="grid gap-3">
          {data.problemSignals.map((item) => (
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

export function RecoveryFlowSection({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="solution-flow" eyebrow={localeContent.sections.flowEyebrow} title={localeContent.sections.flowTitle}>
      <ol className="grid gap-3 lg:grid-cols-6">
        {data.flowSteps.map((step, index) => (
          <li key={step} className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <p className="mb-3 font-mono text-[10px] font-black text-cyan-300">
              {localeContent.labels.step} {index + 1}
            </p>
            <h3 className="text-base font-bold leading-snug text-white">{step}</h3>
            {index < data.flowSteps.length - 1 && <ArrowRight className="absolute right-4 top-5 hidden h-4 w-4 text-slate-600 lg:block" aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

export function RecoveryPillarsSection({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="pillars" eyebrow={localeContent.sections.pillarsEyebrow} title={localeContent.sections.pillarsTitle}>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        {data.pillars.map((pillar) => {
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

export function CapabilitiesSection({ groups, localeContent }: { groups: CapabilityGroup[]; localeContent: LocaleContent }) {
  const sortedGroups = [...groups].sort((a, b) => statusOrder.indexOf(a.label) - statusOrder.indexOf(b.label));

  return (
    <SectionShell id="capabilities" eyebrow={localeContent.sections.capabilitiesEyebrow} title={localeContent.sections.capabilitiesTitle}>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {sortedGroups.map((group) => (
          <article key={group.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <CapabilityStatusBadge state={group.label} statusPrefix={localeContent.capabilities.statusPrefix} />
            <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {localeContent.capabilities.registryLabel}: {group.status}
            </p>
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

export function ExplainabilityPanel({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="explainable-ai" eyebrow={localeContent.sections.explainableEyebrow} title={localeContent.sections.explainableTitle}>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="border-purple-400/20 bg-purple-950/10 p-6">
          <p className="text-sm leading-7 text-slate-300">{localeContent.explainableAI}</p>
        </GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.explainabilityItems.map((item) => (
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

export function ClimateImpactMethod({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="climate-method" eyebrow={localeContent.sections.climateMethodEyebrow} title={localeContent.sections.climateMethodTitle}>
      <GlassCard className="mb-6 p-6">
        <p className="text-sm leading-7 text-slate-300">{localeContent.climateImpact}</p>
      </GlassCard>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {data.impactCategories.map((category) => (
          <article key={category.label} className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
            <h3 className="mb-2 text-lg font-bold text-white">{category.label}</h3>
            <p className="text-sm leading-6 text-slate-400">{category.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function SyntheticDemoScenario({ syntheticLabel, localeContent, data }: { syntheticLabel: string; localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="synthetic-demo" eyebrow={localeContent.sections.syntheticEyebrow} title={localeContent.sections.syntheticTitle}>
      <div className="grid gap-5 lg:grid-cols-3">
        {data.syntheticDemoItems.map((item) => (
          <article key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-950/10 p-5">
            <StatusBadge>{syntheticLabel}</StatusBadge>
            <h3 className="mt-4 text-lg font-bold text-white">{item}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{localeContent.labels.syntheticDescription}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function PublicArchitectureDiagram({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <SectionShell id="public-architecture" eyebrow={localeContent.sections.architectureEyebrow} title={localeContent.sections.architectureTitle}>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {data.architectureBlocks.map((block) => {
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
        <p className="text-sm leading-6 text-slate-400">{localeContent.labels.architectureBoundary}</p>
      </GlassCard>
    </SectionShell>
  );
}

export function ProductStatusTimeline({ localeContent, data }: { localeContent: LocaleContent; data: ClimateRecoveryDataSet }) {
  return (
    <>
      <SectionShell id="product-status" eyebrow={localeContent.sections.productStatusEyebrow} title={localeContent.sections.productStatusTitle}>
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <GlassCard className="p-6">
            <StatusBadge>{localeContent.product.statusLabel}</StatusBadge>
            <p className="mt-4 text-sm leading-7 text-slate-300">{localeContent.product.productStatus}</p>
          </GlassCard>
          <GlassCard className="border-amber-400/30 bg-amber-950/10 p-6">
            <FileWarning className="mb-4 h-6 w-6 text-solar-gold" aria-hidden="true" />
            <h3 className="mb-2 text-lg font-bold text-white">{localeContent.labels.pendingConfirmation}</h3>
            <p className="text-sm leading-6 text-slate-300">{localeContent.product.productStatusWarning}</p>
          </GlassCard>
        </div>
      </SectionShell>

      <SectionShell id="roadmap" eyebrow={localeContent.sections.roadmapEyebrow} title={localeContent.sections.roadmapTitle}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.roadmap.map((item) => (
            <article key={item.stage} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <CapabilityStatusBadge state={item.state} statusPrefix={localeContent.capabilities.statusPrefix} />
              <h3 className="mt-4 text-lg font-bold text-white">{item.stage}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      </SectionShell>
    </>
  );
}

export function CompanyContextSection({ localeContent }: { localeContent: LocaleContent }) {
  return (
    <>
      <SectionShell id="company" eyebrow={localeContent.sections.companyEyebrow} title={localeContent.sections.companyTitle}>
        <GlassCard className="p-6">
          <MapPin className="mb-4 h-6 w-6 text-energy-green" aria-hidden="true" />
          <p className="text-sm leading-7 text-slate-300">{localeContent.company.canonicalDescription}</p>
        </GlassCard>
      </SectionShell>

      <SectionShell id="founder" eyebrow={localeContent.sections.founderEyebrow} title={localeContent.sections.founderTitle}>
        <GlassCard className="p-6">
          <p className="text-sm leading-7 text-slate-300">{localeContent.company.founderDescription}</p>
        </GlassCard>
      </SectionShell>
    </>
  );
}

export function CompetitionBadgeSection({ content, localeContent }: { content: CompetitionContent; localeContent: LocaleContent }) {
  return (
    <SectionShell id="competition" eyebrow={localeContent.sections.competitionEyebrow} title={localeContent.sections.competitionTitle}>
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

export function ContactCTA({ localeContent }: { localeContent: LocaleContent }) {
  return (
    <section id="contact" className="border-t border-slate-900 bg-slate-950 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Sparkles className="mx-auto mb-5 h-8 w-8 text-energy-cyan" aria-hidden="true" />
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-energy-cyan sm:tracking-[0.22em]">{localeContent.sections.contactEyebrow}</p>
        <h2 className="mt-3 font-space text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">{localeContent.sections.contactTitle}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400">{localeContent.labels.contactDescription}</p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="mt-8 inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-6 py-3 text-sm font-extrabold uppercase tracking-widest text-slate-500"
        >
          {localeContent.labels.contactDisabled}
        </button>
      </div>
    </section>
  );
}
