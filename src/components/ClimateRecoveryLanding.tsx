import { competitionContent, type ClimateLocale } from "../content/competition";
import { climateRecoveryData } from "./climate-recovery/ClimateRecoveryData";
import {
  buildCapabilityGroups,
  CapabilitiesSection,
  ClimateImpactMethod,
  CompanyContextSection,
  CompetitionBadgeSection,
  CompetitionHero,
  ContactCTA,
  ExplainabilityPanel,
  ProblemSection,
  ProductStatusTimeline,
  PublicArchitectureDiagram,
  RecoveryFlowSection,
  RecoveryPillarsSection,
  SyntheticDemoScenario,
} from "./climate-recovery/ClimateRecoverySections";

export default function ClimateRecoveryLanding({ locale = "es" }: { locale?: ClimateLocale }) {
  const content = competitionContent;
  const localeContent = content.climateRecoveryLocales[locale];
  const localizedData = climateRecoveryData[locale];
  const capabilityGroups = buildCapabilityGroups(content, localeContent);

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-400/30 selection:text-white">
      <CompetitionHero content={content} locale={locale} localeContent={localeContent} data={localizedData} onNavigate={scrollTo} />
      <ProblemSection localeContent={localeContent} data={localizedData} />
      <RecoveryFlowSection localeContent={localeContent} data={localizedData} />
      <RecoveryPillarsSection localeContent={localeContent} data={localizedData} />
      <CapabilitiesSection groups={capabilityGroups} localeContent={localeContent} />
      <ExplainabilityPanel localeContent={localeContent} data={localizedData} />
      <ClimateImpactMethod localeContent={localeContent} data={localizedData} />
      <SyntheticDemoScenario syntheticLabel={content.statusLabels.syntheticData} localeContent={localeContent} data={localizedData} />
      <PublicArchitectureDiagram localeContent={localeContent} data={localizedData} />
      <ProductStatusTimeline localeContent={localeContent} data={localizedData} />
      <CompanyContextSection localeContent={localeContent} />
      <CompetitionBadgeSection content={content} localeContent={localeContent} />
      <ContactCTA localeContent={localeContent} />
    </main>
  );
}
