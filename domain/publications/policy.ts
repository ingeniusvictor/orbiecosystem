import { RiskLevel, SystemMode } from '../common/enums';
import type { CanonicalStory } from '../editorial/canonical-story';
import { CanonicalStoryStatus } from '../editorial/canonical-story';
import { PublicationChannel, PublicationStatus } from './publication';

export enum PublicationDecision {
  ALLOW = 'ALLOW',
  REQUIRE_REVIEW = 'REQUIRE_REVIEW',
  BLOCK = 'BLOCK',
  DEFER = 'DEFER',
}

export interface PublicationGateInput {
  readonly story: CanonicalStory;
  readonly channel: PublicationChannel;
  readonly currentStatus: PublicationStatus;
  readonly systemMode: SystemMode;
  readonly publishingEnabled: boolean;
  readonly channelEnabled: boolean;
  readonly duplicateIdempotencyKeyExists: boolean;
  readonly retryCount: number;
  readonly maxRetries: number;
}

export interface PublicationGateResult {
  readonly decision: PublicationDecision;
  readonly reasons: readonly string[];
}

export function evaluatePublicationGate(input: PublicationGateInput): PublicationGateResult {
  const reasons: string[] = [];

  if (input.systemMode === SystemMode.EMERGENCY_STOP || input.systemMode === SystemMode.MAINTENANCE) {
    return { decision: PublicationDecision.BLOCK, reasons: ['SYSTEM_MODE_BLOCKS_PUBLICATION'] };
  }

  if (input.systemMode === SystemMode.READ_ONLY) {
    return { decision: PublicationDecision.DEFER, reasons: ['SYSTEM_IS_READ_ONLY'] };
  }

  if (!input.publishingEnabled || !input.channelEnabled) {
    return { decision: PublicationDecision.BLOCK, reasons: ['PUBLISHING_DISABLED'] };
  }

  if (input.duplicateIdempotencyKeyExists) {
    return { decision: PublicationDecision.BLOCK, reasons: ['DUPLICATE_IDEMPOTENCY_KEY'] };
  }

  if (input.retryCount >= input.maxRetries) {
    return { decision: PublicationDecision.BLOCK, reasons: ['MAX_RETRIES_REACHED'] };
  }

  if (input.story.riskLevel === RiskLevel.CRITICAL) {
    return { decision: PublicationDecision.BLOCK, reasons: ['CRITICAL_RISK'] };
  }

  if (input.story.riskLevel === RiskLevel.HIGH) {
    return { decision: PublicationDecision.REQUIRE_REVIEW, reasons: ['HIGH_RISK'] };
  }

  if (input.story.status !== CanonicalStoryStatus.APPROVED && input.story.status !== CanonicalStoryStatus.PUBLISHED) {
    reasons.push('STORY_NOT_APPROVED');
  }

  if (input.channel === PublicationChannel.FACEBOOK || input.channel === PublicationChannel.INSTAGRAM) {
    return {
      decision: PublicationDecision.REQUIRE_REVIEW,
      reasons: [...reasons, 'SOCIAL_PUBLICATION_IS_MANUAL_IN_V1'],
    };
  }

  if (reasons.length > 0) {
    return { decision: PublicationDecision.DEFER, reasons };
  }

  return { decision: PublicationDecision.ALLOW, reasons: [] };
}

export function buildPublicationIdempotencyValue(input: {
  readonly channel: PublicationChannel;
  readonly accountId: string;
  readonly storyId: string;
  readonly slotKey: string;
}): string {
  return `${input.channel}:${input.accountId}:${input.storyId}:${input.slotKey}`;
}
