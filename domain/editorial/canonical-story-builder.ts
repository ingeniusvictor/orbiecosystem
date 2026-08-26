import type { ContentCategory, RiskLevel, VerificationConfidence } from '../common/enums';
import type {
  CanonicalStoryId,
  EventId,
  IsoUtcDateTime,
  OrganizationId,
  VerificationRecordId,
} from '../common/types';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
  type CanonicalStorySection,
  type CanonicalStorySourceRef,
} from './canonical-story';

export const CANONICAL_HEADLINE_MAX_CODEPOINTS = 120;
export const CANONICAL_DEK_MAX_CODEPOINTS = 220;
export const CANONICAL_SLUG_MAX_CODEPOINTS = 100;

export interface VerifiedEditorialClaim {
  readonly key: string;
  readonly statement: string;
}

export interface VerifiedEditorialSource extends CanonicalStorySourceRef {
  readonly sourceKey: string;
}

export interface CanonicalStorySectionProposal {
  readonly key: CanonicalStorySection['key'];
  readonly heading: string;
  readonly body: string;
  readonly claimKeys: readonly string[];
  readonly sourceKeys: readonly string[];
}

export interface CanonicalStoryProposal {
  readonly headline: string;
  readonly dek: string;
  readonly slug: string;
  readonly primaryCategory: ContentCategory;
  readonly secondaryCategories: readonly ContentCategory[];
  readonly tone: EditorialTone;
  readonly format: ContentFormat;
  readonly sections: readonly CanonicalStorySectionProposal[];
  readonly sourceKeys: readonly string[];
}

export interface CanonicalStoryBuilderInput {
  readonly id: CanonicalStoryId;
  readonly organizationId: OrganizationId;
  readonly eventId: EventId;
  readonly verificationRecordId: VerificationRecordId;
  readonly proposal: CanonicalStoryProposal;
  readonly verifiedClaims: readonly VerifiedEditorialClaim[];
  readonly verifiedSources: readonly VerifiedEditorialSource[];
  readonly verificationConfidence: VerificationConfidence;
  readonly riskLevel: RiskLevel;
  readonly orbiScore: number;
  readonly socialScore: number | null;
  readonly shortScore: number | null;
  readonly createdAt: IsoUtcDateTime;
}

const REQUIRED_SECTIONS: readonly CanonicalStorySection['key'][] = [
  'SUMMARY',
  'WHAT_HAPPENED',
  'WHY_IT_MATTERS',
  'PRACTICAL_IMPACT',
  'ORBI_LENS',
];

const codePointLength = (value: string): number => [...value].length;

const normalizeKey = (value: string): string => value.trim().toLowerCase();

const assertNonEmpty = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const assertMaxLength = (label: string, value: string, max: number): void => {
  if (codePointLength(value) > max) {
    throw new RangeError(`${label} must not exceed ${max} code points.`);
  }
};

const assertScore = (label: string, value: number | null): void => {
  if (value === null) return;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${label} must be null or between 0 and 100.`);
  }
};

const assertSlug = (slug: string): void => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new RangeError('Canonical story slug must be lowercase kebab-case.');
  }
  assertMaxLength('Canonical story slug', slug, CANONICAL_SLUG_MAX_CODEPOINTS);
};

export const buildCanonicalStory = (input: CanonicalStoryBuilderInput): CanonicalStory => {
  const headline = assertNonEmpty('Canonical story headline', input.proposal.headline);
  const dek = assertNonEmpty('Canonical story dek', input.proposal.dek);
  const slug = assertNonEmpty('Canonical story slug', input.proposal.slug);
  assertMaxLength('Canonical story headline', headline, CANONICAL_HEADLINE_MAX_CODEPOINTS);
  assertMaxLength('Canonical story dek', dek, CANONICAL_DEK_MAX_CODEPOINTS);
  assertSlug(slug);
  assertScore('ORBI score', input.orbiScore);
  assertScore('Social score', input.socialScore);
  assertScore('Short score', input.shortScore);

  const claimKeys = new Set(
    input.verifiedClaims.map((claim) => normalizeKey(assertNonEmpty('Verified claim key', claim.key))),
  );
  const sourcesByKey = new Map(
    input.verifiedSources.map((source) => [normalizeKey(assertNonEmpty('Verified source key', source.sourceKey)), source]),
  );

  const sectionKeys = new Set(input.proposal.sections.map((section) => section.key));
  for (const required of REQUIRED_SECTIONS) {
    if (!sectionKeys.has(required)) {
      throw new RangeError(`Canonical story section ${required} is required.`);
    }
  }

  const sections: CanonicalStorySection[] = input.proposal.sections.map((section) => {
    const heading = assertNonEmpty(`Section ${section.key} heading`, section.heading);
    const body = assertNonEmpty(`Section ${section.key} body`, section.body);

    if (section.claimKeys.length === 0) {
      throw new RangeError(`Section ${section.key} must declare at least one grounded claim.`);
    }
    for (const claimKey of section.claimKeys) {
      if (!claimKeys.has(normalizeKey(claimKey))) {
        throw new RangeError(`Section ${section.key} references unverified claim ${claimKey}.`);
      }
    }
    if (section.sourceKeys.length === 0) {
      throw new RangeError(`Section ${section.key} must declare at least one verified source.`);
    }
    for (const sourceKey of section.sourceKeys) {
      if (!sourcesByKey.has(normalizeKey(sourceKey))) {
        throw new RangeError(`Section ${section.key} references unverified source ${sourceKey}.`);
      }
    }

    return { key: section.key, heading, body };
  });

  const uniqueRequestedSourceKeys = [
    ...new Set(input.proposal.sourceKeys.map(normalizeKey).filter(Boolean)),
  ];
  if (uniqueRequestedSourceKeys.length === 0) {
    throw new RangeError('Canonical story must declare at least one verified source.');
  }

  const sourceRefs = uniqueRequestedSourceKeys.map((sourceKey) => {
    const source = sourcesByKey.get(sourceKey);
    if (!source) {
      throw new RangeError(`Canonical story references unverified source ${sourceKey}.`);
    }
    return {
      label: assertNonEmpty('Canonical story source label', source.label),
      url: assertNonEmpty('Canonical story source URL', source.url),
      isPrimary: source.isPrimary,
    };
  });

  if (!sourceRefs.some((source) => source.isPrimary)) {
    throw new RangeError('Canonical story requires at least one verified primary source.');
  }

  return {
    id: input.id,
    organizationId: input.organizationId,
    eventId: input.eventId,
    verificationRecordId: input.verificationRecordId,
    status: CanonicalStoryStatus.DRAFT_READY,
    headline,
    dek,
    slug,
    primaryCategory: input.proposal.primaryCategory,
    secondaryCategories: [...new Set(input.proposal.secondaryCategories)],
    tone: input.proposal.tone,
    format: input.proposal.format,
    sections,
    sourceRefs,
    verificationConfidence: input.verificationConfidence,
    riskLevel: input.riskLevel,
    orbiScore: input.orbiScore,
    socialScore: input.socialScore,
    shortScore: input.shortScore,
    canonicalImageAssetId: null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    publishedAt: null,
  };
};
