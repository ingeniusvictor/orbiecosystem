import type { CanonicalStory } from '../editorial/canonical-story';
import { buildAiVisualPromptContract, type VisualPromptContract } from './prompt-contract';
import {
  VisualGenerationStatus,
  type VisualGenerationResult,
} from './generation-result';
import {
  VisualSafetyDecision,
  evaluateVisualSafetyGate,
  type VisualSafetyGateResult,
} from './validation';
import { VisualAssetOrigin, VisualTruthLabel } from './visual-asset';

export enum FullVisualDecision {
  ALLOW = 'ALLOW',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  DEFER = 'DEFER',
  BLOCK = 'BLOCK',
}

export interface FullVisualGateInput {
  readonly story: CanonicalStory;
  readonly subject: string;
  readonly editorialContext: string;
  readonly truthLabel: Exclude<VisualTruthLabel, VisualTruthLabel.DOCUMENTARY_EVIDENCE>;
  readonly overlayText: string;
  readonly factualEntityNames: readonly string[];
  readonly generationResult: VisualGenerationResult;
}

export interface FullVisualGateResult {
  readonly decision: FullVisualDecision;
  readonly promptContract: VisualPromptContract;
  readonly safety: VisualSafetyGateResult | null;
  readonly reasons: readonly string[];
}

export const evaluateFullVisualGate = (input: FullVisualGateInput): FullVisualGateResult => {
  const promptContract = buildAiVisualPromptContract({
    category: input.story.primaryCategory,
    subject: input.subject,
    editorialContext: input.editorialContext,
    truthLabel: input.truthLabel,
    overlayText: input.overlayText,
    factualEntityNames: input.factualEntityNames,
  });

  if (input.generationResult.status === VisualGenerationStatus.NOT_CONFIGURED) {
    return {
      decision: FullVisualDecision.DEFER,
      promptContract,
      safety: null,
      reasons: ['IMAGE_GENERATION_NOT_CONFIGURED'],
    };
  }

  if (input.generationResult.status === VisualGenerationStatus.FAILED) {
    return {
      decision: FullVisualDecision.DEFER,
      promptContract,
      safety: null,
      reasons: [
        'VISUAL_GENERATION_FAILED',
        ...(input.generationResult.errorCode ? [input.generationResult.errorCode] : []),
      ],
    };
  }

  if (
    !input.generationResult.assetUrl ||
    input.generationResult.width === null ||
    input.generationResult.height === null ||
    !input.generationResult.mimeType ||
    !input.generationResult.generatedAt
  ) {
    return {
      decision: FullVisualDecision.BLOCK,
      promptContract,
      safety: null,
      reasons: ['SUCCESSFUL_VISUAL_RESULT_INCOMPLETE'],
    };
  }

  const safety = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: input.truthLabel,
    dimensions: {
      width: input.generationResult.width,
      height: input.generationResult.height,
    },
    overlayText: input.overlayText,
    signals: input.generationResult.safetySignals,
  });

  if (safety.decision === VisualSafetyDecision.BLOCK) {
    return {
      decision: FullVisualDecision.BLOCK,
      promptContract,
      safety,
      reasons: safety.reasons,
    };
  }

  if (safety.decision === VisualSafetyDecision.REQUIRE_HUMAN_REVIEW) {
    return {
      decision: FullVisualDecision.REQUIRE_HUMAN_REVIEW,
      promptContract,
      safety,
      reasons: safety.reasons,
    };
  }

  return {
    decision: FullVisualDecision.ALLOW,
    promptContract,
    safety,
    reasons: ['FULL_VISUAL_GATE_REQUIREMENTS_SATISFIED'],
  };
};
