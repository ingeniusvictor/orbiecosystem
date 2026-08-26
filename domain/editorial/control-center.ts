import { CanonicalStoryStatus } from './canonical-story';
import {
  IntegratedEditorialDecision,
  type IntegratedEditorialGateResult,
} from './editorial-gate';
import type { BreakingEligibilityResult } from './scoring';
import {
  PublicationStatus,
} from '../publications/publication';
import {
  canTransitionCanonicalStory,
  canTransitionPublication,
} from '../state-machine/state-machine';

export enum EditorialRole {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  REVIEWER = 'REVIEWER',
  VIEWER = 'VIEWER',
}

export enum EditorialControlAction {
  REQUEST_REVISION = 'REQUEST_REVISION',
  APPROVE_STORY = 'APPROVE_STORY',
  REJECT_STORY = 'REJECT_STORY',
  MARK_BREAKING = 'MARK_BREAKING',
  UNMARK_BREAKING = 'UNMARK_BREAKING',
  PREPARE_WEB_PUBLICATION = 'PREPARE_WEB_PUBLICATION',
  PUBLISH_WEB_NOW = 'PUBLISH_WEB_NOW',
}

export interface EditorialControlSnapshot {
  readonly storyStatus: CanonicalStoryStatus;
  readonly publicationStatus: PublicationStatus;
  readonly editorialGate: IntegratedEditorialGateResult;
  readonly breakingEligibility: BreakingEligibilityResult;
  readonly isBreaking: boolean;
}

export interface EditorialActionAssessment {
  readonly action: EditorialControlAction;
  readonly allowed: boolean;
  readonly reasons: readonly string[];
}

const roleAllows = (
  role: EditorialRole,
  action: EditorialControlAction,
): boolean => {
  if (role === EditorialRole.OWNER) return true;
  if (role === EditorialRole.VIEWER) return false;

  if (role === EditorialRole.REVIEWER) {
    return [
      EditorialControlAction.REQUEST_REVISION,
      EditorialControlAction.APPROVE_STORY,
      EditorialControlAction.REJECT_STORY,
    ].includes(action);
  }

  return action !== EditorialControlAction.PUBLISH_WEB_NOW;
};

const canResolveReview = (snapshot: EditorialControlSnapshot): boolean =>
  snapshot.editorialGate.decision === IntegratedEditorialDecision.ALLOW_EDITORIAL ||
  snapshot.editorialGate.decision === IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW;

const assessDeterministicConditions = (
  action: EditorialControlAction,
  snapshot: EditorialControlSnapshot,
): readonly string[] => {
  const reasons: string[] = [];

  switch (action) {
    case EditorialControlAction.REQUEST_REVISION: {
      const transition = canTransitionCanonicalStory(
        snapshot.storyStatus,
        CanonicalStoryStatus.DRAFTING,
      );
      if (!transition.ok) reasons.push('STORY_REVISION_TRANSITION_NOT_ALLOWED');
      if (snapshot.storyStatus === CanonicalStoryStatus.PUBLISHED) reasons.push('PUBLISHED_STORY_IMMUTABLE');
      break;
    }
    case EditorialControlAction.APPROVE_STORY: {
      const transition = canTransitionCanonicalStory(
        snapshot.storyStatus,
        CanonicalStoryStatus.APPROVED,
      );
      if (!transition.ok) reasons.push('STORY_APPROVAL_TRANSITION_NOT_ALLOWED');
      if (!canResolveReview(snapshot)) reasons.push('EDITORIAL_GATE_NOT_APPROVABLE');
      break;
    }
    case EditorialControlAction.REJECT_STORY: {
      const transition = canTransitionCanonicalStory(
        snapshot.storyStatus,
        CanonicalStoryStatus.REJECTED,
      );
      if (!transition.ok) reasons.push('STORY_REJECTION_TRANSITION_NOT_ALLOWED');
      break;
    }
    case EditorialControlAction.MARK_BREAKING:
      if (snapshot.isBreaking) reasons.push('ALREADY_MARKED_BREAKING');
      if (!snapshot.breakingEligibility.eligible) {
        reasons.push('BREAKING_NOT_ELIGIBLE', ...snapshot.breakingEligibility.reasons);
      }
      if (snapshot.editorialGate.decision !== IntegratedEditorialDecision.ALLOW_EDITORIAL) {
        reasons.push('EDITORIAL_GATE_NOT_ALLOWED_FOR_BREAKING');
      }
      break;
    case EditorialControlAction.UNMARK_BREAKING:
      if (!snapshot.isBreaking) reasons.push('NOT_MARKED_BREAKING');
      break;
    case EditorialControlAction.PREPARE_WEB_PUBLICATION: {
      if (snapshot.storyStatus !== CanonicalStoryStatus.APPROVED) {
        reasons.push('STORY_NOT_APPROVED');
      }
      const toReady = canTransitionPublication(snapshot.publicationStatus, PublicationStatus.READY);
      const toScheduled = canTransitionPublication(snapshot.publicationStatus, PublicationStatus.SCHEDULED);
      if (!toReady.ok && !toScheduled.ok) reasons.push('PUBLICATION_PREPARATION_TRANSITION_NOT_ALLOWED');
      if (snapshot.editorialGate.decision !== IntegratedEditorialDecision.ALLOW_EDITORIAL) {
        reasons.push('EDITORIAL_GATE_NOT_ALLOWED_FOR_PUBLICATION');
      }
      break;
    }
    case EditorialControlAction.PUBLISH_WEB_NOW: {
      if (snapshot.storyStatus !== CanonicalStoryStatus.APPROVED) {
        reasons.push('STORY_NOT_APPROVED');
      }
      const transition = canTransitionPublication(
        snapshot.publicationStatus,
        PublicationStatus.PUBLISHING,
      );
      if (!transition.ok) reasons.push('PUBLICATION_START_TRANSITION_NOT_ALLOWED');
      if (snapshot.editorialGate.decision !== IntegratedEditorialDecision.ALLOW_EDITORIAL) {
        reasons.push('EDITORIAL_GATE_NOT_ALLOWED_FOR_PUBLICATION');
      }
      break;
    }
  }

  return [...new Set(reasons)];
};

export const assessEditorialControlAction = (
  role: EditorialRole,
  action: EditorialControlAction,
  snapshot: EditorialControlSnapshot,
): EditorialActionAssessment => {
  const reasons: string[] = [];
  if (!roleAllows(role, action)) reasons.push('ROLE_NOT_AUTHORIZED');
  reasons.push(...assessDeterministicConditions(action, snapshot));

  return {
    action,
    allowed: reasons.length === 0,
    reasons: [...new Set(reasons)],
  };
};

export const getAvailableEditorialActions = (
  role: EditorialRole,
  snapshot: EditorialControlSnapshot,
): readonly EditorialControlAction[] =>
  Object.values(EditorialControlAction).filter((action) =>
    assessEditorialControlAction(role, action, snapshot).allowed,
  );
