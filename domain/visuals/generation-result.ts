import type { IsoUtcDateTime } from '../common/types';
import type { VisualSafetySignal } from './validation';

export enum VisualGenerationStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
}

export interface VisualGenerationProviderMetadata {
  readonly providerKey: string;
  readonly modelKey: string | null;
  readonly requestId: string | null;
}

export interface VisualGenerationResult {
  readonly status: VisualGenerationStatus;
  readonly provider: VisualGenerationProviderMetadata;
  readonly assetUrl: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly mimeType: string | null;
  readonly safetySignals: readonly VisualSafetySignal[];
  readonly errorCode: string | null;
  readonly generatedAt: IsoUtcDateTime | null;
}

export interface SuccessfulVisualGenerationInput {
  readonly providerKey: string;
  readonly modelKey?: string | null;
  readonly requestId?: string | null;
  readonly assetUrl: string;
  readonly width: number;
  readonly height: number;
  readonly mimeType: string;
  readonly safetySignals?: readonly VisualSafetySignal[];
  readonly generatedAt: IsoUtcDateTime;
}

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

export const normalizeSuccessfulVisualGeneration = (
  input: SuccessfulVisualGenerationInput,
): VisualGenerationResult => {
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width <= 0 || input.height <= 0) {
    throw new RangeError('Visual generation dimensions must be positive integers.');
  }

  return {
    status: VisualGenerationStatus.SUCCEEDED,
    provider: {
      providerKey: required('Visual provider key', input.providerKey),
      modelKey: input.modelKey?.trim() || null,
      requestId: input.requestId?.trim() || null,
    },
    assetUrl: required('Generated visual asset URL', input.assetUrl),
    width: input.width,
    height: input.height,
    mimeType: required('Generated visual MIME type', input.mimeType),
    safetySignals: [...new Set(input.safetySignals ?? [])],
    errorCode: null,
    generatedAt: input.generatedAt,
  };
};

export const failedVisualGeneration = (
  providerKey: string,
  errorCode: string,
): VisualGenerationResult => ({
  status: VisualGenerationStatus.FAILED,
  provider: { providerKey: required('Visual provider key', providerKey), modelKey: null, requestId: null },
  assetUrl: null,
  width: null,
  height: null,
  mimeType: null,
  safetySignals: [],
  errorCode: required('Visual generation error code', errorCode),
  generatedAt: null,
});

export const visualGenerationNotConfigured = (providerKey = 'NOT_CONFIGURED'): VisualGenerationResult => ({
  status: VisualGenerationStatus.NOT_CONFIGURED,
  provider: { providerKey: required('Visual provider key', providerKey), modelKey: null, requestId: null },
  assetUrl: null,
  width: null,
  height: null,
  mimeType: null,
  safetySignals: [],
  errorCode: 'IMAGE_GENERATION_NOT_CONFIGURED',
  generatedAt: null,
});
