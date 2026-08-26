import test from 'node:test';
import assert from 'node:assert/strict';

import { SourceCredibilityBand, VerificationConfidence } from '../../domain/common/enums';
import {
  EventChangeClassification,
  EventChangeSignalType,
  EventEvidenceStance,
  EventResolutionAction,
  EventResolutionOutcome,
  EventStatus,
  EventType,
  assessEventChange,
  buildEventEvidenceGraph,
  buildEventFingerprint,
  consolidateEvent,
  evaluateEventResolutionPolicy,
  resolveEventCandidate,
  summarizeEventEvidenceGraph,
} from '../../domain/events';

const newsItemId = 'news-evt-1' as never;
const eventId = 'event-evt-1' as never;
const organizationId = 'org-1' as never;
const now = '2026-08-26T06:15:00.000Z' as never;

const baseFingerprint = buildEventFingerprint({
  primaryEntity: 'OpenAI',
  eventType: EventType.MODEL_RELEASE,
  subject: 'GPT-6',
  eventDate: '2026-08-26T10:00:00.000Z',
  secondaryEntities: ['ChatGPT'],
  location: 'San Francisco',
});

const baseEvent = {
  id: eventId,
  organizationId,
  status: EventStatus.CONFIRMED,
  eventType: EventType.MODEL_RELEASE,
  primaryEntity: 'openai',
  subject: 'gpt-6',
  canonicalSummary: 'OpenAI confirmed GPT-6.',
  firstObservedAt: now,
  eventDateCandidate: '2026-08-26T10:00:00.000Z' as never,
  confirmedEventDate: '2026-08-26T10:00:00.000Z' as never,
  confidence: VerificationConfidence.VERY_HIGH,
  fingerprint: baseFingerprint,
  version: 1,
  createdAt: now,
  updatedAt: now,
};

const emptyEvidenceSummary = () => summarizeEventEvidenceGraph(buildEventEvidenceGraph({
  eventId,
  nodes: [],
  edges: [],
}));

test('full event gate creates a new event when no candidates exist', () => {
  const candidate = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [],
  });
  const change = assessEventChange([]);
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: change,
    evidenceSummary: null,
    existingEventStatus: null,
  });

  assert.equal(candidate.proposedOutcome, EventResolutionOutcome.NEW_EVENT);
  assert.equal(policy.action, EventResolutionAction.CREATE_NEW_EVENT);
  assert.equal(policy.targetEventId, null);
});

test('full event gate attaches same-event evidence without creating a version', () => {
  const candidate = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });
  const change = assessEventChange([]);
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: change,
    evidenceSummary: emptyEvidenceSummary(),
    existingEventStatus: baseEvent.status,
  });

  assert.equal(policy.action, EventResolutionAction.ATTACH_TO_EXISTING);

  const consolidation = consolidateEvent({
    current: baseEvent,
    canonicalSummary: baseEvent.canonicalSummary,
    confirmedEventDate: baseEvent.confirmedEventDate,
    confidence: baseEvent.confidence,
    fingerprint: baseEvent.fingerprint,
    evidenceNewsItemIds: [newsItemId],
    updatedAt: '2026-08-26T06:16:00.000Z' as never,
  });

  assert.equal(consolidation.changed, false);
  assert.equal(consolidation.version, null);
  assert.equal(consolidation.event.version, 1);
});

test('full event gate creates a new event version for a confirmed material update', () => {
  const candidate = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{
      eventId,
      fingerprint: baseFingerprint,
      materialUpdateSignals: ['CONFIRMED_DATE_CHANGE'],
    }],
  });
  const change = assessEventChange([{
    type: EventChangeSignalType.CONFIRMED_DATE_CHANGE,
    sourceCredibilityBand: SourceCredibilityBand.AUTHORITATIVE,
  }]);
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: change,
    evidenceSummary: emptyEvidenceSummary(),
    existingEventStatus: baseEvent.status,
  });

  assert.equal(change.classification, EventChangeClassification.MATERIAL_UPDATE);
  assert.equal(policy.action, EventResolutionAction.CREATE_EVENT_VERSION);

  const updatedFingerprint = buildEventFingerprint({
    primaryEntity: 'OpenAI',
    eventType: EventType.MODEL_RELEASE,
    subject: 'GPT-6',
    eventDate: '2026-08-27T10:00:00.000Z',
    secondaryEntities: ['ChatGPT'],
    location: 'San Francisco',
  });

  const consolidation = consolidateEvent({
    current: baseEvent,
    canonicalSummary: 'OpenAI confirmed GPT-6 for August 27.',
    confirmedEventDate: '2026-08-27T10:00:00.000Z' as never,
    confidence: VerificationConfidence.VERY_HIGH,
    fingerprint: updatedFingerprint,
    evidenceNewsItemIds: [newsItemId, newsItemId],
    updatedAt: '2026-08-26T06:17:00.000Z' as never,
  });

  assert.equal(consolidation.changed, true);
  assert.equal(consolidation.event.version, 2);
  assert.equal(consolidation.event.status, EventStatus.UPDATED);
  assert.equal(consolidation.version?.version, 2);
  assert.deepEqual(consolidation.version?.evidenceNewsItemIds, [newsItemId]);
});

test('full event gate marks an existing event disputed when evidence contradicts it', () => {
  const contradictionNewsItemId = 'news-evt-2' as never;
  const graph = buildEventEvidenceGraph({
    eventId,
    nodes: [{
      newsItemId: contradictionNewsItemId,
      sourceKey: 'openai.com',
      confidence: VerificationConfidence.VERY_HIGH,
      attachedAt: now,
    }],
    edges: [{
      eventId,
      newsItemId: contradictionNewsItemId,
      stance: EventEvidenceStance.CONTRADICTING,
      reason: 'Official source denies the previously reported claim.',
    }],
  });

  const candidate = resolveEventCandidate({
    incomingNewsItemId: contradictionNewsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });
  const change = assessEventChange([{
    type: EventChangeSignalType.OFFICIAL_DENIAL,
    sourceCredibilityBand: SourceCredibilityBand.AUTHORITATIVE,
  }]);
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: change,
    evidenceSummary: summarizeEventEvidenceGraph(graph),
    existingEventStatus: baseEvent.status,
  });

  assert.equal(change.classification, EventChangeClassification.CONTRADICTION);
  assert.equal(policy.action, EventResolutionAction.MARK_DISPUTED);
  assert.equal(policy.targetEventId, eventId);
});

test('full event gate requires human review for a related but non-identical event', () => {
  const relatedFingerprint = buildEventFingerprint({
    primaryEntity: 'OpenAI',
    eventType: EventType.MODEL_RELEASE,
    subject: 'GPT-6 mini',
    eventDate: '2026-08-27T10:00:00.000Z',
    secondaryEntities: ['ChatGPT'],
    location: 'San Francisco',
  });

  const candidate = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: relatedFingerprint,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });
  const change = assessEventChange([]);
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: change,
    evidenceSummary: emptyEvidenceSummary(),
    existingEventStatus: baseEvent.status,
  });

  assert.equal(candidate.proposedOutcome, EventResolutionOutcome.RELATED_EVENT);
  assert.equal(policy.action, EventResolutionAction.REQUIRE_HUMAN_REVIEW);
});

test('a previously disputed event cannot silently return to autonomous attach', () => {
  const candidate = resolveEventCandidate({
    incomingNewsItemId: newsItemId,
    incomingFingerprint: baseFingerprint,
    candidates: [{ eventId, fingerprint: baseFingerprint }],
  });
  const policy = evaluateEventResolutionPolicy({
    candidate,
    changeAssessment: assessEventChange([]),
    evidenceSummary: emptyEvidenceSummary(),
    existingEventStatus: EventStatus.DISPUTED,
  });

  assert.equal(policy.action, EventResolutionAction.MARK_DISPUTED);
});
