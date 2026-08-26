import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EventChangeClassification,
  EventResolutionAction,
  EventResolutionOutcome,
  EventStatus,
  evaluateEventResolutionPolicy,
} from '../../domain/events';

const eventId = 'event-1' as never;
const newsItemId = 'news-1' as never;

const candidate = (outcome: EventResolutionOutcome, target = eventId) => ({
  incomingNewsItemId: newsItemId,
  candidateEventId: outcome === EventResolutionOutcome.NEW_EVENT ? null : target,
  similarityScore: outcome === EventResolutionOutcome.NEW_EVENT ? 20 : 100,
  proposedOutcome: outcome,
  reason: `TEST_${outcome}`,
});

const change = (classification: EventChangeClassification) => ({
  classification,
  materialSignals: [],
  contradictionSignals: [],
  reasons: [`TEST_${classification}`],
});

const cleanSummary = {
  totalEvidenceItems: 2,
  uniqueSources: 2,
  supportingItems: 2,
  contradictingItems: 0,
  contextItems: 0,
  uniqueSupportingSources: 2,
  uniqueContradictingSources: 0,
  hasContradiction: false,
};

test('NEW_EVENT creates a new event', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.NEW_EVENT),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: null,
    existingEventStatus: null,
  });

  assert.equal(result.action, EventResolutionAction.CREATE_NEW_EVENT);
  assert.equal(result.targetEventId, null);
});

test('SAME_EVENT without material change attaches to existing event', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.SAME_EVENT),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.CONFIRMED,
  });

  assert.equal(result.action, EventResolutionAction.ATTACH_TO_EXISTING);
  assert.equal(result.targetEventId, eventId);
});

test('material update creates a new event version', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.MATERIAL_UPDATE),
    changeAssessment: change(EventChangeClassification.MATERIAL_UPDATE),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.CONFIRMED,
  });

  assert.equal(result.action, EventResolutionAction.CREATE_EVENT_VERSION);
  assert.equal(result.targetEventId, eventId);
});

test('evidence contradiction marks event disputed', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.SAME_EVENT),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: { ...cleanSummary, contradictingItems: 1, uniqueContradictingSources: 1, hasContradiction: true },
    existingEventStatus: EventStatus.CONFIRMED,
  });

  assert.equal(result.action, EventResolutionAction.MARK_DISPUTED);
});

test('authoritative contradiction classification marks event disputed', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.SAME_EVENT),
    changeAssessment: change(EventChangeClassification.CONTRADICTION),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.CONFIRMED,
  });

  assert.equal(result.action, EventResolutionAction.MARK_DISPUTED);
});

test('related event requires human review instead of autonomous mutation', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.RELATED_EVENT),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.ACTIVE,
  });

  assert.equal(result.action, EventResolutionAction.REQUIRE_HUMAN_REVIEW);
});

test('unresolved event requires human review', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.UNRESOLVED),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.ACTIVE,
  });

  assert.equal(result.action, EventResolutionAction.REQUIRE_HUMAN_REVIEW);
});

test('mixed change signals requiring review cannot autonomously create a version', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.MATERIAL_UPDATE),
    changeAssessment: change(EventChangeClassification.REQUIRE_HUMAN_REVIEW),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.ACTIVE,
  });

  assert.equal(result.action, EventResolutionAction.REQUIRE_HUMAN_REVIEW);
});

test('already disputed event remains disputed even when new candidate says same event', () => {
  const result = evaluateEventResolutionPolicy({
    candidate: candidate(EventResolutionOutcome.SAME_EVENT),
    changeAssessment: change(EventChangeClassification.NO_MATERIAL_CHANGE),
    evidenceSummary: cleanSummary,
    existingEventStatus: EventStatus.DISPUTED,
  });

  assert.equal(result.action, EventResolutionAction.MARK_DISPUTED);
});
