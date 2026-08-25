import { NewsStatus } from '../common/enums';
import { CanonicalStoryStatus } from '../editorial/canonical-story';
import { PublicationStatus } from '../publications/publication';

export type StateMachineName = 'NEWS' | 'CANONICAL_STORY' | 'PUBLICATION';

export interface InvalidStateTransition {
  readonly machine: StateMachineName;
  readonly from: string;
  readonly to: string;
  readonly code: 'INVALID_STATE_TRANSITION';
  readonly message: string;
}

export type TransitionCheck =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: InvalidStateTransition };

const newsTransitions: Readonly<Record<NewsStatus, readonly NewsStatus[]>> = {
  [NewsStatus.INGESTED]: [NewsStatus.VERIFYING, NewsStatus.DUPLICATE, NewsStatus.REJECTED, NewsStatus.FAILED, NewsStatus.CANCELLED],
  [NewsStatus.VERIFYING]: [NewsStatus.VERIFIED, NewsStatus.UNVERIFIED, NewsStatus.BLOCKED, NewsStatus.FAILED, NewsStatus.CANCELLED],
  [NewsStatus.VERIFIED]: [NewsStatus.SCORED, NewsStatus.BLOCKED, NewsStatus.FAILED, NewsStatus.CANCELLED],
  [NewsStatus.SCORED]: [NewsStatus.CANDIDATE, NewsStatus.REJECTED, NewsStatus.EXPIRED, NewsStatus.BLOCKED, NewsStatus.FAILED],
  [NewsStatus.CANDIDATE]: [NewsStatus.DRAFTING, NewsStatus.REJECTED, NewsStatus.EXPIRED, NewsStatus.BLOCKED, NewsStatus.CANCELLED],
  [NewsStatus.DRAFTING]: [NewsStatus.DRAFT_READY, NewsStatus.FAILED, NewsStatus.BLOCKED, NewsStatus.CANCELLED],
  [NewsStatus.DRAFT_READY]: [NewsStatus.VISUAL_READY, NewsStatus.READY_FOR_REVIEW, NewsStatus.REJECTED, NewsStatus.BLOCKED, NewsStatus.FAILED],
  [NewsStatus.VISUAL_READY]: [NewsStatus.READY_FOR_REVIEW, NewsStatus.REJECTED, NewsStatus.BLOCKED, NewsStatus.FAILED],
  [NewsStatus.READY_FOR_REVIEW]: [NewsStatus.APPROVED, NewsStatus.REJECTED, NewsStatus.BLOCKED, NewsStatus.CANCELLED],
  [NewsStatus.APPROVED]: [NewsStatus.SCHEDULED, NewsStatus.PUBLISHING, NewsStatus.BLOCKED, NewsStatus.CANCELLED],
  [NewsStatus.SCHEDULED]: [NewsStatus.PUBLISHING, NewsStatus.BLOCKED, NewsStatus.CANCELLED, NewsStatus.EXPIRED],
  [NewsStatus.PUBLISHING]: [NewsStatus.PUBLISHED, NewsStatus.FAILED, NewsStatus.BLOCKED],
  [NewsStatus.PUBLISHED]: [],
  [NewsStatus.REJECTED]: [],
  [NewsStatus.DUPLICATE]: [],
  [NewsStatus.UNVERIFIED]: [NewsStatus.VERIFYING, NewsStatus.REJECTED, NewsStatus.EXPIRED, NewsStatus.CANCELLED],
  [NewsStatus.EXPIRED]: [],
  [NewsStatus.FAILED]: [NewsStatus.VERIFYING, NewsStatus.DRAFTING, NewsStatus.PUBLISHING, NewsStatus.BLOCKED, NewsStatus.CANCELLED],
  [NewsStatus.BLOCKED]: [NewsStatus.VERIFYING, NewsStatus.READY_FOR_REVIEW, NewsStatus.CANCELLED],
  [NewsStatus.CANCELLED]: [],
};

const storyTransitions: Readonly<Record<CanonicalStoryStatus, readonly CanonicalStoryStatus[]>> = {
  [CanonicalStoryStatus.DRAFTING]: [CanonicalStoryStatus.DRAFT_READY, CanonicalStoryStatus.BLOCKED, CanonicalStoryStatus.FAILED, CanonicalStoryStatus.REJECTED],
  [CanonicalStoryStatus.DRAFT_READY]: [CanonicalStoryStatus.READY_FOR_REVIEW, CanonicalStoryStatus.BLOCKED, CanonicalStoryStatus.FAILED, CanonicalStoryStatus.REJECTED],
  [CanonicalStoryStatus.READY_FOR_REVIEW]: [CanonicalStoryStatus.APPROVED, CanonicalStoryStatus.REJECTED, CanonicalStoryStatus.BLOCKED],
  [CanonicalStoryStatus.APPROVED]: [CanonicalStoryStatus.PUBLISHED, CanonicalStoryStatus.SUPERSEDED, CanonicalStoryStatus.BLOCKED],
  [CanonicalStoryStatus.PUBLISHED]: [CanonicalStoryStatus.SUPERSEDED],
  [CanonicalStoryStatus.REJECTED]: [],
  [CanonicalStoryStatus.SUPERSEDED]: [],
  [CanonicalStoryStatus.BLOCKED]: [CanonicalStoryStatus.DRAFTING, CanonicalStoryStatus.READY_FOR_REVIEW, CanonicalStoryStatus.REJECTED],
  [CanonicalStoryStatus.FAILED]: [CanonicalStoryStatus.DRAFTING, CanonicalStoryStatus.BLOCKED, CanonicalStoryStatus.REJECTED],
};

const publicationTransitions: Readonly<Record<PublicationStatus, readonly PublicationStatus[]>> = {
  [PublicationStatus.NOT_SCHEDULED]: [PublicationStatus.PENDING_APPROVAL, PublicationStatus.APPROVED, PublicationStatus.SCHEDULED, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.PENDING_APPROVAL]: [PublicationStatus.APPROVED, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.APPROVED]: [PublicationStatus.SCHEDULED, PublicationStatus.READY, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.SCHEDULED]: [PublicationStatus.READY, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.READY]: [PublicationStatus.PUBLISHING, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.PUBLISHING]: [PublicationStatus.PUBLISHED, PublicationStatus.RETRY_PENDING, PublicationStatus.FAILED, PublicationStatus.BLOCKED],
  [PublicationStatus.PUBLISHED]: [],
  [PublicationStatus.RETRY_PENDING]: [PublicationStatus.READY, PublicationStatus.PUBLISHING, PublicationStatus.FAILED, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.FAILED]: [PublicationStatus.RETRY_PENDING, PublicationStatus.BLOCKED, PublicationStatus.CANCELLED],
  [PublicationStatus.BLOCKED]: [PublicationStatus.PENDING_APPROVAL, PublicationStatus.APPROVED, PublicationStatus.CANCELLED],
  [PublicationStatus.CANCELLED]: [],
};

function checkTransition<T extends string>(
  machine: StateMachineName,
  map: Readonly<Record<T, readonly T[]>>,
  from: T,
  to: T,
): TransitionCheck {
  if (from === to) {
    return {
      ok: false,
      error: {
        machine,
        from,
        to,
        code: 'INVALID_STATE_TRANSITION',
        message: `${machine} cannot transition from ${from} to the same state`,
      },
    };
  }

  if (map[from].includes(to)) {
    return { ok: true };
  }

  return {
    ok: false,
    error: {
      machine,
      from,
      to,
      code: 'INVALID_STATE_TRANSITION',
      message: `${machine} transition ${from} -> ${to} is not allowed`,
    },
  };
}

export const canTransitionNews = (from: NewsStatus, to: NewsStatus): TransitionCheck =>
  checkTransition('NEWS', newsTransitions, from, to);

export const canTransitionCanonicalStory = (
  from: CanonicalStoryStatus,
  to: CanonicalStoryStatus,
): TransitionCheck => checkTransition('CANONICAL_STORY', storyTransitions, from, to);

export const canTransitionPublication = (
  from: PublicationStatus,
  to: PublicationStatus,
): TransitionCheck => checkTransition('PUBLICATION', publicationTransitions, from, to);

export const getAllowedNewsTransitions = (from: NewsStatus): readonly NewsStatus[] => newsTransitions[from];

export const getAllowedCanonicalStoryTransitions = (
  from: CanonicalStoryStatus,
): readonly CanonicalStoryStatus[] => storyTransitions[from];

export const getAllowedPublicationTransitions = (
  from: PublicationStatus,
): readonly PublicationStatus[] => publicationTransitions[from];
