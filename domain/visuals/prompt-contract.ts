import type { ContentCategory } from '../common/enums';
import { getCategoryVisualProfile, ORBI_NEWS_VISUAL_PROFILE } from './profile';
import { VisualTruthLabel, isAiGeneratedVisualLabelAllowed } from './visual-asset';

export interface VisualPromptRequest {
  readonly category: ContentCategory;
  readonly subject: string;
  readonly editorialContext: string;
  readonly truthLabel: VisualTruthLabel;
  readonly overlayText: string;
  readonly factualEntityNames: readonly string[];
}

export interface VisualPromptContract {
  readonly profileId: 'ORBI_NEWS_VISUAL_PROFILE_V1';
  readonly aspectRatio: '16:9';
  readonly category: ContentCategory;
  readonly truthLabel: VisualTruthLabel;
  readonly prompt: string;
  readonly negativeConstraints: readonly string[];
  readonly overlayText: string;
}

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ');

const countWords = (value: string): number =>
  normalize(value).split(' ').filter(Boolean).length;

const uniqueNormalized = (values: readonly string[]): readonly string[] =>
  [...new Set(values.map(normalize).filter(Boolean))];

export const buildAiVisualPromptContract = (
  request: VisualPromptRequest,
): VisualPromptContract => {
  const subject = normalize(request.subject);
  const editorialContext = normalize(request.editorialContext);
  const overlayText = normalize(request.overlayText);

  if (!subject) throw new RangeError('Visual subject is required.');
  if (!editorialContext) throw new RangeError('Visual editorial context is required.');
  if (!isAiGeneratedVisualLabelAllowed(request.truthLabel)) {
    throw new RangeError('AI-generated visuals cannot use DOCUMENTARY_EVIDENCE truth labeling.');
  }

  const overlayWords = countWords(overlayText);
  if (overlayWords < 3 || overlayWords > 7) {
    throw new RangeError('Visual overlay text must contain between 3 and 7 words.');
  }

  const categoryProfile = getCategoryVisualProfile(request.category);
  const factualEntityNames = uniqueNormalized(request.factualEntityNames);
  const entityConstraint = factualEntityNames.length > 0
    ? `Use only these named factual entities if names are shown: ${factualEntityNames.join(', ')}.`
    : 'Do not introduce named factual entities that were not supplied.';

  const labelInstruction =
    request.truthLabel === VisualTruthLabel.EDITORIAL_CONCEPT
      ? 'Treat the scene as an editorial concept, not a photograph of the actual event.'
      : request.truthLabel === VisualTruthLabel.TECH_VISUALIZATION
        ? 'Treat the scene as a technical visualization, not documentary evidence.'
        : 'Treat the scene as an illustrative render, not documentary evidence.';

  return {
    profileId: ORBI_NEWS_VISUAL_PROFILE.id,
    aspectRatio: ORBI_NEWS_VISUAL_PROFILE.aspectRatio,
    category: request.category,
    truthLabel: request.truthLabel,
    prompt: [
      `Create a 16:9 ORBI News editorial visual about: ${subject}.`,
      `Editorial context: ${editorialContext}.`,
      `Category direction: ${categoryProfile.subjectDirection}.`,
      `Atmosphere: ${categoryProfile.atmosphere}.`,
      `Composition: ${categoryProfile.compositionHint}.`,
      ...ORBI_NEWS_VISUAL_PROFILE.styleDirectives,
      labelInstruction,
      entityConstraint,
      `Reserve controlled headline-safe space for the overlay: “${overlayText}”.`,
      'Keep visible text minimal and do not render additional unsupported claims or quotes.',
    ].join(' '),
    negativeConstraints: [
      ...ORBI_NEWS_VISUAL_PROFILE.mandatoryConstraints,
      'no fabricated documentary photography',
      'no invented quotes or statistics',
      'no misleading breaking-news emergency treatment',
    ],
    overlayText,
  };
};
