import test from 'node:test';
import assert from 'node:assert/strict';

import { VerificationConfidence } from '../../domain/common/enums';
import {
  EventStatus,
  EventType,
  buildEventFingerprint,
  consolidateEvent,
  type EventRecord,
} from '../../domain/events';

const now = '2026-08-26T05:50:00.000Z' as never;
const later = '2026-08-26T06:10:00.000Z' as never;
const eventId = 'event-1' as never;
const organizationId = 'org-1' as never;
const news1 = 'news-1' as never;
const news2 = 'news-2' as never;

const fingerprint = buildEventFingerprint({
  primaryEntity: 'OpenAI',
  eventType: EventType.MODEL_RELEASE,
  subject: 'GPT-6',
  eventDate: now,
  secondaryEntities: ['API'],
  location: 'San Francisco',
});

const current: EventRecord = {
  id: eventId,
  organizationId,
  status: EventStatus.CONFIRMED,
  eventType: EventType.MODEL_RELEASE,
  primaryEntity: 'openai',
  subject: 'gpt-6',
  canonicalSummary: 'OpenAI confirmed GPT-6.',
  firstObservedAt: now,
  eventDateCandidate: now,
  confirmedEventDate: now,
  confidence: VerificationConfidence.HIGH,
  fingerprint,
  version: 1,
  createdAt: now,
  updatedAt: now,
};

test('no material event change does not create a new version', () => {
  const result = consolidateEvent({
    current,
    canonicalSummary: current.canonicalSummary,
    confirmedEventDate: current.confirmedEventDate,
    confidence: current.confidence,
    fingerprint: current.fingerprint,
    evidenceNewsItemIds: [news1],
    updatedAt: later,
  });

  assert.equal(result.changed, false);
  assert.equal(result.version, null);
  assert.equal(result.event.version, 1);
  assert.equal(result.event.updatedAt, now);
});

test('material event change increments version and records changed fields', () => {
  const result = consolidateEvent({
    current,
    canonicalSummary: 'OpenAI confirmed GPT-6 with a revised release date.',
    confirmedEventDate: later,
    confidence: VerificationConfidence.VERY_HIGH,
    fingerprint,
    evidenceNewsItemIds: [news1, news2],
    updatedAt: later,
  });

  assert.equal(result.changed, true);
  assert.equal(result.event.version, 2);
  assert.equal(result.event.status, EventStatus.UPDATED);
  assert.equal(result.version?.version, 2);
  assert.deepEqual(result.changedFields, [
    'canonicalSummary',
    'confirmedEventDate',
    'confidence',
  ]);
  assert.deepEqual(result.version?.evidenceNewsItemIds, [news1, news2]);
});

test('event version evidence ids are deduplicated', () => {
  const result = consolidateEvent({
    current,
    canonicalSummary: 'OpenAI confirmed GPT-6 with more detail.',
    confirmedEventDate: current.confirmedEventDate,
    confidence: current.confidence,
    fingerprint: current.fingerprint,
    evidenceNewsItemIds: [news1, news1, news2, news2],
    updatedAt: later,
  });

  assert.deepEqual(result.version?.evidenceNewsItemIds, [news1, news2]);
});

test('fingerprint change is recorded as a versioned material change', () => {
  const nextFingerprint = buildEventFingerprint({
    primaryEntity: 'OpenAI',
    eventType: EventType.MODEL_RELEASE,
    subject: 'GPT-6',
    eventDate: later,
    secondaryEntities: ['API', 'ChatGPT'],
    location: 'San Francisco',
  });

  const result = consolidateEvent({
    current,
    canonicalSummary: current.canonicalSummary,
    confirmedEventDate: later,
    confidence: current.confidence,
    fingerprint: nextFingerprint,
    evidenceNewsItemIds: [news2],
    updatedAt: later,
  });

  assert.equal(result.changed, true);
  assert.ok(result.changedFields.includes('fingerprint'));
  assert.equal(result.event.version, 2);
});
