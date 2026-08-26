import { ContentCategory } from '../common/enums';
import { ContentFormat, type CanonicalStory } from './canonical-story';
import { countSocialCopyCharacters } from './social-length-policy';
import {
  SocialContentSection,
  SocialPackageStatus,
  type SocialPackage,
  type SocialSectionContent,
} from './social-package';
import { assembleSocialCopy } from './social-copy-builder';

export const SOCIAL_HASHTAG_MAX = 6;

const BRAND_HASHTAGS = ['#ORBIEcosystem', '#ORBINews'] as const;

const CATEGORY_HASHTAGS: Readonly<Record<ContentCategory, readonly string[]>> = {
  [ContentCategory.AI]: ['#InteligenciaArtificial', '#IA'],
  [ContentCategory.TECH]: ['#Tecnologia'],
  [ContentCategory.SOLAR]: ['#EnergiaSolar'],
  [ContentCategory.ENERGY]: ['#Energia'],
  [ContentCategory.ROBOTICS]: ['#Robotica'],
  [ContentCategory.AUTOMATION]: ['#Automatizacion'],
  [ContentCategory.CYBERSECURITY]: ['#Ciberseguridad'],
  [ContentCategory.SOFTWARE]: ['#Software'],
  [ContentCategory.HARDWARE]: ['#Hardware'],
  [ContentCategory.SCIENCE]: ['#Ciencia'],
  [ContentCategory.STARTUPS]: ['#Startups'],
  [ContentCategory.SPACE]: ['#Espacio'],
  [ContentCategory.FUTURE_TECH]: ['#TecnologiaDelFuturo'],
};

const CTA_BY_FORMAT: Readonly<Record<ContentFormat, string>> = {
  [ContentFormat.NEWS_POST]: 'Lee la nota completa en ORBI News y comparte tu perspectiva.',
  [ContentFormat.BREAKING_NEWS]: 'Sigue la cobertura completa en ORBI News y mantente atento a nuevas actualizaciones.',
  [ContentFormat.EXPLAINER]: 'Lee la explicación completa en ORBI News y sigue aprendiendo con nosotros.',
  [ContentFormat.ANALYSIS]: 'Revisa el análisis completo en ORBI News y cuéntanos qué implicaciones ves.',
  [ContentFormat.EVENT_UPDATE]: 'Revisa la actualización completa en ORBI News y sigue la evolución de esta noticia.',
  [ContentFormat.SHORT_SCRIPT]: 'Conoce el contexto completo en ORBI News y compártelo con quien pueda servirle.',
};

const normalizeHashtagKey = (value: string): string => value.normalize('NFKC').toLocaleLowerCase('es');

const dedupeHashtags = (hashtags: readonly string[]): readonly string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const hashtag of hashtags) {
    const key = normalizeHashtagKey(hashtag);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(hashtag);
  }
  return result;
};

export const selectSocialCta = (story: CanonicalStory): string => CTA_BY_FORMAT[story.format];

export const selectSocialHashtags = (story: CanonicalStory): readonly string[] => {
  const categoryOrder = [story.primaryCategory, ...story.secondaryCategories];
  const categoryTags = categoryOrder.flatMap((category) => CATEGORY_HASHTAGS[category] ?? []);
  return dedupeHashtags([...BRAND_HASHTAGS, ...categoryTags]).slice(0, SOCIAL_HASHTAG_MAX);
};

const replaceCtaSection = (
  sections: readonly SocialSectionContent[],
  ctaText: string,
): readonly SocialSectionContent[] => {
  let replaced = false;
  const next = sections.map((section) => {
    if (section.section !== SocialContentSection.CTA) return section;
    replaced = true;
    return { ...section, text: ctaText };
  });
  if (!replaced) throw new RangeError('SOCIAL_CTA_SECTION_REQUIRED');
  return next;
};

export const assembleSocialCopyWithHashtags = (
  sections: readonly SocialSectionContent[],
  hashtags: readonly string[],
): string => {
  const body = assembleSocialCopy(sections);
  return hashtags.length > 0 ? `${body}\n\n${hashtags.join(' ')}` : body;
};

/**
 * Applies the deterministic V1 CTA and hashtag policy to a SocialPackage draft.
 * It never upgrades content readiness; status remains DRAFT.
 */
export const applySocialDistributionPolicy = (
  story: CanonicalStory,
  socialPackage: SocialPackage,
): SocialPackage => {
  if (socialPackage.canonicalStoryId !== story.id) {
    throw new RangeError('SOCIAL_PACKAGE_STORY_MISMATCH');
  }
  if (socialPackage.organizationId !== story.organizationId) {
    throw new RangeError('SOCIAL_PACKAGE_ORGANIZATION_MISMATCH');
  }
  if (socialPackage.status !== SocialPackageStatus.DRAFT) {
    throw new RangeError('SOCIAL_DISTRIBUTION_POLICY_REQUIRES_DRAFT');
  }

  const ctaText = selectSocialCta(story);
  const hashtags = selectSocialHashtags(story);
  const sections = replaceCtaSection(socialPackage.sections, ctaText);
  const copy = assembleSocialCopyWithHashtags(sections, hashtags);

  return {
    ...socialPackage,
    status: SocialPackageStatus.DRAFT,
    sections,
    copy,
    hashtags,
    characterCount: countSocialCopyCharacters(copy),
  };
};
