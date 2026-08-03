import { competitionContent } from "../content/competition";
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

export default function ClimateRecoveryLanding() {
  const content = competitionContent;
  const capabilityGroups = buildCapabilityGroups(content);

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
      <CompetitionHero content={content} onNavigate={scrollTo} />
      <ProblemSection content={content} />
      <RecoveryFlowSection />
      <RecoveryPillarsSection />
      <CapabilitiesSection groups={capabilityGroups} />
      <ExplainabilityPanel content={content} />
      <ClimateImpactMethod content={content} />
      <SyntheticDemoScenario syntheticLabel={content.statusLabels.syntheticData} />
      <PublicArchitectureDiagram />
      <ProductStatusTimeline content={content} />
      <CompanyContextSection content={content} />
      <CompetitionBadgeSection content={content} />
      <ContactCTA />
    </main>
  );
}
