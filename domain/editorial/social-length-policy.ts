import {
  SOCIAL_COPY_HARD_LIMIT,
  SOCIAL_COPY_TARGET_MAX,
  SOCIAL_COPY_TARGET_MIN,
  SOCIAL_COPY_WARNING_MAX,
  SocialPackageStatus,
  type SocialPackage,
} from './social-package';

export enum SocialCopyLengthBand {
  BELOW_TARGET = 'BELOW_TARGET',
  TARGET = 'TARGET',
  WARNING = 'WARNING',
  HIGH = 'HIGH',
  BLOCKED = 'BLOCKED',
}

export interface SocialCopyLengthAssessment {
  readonly characterCount: number;
  readonly band: SocialCopyLengthBand;
  readonly withinHardLimit: boolean;
  readonly readyEligible: boolean;
  readonly reasons: readonly string[];
}

export const countSocialCopyCharacters = (copy: string): number => [...copy].length;

export const classifySocialCopyLength = (characterCount: number): SocialCopyLengthBand => {
  if (!Number.isInteger(characterCount) || characterCount < 0) {
    throw new RangeError('SOCIAL_COPY_CHARACTER_COUNT_INVALID');
  }
  if (characterCount > SOCIAL_COPY_HARD_LIMIT) return SocialCopyLengthBand.BLOCKED;
  if (characterCount > SOCIAL_COPY_WARNING_MAX) return SocialCopyLengthBand.HIGH;
  if (characterCount > SOCIAL_COPY_TARGET_MAX) return SocialCopyLengthBand.WARNING;
  if (characterCount >= SOCIAL_COPY_TARGET_MIN) return SocialCopyLengthBand.TARGET;
  return SocialCopyLengthBand.BELOW_TARGET;
};

export const assessSocialCopyLength = (copy: string): SocialCopyLengthAssessment => {
  const characterCount = countSocialCopyCharacters(copy);
  const band = classifySocialCopyLength(characterCount);
  const reasons: string[] = [];

  if (band === SocialCopyLengthBand.BELOW_TARGET) reasons.push('SOCIAL_COPY_BELOW_TARGET');
  if (band === SocialCopyLengthBand.WARNING) reasons.push('SOCIAL_COPY_ABOVE_TARGET');
  if (band === SocialCopyLengthBand.HIGH) reasons.push('SOCIAL_COPY_HIGH_LENGTH');
  if (band === SocialCopyLengthBand.BLOCKED) reasons.push('SOCIAL_COPY_HARD_LIMIT_EXCEEDED');

  return {
    characterCount,
    band,
    withinHardLimit: band !== SocialCopyLengthBand.BLOCKED,
    readyEligible: band !== SocialCopyLengthBand.BLOCKED,
    reasons,
  };
};

export const evaluateSocialPackageLengthConsistency = (
  socialPackage: SocialPackage,
): SocialCopyLengthAssessment & {
  readonly storedCountMatches: boolean;
  readonly statusCompatible: boolean;
} => {
  const assessment = assessSocialCopyLength(socialPackage.copy);
  const storedCountMatches = socialPackage.characterCount === assessment.characterCount;
  const statusCompatible = !(
    socialPackage.status === SocialPackageStatus.READY && !assessment.readyEligible
  );

  return {
    ...assessment,
    storedCountMatches,
    statusCompatible,
  };
};
