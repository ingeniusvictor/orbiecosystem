import type { ContentCategory } from '../common/enums';
import type { Brand, CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../common/types';

export type VisualAssetId = Brand<string, 'VisualAssetId'>;

export enum VisualAssetOrigin {
  AI_GENERATED = 'AI_GENERATED',
  PROVIDED_EDITORIAL = 'PROVIDED_EDITORIAL',
  LICENSED_SOURCE = 'LICENSED_SOURCE',
  VERIFIED_DOCUMENTARY = 'VERIFIED_DOCUMENTARY',
}

export enum VisualTruthLabel {
  EDITORIAL_CONCEPT = 'EDITORIAL_CONCEPT',
  TECH_VISUALIZATION = 'TECH_VISUALIZATION',
  ILLUSTRATIVE_RENDER = 'ILLUSTRATIVE_RENDER',
  DOCUMENTARY_EVIDENCE = 'DOCUMENTARY_EVIDENCE',
}

export enum VisualAssetStatus {
  PROPOSED = 'PROPOSED',
  GENERATED = 'GENERATED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
}

export interface VisualAsset {
  readonly id: VisualAssetId;
  readonly organizationId: OrganizationId;
  readonly canonicalStoryId: CanonicalStoryId;
  readonly status: VisualAssetStatus;
  readonly origin: VisualAssetOrigin;
  readonly truthLabel: VisualTruthLabel;
  readonly category: ContentCategory;
  readonly aspectRatio: '16:9';
  readonly width: number | null;
  readonly height: number | null;
  readonly assetUrl: string | null;
  readonly overlayText: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export const isAiGeneratedVisualLabelAllowed = (label: VisualTruthLabel): boolean =>
  label === VisualTruthLabel.EDITORIAL_CONCEPT ||
  label === VisualTruthLabel.TECH_VISUALIZATION ||
  label === VisualTruthLabel.ILLUSTRATIVE_RENDER;

export const validateVisualOriginLabelPair = (
  origin: VisualAssetOrigin,
  label: VisualTruthLabel,
): readonly string[] => {
  const errors: string[] = [];

  if (origin === VisualAssetOrigin.AI_GENERATED && !isAiGeneratedVisualLabelAllowed(label)) {
    errors.push('AI_GENERATED_VISUAL_CANNOT_BE_DOCUMENTARY_EVIDENCE');
  }

  if (
    label === VisualTruthLabel.DOCUMENTARY_EVIDENCE &&
    origin !== VisualAssetOrigin.VERIFIED_DOCUMENTARY
  ) {
    errors.push('DOCUMENTARY_EVIDENCE_REQUIRES_VERIFIED_DOCUMENTARY_ORIGIN');
  }

  return errors;
};
