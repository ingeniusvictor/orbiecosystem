import type { VerificationConfidence } from '../common/enums';
import type { IsoUtcDateTime, NewsItemId } from '../common/types';
import {
  EventStatus,
  type EventFingerprint,
  type EventRecord,
  type EventVersion,
} from './event';

export interface EventConsolidationInput {
  readonly current: EventRecord;
  readonly canonicalSummary: string;
  readonly confirmedEventDate: IsoUtcDateTime | null;
  readonly confidence: VerificationConfidence;
  readonly fingerprint: EventFingerprint;
  readonly evidenceNewsItemIds: readonly NewsItemId[];
  readonly updatedAt: IsoUtcDateTime;
}

export interface EventConsolidationResult {
  readonly event: EventRecord;
  readonly version: EventVersion | null;
  readonly changed: boolean;
  readonly changedFields: readonly string[];
}

const uniqueNewsItems = (ids: readonly NewsItemId[]): readonly NewsItemId[] =>
  [...new Set(ids)];

export const consolidateEvent = (
  input: EventConsolidationInput,
): EventConsolidationResult => {
  const changedFields: string[] = [];

  if (input.current.canonicalSummary !== input.canonicalSummary) {
    changedFields.push('canonicalSummary');
  }
  if (input.current.confirmedEventDate !== input.confirmedEventDate) {
    changedFields.push('confirmedEventDate');
  }
  if (input.current.confidence !== input.confidence) {
    changedFields.push('confidence');
  }
  if (input.current.fingerprint.fingerprintHash !== input.fingerprint.fingerprintHash) {
    changedFields.push('fingerprint');
  }

  if (changedFields.length === 0) {
    return {
      event: input.current,
      version: null,
      changed: false,
      changedFields: [],
    };
  }

  const nextVersion = input.current.version + 1;
  const updatedEvent: EventRecord = {
    ...input.current,
    canonicalSummary: input.canonicalSummary,
    confirmedEventDate: input.confirmedEventDate,
    confidence: input.confidence,
    fingerprint: input.fingerprint,
    status: EventStatus.UPDATED,
    version: nextVersion,
    updatedAt: input.updatedAt,
  };

  const version: EventVersion = {
    eventId: input.current.id,
    version: nextVersion,
    summary: input.canonicalSummary,
    status: EventStatus.UPDATED,
    eventDate: input.confirmedEventDate,
    changedFields,
    evidenceNewsItemIds: uniqueNewsItems(input.evidenceNewsItemIds),
    createdAt: input.updatedAt,
  };

  return {
    event: updatedEvent,
    version,
    changed: true,
    changedFields,
  };
};
