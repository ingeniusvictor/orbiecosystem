import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EventResolutionOutcome,
  EventType,
  buildEventFingerprint,
  calculateEventSimilarityScore,
  resolveEventCandidate,
} from '../../domain/events';

const newsItemId = 'news-1' as never;
const eventId = 'event-1' as never;

const baseFingerprint = buildEventFingerprint({
  primaryEntity: 'OpenAI',
  eventType: EventType.MODEL_RELEASE,
  subject: 'GPT-6',
  eventDate: '2026-08-26T10:00:00.000Z',
  secondaryEntities: ['ChatGPT', 'API'],
  location: 'San Francisco',
});

test('event fingerprint is stable across casing, spacing and secondary entity order', () => {
  const variant = buildEventFingerprint({
    primaryEntity: '  openai  ',
    eventType: EventType.MODEL_RELEASE,
    subject: 'gpt-6',
    eventDate: '2026-08-26T23:59:59.000Z',
    secondaryEntities: ['API', 'chatgpt', 'API'],
    location: 'san francisco',
  });

  assert.equal(variant.fingerprintHash, baseFingerprint.fingerprintHash);
  assert.deepEqual(variant.secondaryEntities, ['api', 'chatgpt']);
  assert.equal(variant.dateBucket, '2026-08-26');
});

test('event fingerprint rejects an empty primary entity', () => {
  assert.throws(() => buildEventFingerprint({
    primaryEntity: '   ',
    eventType: EventType.OTHER,
  }));
});

test('identical event fingerprints score 100', () => {
  assert.equal(calculateEventSimilarityScore(baseFingerprint, baseFingerprint), 100);
});

test('no candidates resolves to NEW_EVENT', () => {
  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [],
  });

  assert.equal(result.proposedOutcome, EventResolutionOutcome.NEW_EVENT);
  assert.equal(result.candidateEventId, null);
});

test('exact fingerprint resolves to SAME_EVENT', () => {
  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });

  assert.equal(result.proposedOutcome, EventResolutionOutcome.SAME_EVENT);
  assert.equal(result.similarityScore, 100);
  assert.equal(result.candidateEventId, eventId);
});

test('exact fingerprint with explicit material update signal resolves to MATERIAL_UPDATE', () => {
  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{
      eventId,
      fingerprint: baseFingerprint,
      materialUpdateSignals: ['NEW_OFFICIAL_RELEASE_DATE'],
    }],
  });

  assert.equal(result.proposedOutcome, EventResolutionOutcome.MATERIAL_UPDATE);
});

test('moderately similar event resolves to RELATED_EVENT instead of SAME_EVENT', () => {
  const related = buildEventFingerprint({
    primaryEntity: 'OpenAI',
    eventType: EventType.MODEL_RELEASE,
    subject: 'GPT-6 mini',
    eventDate: '2026-08-27T10:00:00.000Z',
    secondaryEntities: ['ChatGPT'],
    location: 'San Francisco',
  });

  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: related,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });

  assert.equal(result.proposedOutcome, EventResolutionOutcome.RELATED_EVENT);
});

test('low-similarity candidate resolves to NEW_EVENT', () => {
  const different = buildEventFingerprint({
    primaryEntity: 'SolarCo',
    eventType: EventType.ENERGY_PROJECT,
    subject: 'New battery plant',
    eventDate: '2026-09-12T10:00:00.000Z',
    secondaryEntities: ['Chile'],
    location: 'Antofagasta',
  });

  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: different,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });

  assert.equal(result.proposedOutcome, EventResolutionOutcome.NEW_EVENT);
  assert.equal(result.candidateEventId, null);
});

test('resolver deterministically selects the highest scoring candidate', () => {
  const weakerEventId = 'event-2' as never;
  const weaker = buildEventFingerprint({
    primaryEntity: 'OpenAI',
    eventType: EventType.MODEL_RELEASE,
    subject: 'Other model',
    eventDate: '2026-08-25T10:00:00.000Z',
  });

  const result = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [
      { eventId: weakerEventId, fingerprint: weaker },
      { eventId, fingerprint: baseFingerprint },
    ],
  });

  assert.equal(result.candidateEventId, eventId);
  assert.equal(result.proposedOutcome, EventResolutionOutcome.SAME_EVENT);
});
