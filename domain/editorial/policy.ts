import { RiskLevel, VerificationConfidence } from '../common/enums';
import type { CanonicalStory } from './canonical-story';
import { CanonicalStoryStatus } from './canonical-story';
import type { SocialPackage } from './social-package';
import { evaluateSocialPackageLengthConsistency } from './social-length-policy';

export enum EditorialDecision {
  ALLOW = 'ALLOW',
  REQUIRE_REVIEW = 'REQUIRE_REVIEW',
  BLOCK = 'BLOCK',
}

export interface EditorialPolicyResult {
  readonly decision: EditorialDecision;
  readonly reasons: readonly string[];
}

const hasRequiredSections = (story: CanonicalStory): boolean => {
  const keys = new Set(story.sections.map((section) => section.key));
  return (
    keys.has('SUMMARY') &&
    keys.has('WHAT_HAPPENED') &&
    keys.has('WHY_IT_MATTERS') &&
    keys.has('PRACTICAL_IMPACT') &&
    keys.has('ORBI_LENS')
  );
};

export const evaluateCanonicalStory = (story: CanonicalStory): EditorialPolicyResult => {
  const reasons: string[] = [];

  if (!story.headline.trim()) reasons.push('Headline is required.');
  if (!story.dek.trim()) reasons.push('Dek is required.');
  if (!story.slug.trim()) reasons.push('Slug is required.');
  if (!hasRequiredSections(story)) reasons.push('Required editorial sections are missing.');
  if (story.sourceRefs.length === 0) reasons.push('At least one source reference is required.');
  if (story.orbiScore < 0 || story.orbiScore > 100) reasons.push('ORBI score must be between 0 and 100.');

  if (story.riskLevel === RiskLevel.CRITICAL) {
    return { decision: EditorialDecision.BLOCK, reasons: [...reasons, 'Critical risk cannot be published automatically.'] };
  }

  if (story.status === CanonicalStoryStatus.BLOCKED || story.status === CanonicalStoryStatus.REJECTED) {
    return { decision: EditorialDecision.BLOCK, reasons: [...reasons, `Story status is ${story.status}.`] };
  }

  if (reasons.length > 0) {
    return { decision: EditorialDecision.BLOCK, reasons };
  }

  if (
    story.riskLevel === RiskLevel.HIGH ||
    story.verificationConfidence === VerificationConfidence.MODERATE ||
    story.verificationConfidence === VerificationConfidence.LOW ||
    story.verificationConfidence === VerificationConfidence.VERY_LOW
  ) {
    return { decision: EditorialDecision.REQUIRE_REVIEW, reasons: ['Risk or verification confidence requires human review.'] };
  }

  return { decision: EditorialDecision.ALLOW, reasons: [] };
};

export const validateSocialPackage = (socialPackage: SocialPackage): readonly string[] => {
  const errors: string[] = [];
  const length = evaluateSocialPackageLengthConsistency(socialPackage);

  if (!socialPackage.socialHeadline.trim()) errors.push('Social headline is required.');
  if (!socialPackage.copy.trim()) errors.push('Social copy is required.');
  if (!length.storedCountMatches) errors.push('Stored character count does not match copy length.');
  if (!length.withinHardLimit) errors.push('Social copy exceeds the 2200 character hard limit.');
  if (!length.statusCompatible) errors.push('Social package cannot be READY when copy exceeds the 2200 character hard limit.');
  if (socialPackage.imageAspectRatio !== '16:9') errors.push('V1 social image must use 16:9 aspect ratio.');

  return errors;
};
