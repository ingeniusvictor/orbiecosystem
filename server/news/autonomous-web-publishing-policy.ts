import { RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import { CanonicalStoryStatus, ContentFormat, type CanonicalStory } from '../../domain/editorial/canonical-story';

export const AUTONOMOUS_WEB_MIN_ORBI_SCORE = 75;
export const AUTONOMOUS_WEB_MIN_INDEPENDENT_SOURCES = 2;

export interface AutonomousWebPublishingAssessment {
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

const sourceHost = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' ? parsed.hostname.toLowerCase().replace(/^www\./, '') : null;
  } catch {
    return null;
  }
};

/**
 * Deterministic policy for operator-authorized web autonomy.
 * AI output alone cannot satisfy this gate: the story must already have passed
 * verification + editorial gates and contain grounded source references.
 */
export const assessAutonomousWebPublishing = (
  story: CanonicalStory,
): AutonomousWebPublishingAssessment => {
  const reasons: string[] = [];

  if (story.status !== CanonicalStoryStatus.DRAFT_READY && story.status !== CanonicalStoryStatus.READY_FOR_REVIEW) {
    reasons.push('AUTONOMOUS_WEB_STORY_NOT_REVIEW_READY');
  }
  if (story.riskLevel !== RiskLevel.LOW) reasons.push('AUTONOMOUS_WEB_LOW_RISK_REQUIRED');
  if (story.verificationConfidence !== VerificationConfidence.VERY_HIGH) {
    reasons.push('AUTONOMOUS_WEB_VERY_HIGH_CONFIDENCE_REQUIRED');
  }
  if (story.orbiScore < AUTONOMOUS_WEB_MIN_ORBI_SCORE) reasons.push('AUTONOMOUS_WEB_SCORE_BELOW_THRESHOLD');
  if (story.format === ContentFormat.BREAKING_NEWS) reasons.push('AUTONOMOUS_WEB_BREAKING_REQUIRES_HUMAN_REVIEW');
  if (!story.sourceRefs.some((source) => source.isPrimary)) reasons.push('AUTONOMOUS_WEB_PRIMARY_SOURCE_REQUIRED');

  const independentHosts = new Set(story.sourceRefs.map((source) => sourceHost(source.url)).filter((host): host is string => host !== null));
  if (independentHosts.size < AUTONOMOUS_WEB_MIN_INDEPENDENT_SOURCES) {
    reasons.push('AUTONOMOUS_WEB_INDEPENDENT_CORROBORATION_REQUIRED');
  }

  return { eligible: reasons.length === 0, reasons };
};
