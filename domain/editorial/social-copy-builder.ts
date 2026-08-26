import type {
  IsoUtcDateTime,
  SocialPackageId,
} from '../common/types';
import {
  CanonicalStoryStatus,
  type CanonicalStory,
  type CanonicalStorySection,
} from './canonical-story';
import { countSocialCopyCharacters } from './social-length-policy';
import {
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialContentSection,
  SocialPackageStatus,
  type SocialPackage,
  type SocialSectionContent,
} from './social-package';

export interface SocialCopyBuilderInput {
  readonly id: SocialPackageId;
  readonly story: CanonicalStory;
  /** Opaque current persisted revision of the published CanonicalStory. */
  readonly storyRevision: string;
  readonly webArticleUrl: string;
  /** CTA is policy-owned and supplied by the caller. NA-09.5 does not invent CTA language. */
  readonly ctaText: string;
  readonly createdAt: IsoUtcDateTime;
}

const STORY_SECTION_MAP: Readonly<
  Record<
    Exclude<SocialContentSection, SocialContentSection.HOOK | SocialContentSection.CTA>,
    CanonicalStorySection['key']
  >
> = {
  [SocialContentSection.WHAT_HAPPENED]: 'WHAT_HAPPENED',
  [SocialContentSection.WHY_IT_MATTERS]: 'WHY_IT_MATTERS',
  [SocialContentSection.PRACTICAL_IMPLICATION]: 'PRACTICAL_IMPACT',
  [SocialContentSection.ORBI_LENS]: 'ORBI_LENS',
};

const normalizeRequiredText = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const normalizeStoryRevision = (revision: string): string =>
  normalizeRequiredText('Canonical story revision', revision);

const normalizePublicArticleUrl = (value: string): string => {
  const normalized = normalizeRequiredText('Public ORBI News article URL', value);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new RangeError('Public ORBI News article URL must be an absolute HTTP(S) URL.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new RangeError('Public ORBI News article URL must be an absolute HTTP(S) URL.');
  }
  return parsed.toString();
};

const getCanonicalSectionBody = (
  story: CanonicalStory,
  key: CanonicalStorySection['key'],
): string => {
  const section = story.sections.find((candidate) => candidate.key === key);
  if (!section) {
    throw new RangeError(`Canonical story section ${key} is required for social copy.`);
  }
  return normalizeRequiredText(`Canonical story section ${key}`, section.body);
};

const buildSections = (
  story: CanonicalStory,
  ctaText: string,
): readonly SocialSectionContent[] => [
  {
    section: SocialContentSection.HOOK,
    text: normalizeRequiredText('Social hook', story.headline),
  },
  ...(
    Object.entries(STORY_SECTION_MAP) as readonly [
      Exclude<SocialContentSection, SocialContentSection.HOOK | SocialContentSection.CTA>,
      CanonicalStorySection['key'],
    ][]
  ).map(([section, storyKey]) => ({
    section,
    text: getCanonicalSectionBody(story, storyKey),
  })),
  {
    section: SocialContentSection.CTA,
    text: normalizeRequiredText('Social CTA', ctaText),
  },
];

export const assembleSocialCopy = (sections: readonly SocialSectionContent[]): string =>
  sections.map((section) => section.text.trim()).join('\n\n');

/**
 * Deterministically transforms a published CanonicalStory into a DRAFT SocialPackage.
 * This builder has no authority to mark the package READY or to distribute it.
 */
export const buildSocialPackageDraft = (input: SocialCopyBuilderInput): SocialPackage => {
  if (input.story.status !== CanonicalStoryStatus.PUBLISHED || input.story.publishedAt === null) {
    throw new RangeError('Canonical story must be PUBLISHED before social copy can be built.');
  }

  const storyRevision = normalizeStoryRevision(input.storyRevision);
  const webArticleUrl = normalizePublicArticleUrl(input.webArticleUrl);
  const sections = buildSections(input.story, input.ctaText);
  const copy = assembleSocialCopy(sections);

  return {
    id: input.id,
    organizationId: input.story.organizationId,
    canonicalStoryId: input.story.id,
    status: SocialPackageStatus.DRAFT,
    targetPlatforms: [...SOCIAL_PACKAGE_V1_PLATFORMS],
    socialHeadline: normalizeRequiredText('Social headline', input.story.headline),
    sections,
    copy,
    hashtags: [],
    characterCount: countSocialCopyCharacters(copy),
    imageAspectRatio: '16:9',
    imageAssetId: null,
    webArticleUrl,
    provenance: {
      canonicalStoryId: input.story.id,
      canonicalStoryRevision: storyRevision,
      webArticleUrl,
    },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
};
