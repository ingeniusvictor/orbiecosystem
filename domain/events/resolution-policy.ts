import type { EventId } from '../common/types';
import {
  EventResolutionOutcome,
  EventStatus,
  type EventResolutionCandidate,
} from './event';
import {
  EventChangeClassification,
  type EventChangeAssessment,
} from './update-classifier';
import type { EventEvidenceGraphSummary } from './evidence-graph';

export enum EventResolutionAction {
  CREATE_NEW_EVENT = 'CREATE_NEW_EVENT',
  ATTACH_TO_EXISTING = 'ATTACH_TO_EXISTING',
  CREATE_EVENT_VERSION = 'CREATE_EVENT_VERSION',
  MARK_DISPUTED = 'MARK_DISPUTED',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
}

export interface EventResolutionPolicyInput {
  readonly candidate: EventResolutionCandidate;
  readonly changeAssessment: EventChangeAssessment;
  readonly evidenceSummary: EventEvidenceGraphSummary | null;
  readonly existingEventStatus: EventStatus | null;
}

export interface EventResolutionPolicyResult {
  readonly action: EventResolutionAction;
  readonly targetEventId: EventId | null;
  readonly reasons: readonly string[];
}

const result = (
  action: EventResolutionAction,
  targetEventId: EventId | null,
  reasons: readonly string[],
): EventResolutionPolicyResult => ({ action, targetEventId, reasons });

export const evaluateEventResolutionPolicy = (
  input: EventResolutionPolicyInput,
): EventResolutionPolicyResult => {
  const { candidate, changeAssessment, evidenceSummary, existingEventStatus } = input;

  if (
    changeAssessment.classification === EventChangeClassification.CONTRADICTION ||
    (evidenceSummary?.hasContradiction ?? false) ||
    existingEventStatus === EventStatus.DISPUTED
  ) {
    if (candidate.candidateEventId === null) {
      return result(EventResolutionAction.REQUIRE_HUMAN_REVIEW, null, [
        'CONTRADICTION_WITHOUT_RESOLVED_TARGET_EVENT',
      ]);
    }
    return result(EventResolutionAction.MARK_DISPUTED, candidate.candidateEventId, [
      'EVENT_CONTRADICTION_PRESENT',
      ...changeAssessment.reasons,
    ]);
  }

  if (
    changeAssessment.classification === EventChangeClassification.REQUIRE_HUMAN_REVIEW ||
    candidate.proposedOutcome === EventResolutionOutcome.UNRESOLVED ||
    candidate.proposedOutcome === EventResolutionOutcome.RELATED_EVENT
  ) {
    return result(EventResolutionAction.REQUIRE_HUMAN_REVIEW, candidate.candidateEventId, [
      'EVENT_RELATIONSHIP_NOT_SAFE_FOR_AUTONOMOUS_MUTATION',
      ...changeAssessment.reasons,
    ]);
  }

  if (candidate.proposedOutcome === EventResolutionOutcome.NEW_EVENT) {
    return result(EventResolutionAction.CREATE_NEW_EVENT, null, [
      'NO_EXISTING_EVENT_MATCH',
    ]);
  }

  if (candidate.candidateEventId === null) {
    return result(EventResolutionAction.REQUIRE_HUMAN_REVIEW, null, [
      'MATCHED_OUTCOME_REQUIRES_TARGET_EVENT',
    ]);
  }

  if (
    candidate.proposedOutcome === EventResolutionOutcome.MATERIAL_UPDATE ||
    changeAssessment.classification === EventChangeClassification.MATERIAL_UPDATE
  ) {
    return result(EventResolutionAction.CREATE_EVENT_VERSION, candidate.candidateEventId, [
      'MATERIAL_EVENT_CHANGE_CONFIRMED',
      ...changeAssessment.reasons,
    ]);
  }

  if (
    candidate.proposedOutcome === EventResolutionOutcome.SAME_EVENT &&
    changeAssessment.classification === EventChangeClassification.NO_MATERIAL_CHANGE
  ) {
    return result(EventResolutionAction.ATTACH_TO_EXISTING, candidate.candidateEventId, [
      'SAME_EVENT_WITHOUT_MATERIAL_CHANGE',
    ]);
  }

  return result(EventResolutionAction.REQUIRE_HUMAN_REVIEW, candidate.candidateEventId, [
    'EVENT_POLICY_FELL_THROUGH_TO_REVIEW',
  ]);
};
