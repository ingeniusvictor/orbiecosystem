import {
  VisualAssetOrigin,
  VisualTruthLabel,
  validateVisualOriginLabelPair,
} from './visual-asset';

export const VISUAL_OVERLAY_MIN_WORDS = 3;
export const VISUAL_OVERLAY_MAX_WORDS = 7;
export const VISUAL_OVERLAY_MAX_CODEPOINTS = 60;

const normalize = (value: string): string => value.trim().replace(/\s+/g, ' ');
const codePointLength = (value: string): number => [...value].length;
const wordCount = (value: string): number => normalize(value).split(' ').filter(Boolean).length;

export interface VisualDimensions {
  readonly width: number;
  readonly height: number;
}

export interface VisualOverlayValidationResult {
  readonly valid: boolean;
  readonly normalizedText: string;
  readonly wordCount: number;
  readonly reasons: readonly string[];
}

export const validateVisualOverlay = (overlayText: string): VisualOverlayValidationResult => {
  const normalizedText = normalize(overlayText);
  const words = wordCount(normalizedText);
  const reasons: string[] = [];

  if (!normalizedText) reasons.push('VISUAL_OVERLAY_REQUIRED');
  if (words < VISUAL_OVERLAY_MIN_WORDS || words > VISUAL_OVERLAY_MAX_WORDS) {
    reasons.push('VISUAL_OVERLAY_WORD_COUNT_OUT_OF_RANGE');
  }
  if (codePointLength(normalizedText) > VISUAL_OVERLAY_MAX_CODEPOINTS) {
    reasons.push('VISUAL_OVERLAY_TOO_LONG');
  }
  if (/https?:\/\/|www\./i.test(normalizedText)) reasons.push('VISUAL_OVERLAY_URL_NOT_ALLOWED');
  if (/\r|\n/.test(overlayText)) reasons.push('VISUAL_OVERLAY_LINE_BREAK_NOT_ALLOWED');

  return {
    valid: reasons.length === 0,
    normalizedText,
    wordCount: words,
    reasons,
  };
};

export interface VisualAspectRatioValidationResult {
  readonly valid: boolean;
  readonly aspectRatio: number;
  readonly reasons: readonly string[];
}

export const validateVisualDimensions16By9 = (
  dimensions: VisualDimensions,
): VisualAspectRatioValidationResult => {
  if (
    !Number.isInteger(dimensions.width) ||
    !Number.isInteger(dimensions.height) ||
    dimensions.width <= 0 ||
    dimensions.height <= 0
  ) {
    return {
      valid: false,
      aspectRatio: Number.NaN,
      reasons: ['VISUAL_DIMENSIONS_MUST_BE_POSITIVE_INTEGERS'],
    };
  }

  const aspectRatio = dimensions.width / dimensions.height;
  const valid = dimensions.width * 9 === dimensions.height * 16;
  return {
    valid,
    aspectRatio,
    reasons: valid ? [] : ['VISUAL_ASPECT_RATIO_MUST_BE_16_9'],
  };
};

export enum VisualSafetySignal {
  FABRICATED_DOCUMENTARY_SCENE = 'FABRICATED_DOCUMENTARY_SCENE',
  UNSUPPORTED_QUOTE_OR_STATISTIC = 'UNSUPPORTED_QUOTE_OR_STATISTIC',
  DECEPTIVE_PRODUCT_OR_UI_SCREENSHOT = 'DECEPTIVE_PRODUCT_OR_UI_SCREENSHOT',
  FALSE_EVENT_LOCATION_OR_SCENE = 'FALSE_EVENT_LOCATION_OR_SCENE',
  MISLEADING_BEFORE_AFTER = 'MISLEADING_BEFORE_AFTER',
  UNVERIFIED_REAL_PERSON_DEPICTION = 'UNVERIFIED_REAL_PERSON_DEPICTION',
  UNSUPPORTED_BRAND_OR_LOGO = 'UNSUPPORTED_BRAND_OR_LOGO',
  SENSATIONAL_EMERGENCY_TREATMENT = 'SENSATIONAL_EMERGENCY_TREATMENT',
}

export enum VisualSafetyDecision {
  ALLOW = 'ALLOW',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  BLOCK = 'BLOCK',
}

export interface VisualSafetyGateInput {
  readonly origin: VisualAssetOrigin;
  readonly truthLabel: VisualTruthLabel;
  readonly dimensions: VisualDimensions;
  readonly overlayText: string;
  readonly signals: readonly VisualSafetySignal[];
}

export interface VisualSafetyGateResult {
  readonly decision: VisualSafetyDecision;
  readonly reasons: readonly string[];
}

const BLOCKING_SIGNALS = new Set<VisualSafetySignal>([
  VisualSafetySignal.FABRICATED_DOCUMENTARY_SCENE,
  VisualSafetySignal.UNSUPPORTED_QUOTE_OR_STATISTIC,
  VisualSafetySignal.DECEPTIVE_PRODUCT_OR_UI_SCREENSHOT,
  VisualSafetySignal.FALSE_EVENT_LOCATION_OR_SCENE,
  VisualSafetySignal.MISLEADING_BEFORE_AFTER,
]);

const REVIEW_SIGNALS = new Set<VisualSafetySignal>([
  VisualSafetySignal.UNVERIFIED_REAL_PERSON_DEPICTION,
  VisualSafetySignal.UNSUPPORTED_BRAND_OR_LOGO,
  VisualSafetySignal.SENSATIONAL_EMERGENCY_TREATMENT,
]);

export const evaluateVisualSafetyGate = (
  input: VisualSafetyGateInput,
): VisualSafetyGateResult => {
  const reasons: string[] = [];

  reasons.push(...validateVisualOriginLabelPair(input.origin, input.truthLabel));
  reasons.push(...validateVisualDimensions16By9(input.dimensions).reasons);
  reasons.push(...validateVisualOverlay(input.overlayText).reasons);

  const uniqueSignals = [...new Set(input.signals)];
  for (const signal of uniqueSignals) {
    if (BLOCKING_SIGNALS.has(signal)) reasons.push(`VISUAL_SAFETY_BLOCK:${signal}`);
  }

  if (reasons.length > 0) {
    return {
      decision: VisualSafetyDecision.BLOCK,
      reasons: [...new Set(reasons)],
    };
  }

  const reviewReasons = uniqueSignals
    .filter((signal) => REVIEW_SIGNALS.has(signal))
    .map((signal) => `VISUAL_SAFETY_REVIEW:${signal}`);

  if (reviewReasons.length > 0) {
    return {
      decision: VisualSafetyDecision.REQUIRE_HUMAN_REVIEW,
      reasons: reviewReasons,
    };
  }

  return {
    decision: VisualSafetyDecision.ALLOW,
    reasons: ['VISUAL_SAFETY_REQUIREMENTS_SATISFIED'],
  };
};
