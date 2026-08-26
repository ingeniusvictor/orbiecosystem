import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStoryId, IsoUtcDateTime } from '../../domain/common/types';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  EditorialControlAction,
  EditorialRole,
  type EditorialControlSnapshot,
} from '../../domain/editorial/control-center';
import {
  EditorialQueueBucket,
  buildEditorialQueue,
  buildEditorialQueueItem,
  filterEditorialQueue,
  type EditorialQueueSource,
} from '../../domain/editorial/editorial-queue';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { PublicationStatus } from '../../domain/publications/publication';

const snapshot = (overrides: Partial<EditorialControlSnapshot> = {}): EditorialControlSnapshot => ({
  storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
  publicationStatus: PublicationStatus.NOT_SCHEDULED,
  editorialGate: {
    decision: IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW,
    editorialBand: OrbiEditorialBand.PRIORITY,
    reasons: ['HUMAN_EDITORIAL_REVIEW_REQUIRED'],
  },
  breakingEligibility: { eligible: false, reasons: ['VERY_HIGH_VERIFICATION_REQUIRED'] },
  isBreaking: false,
  ...overrides,
});

const source = (
  id: string,
  overrides: Partial<EditorialQueueSource> = {},
): EditorialQueueSource => ({
  storyId: id as CanonicalStoryId,
  headline: `Story ${id}`,
  slug: `story-${id}`,
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.HIGH,
  orbiScore: 88,
  updatedAt: '2026-08-26T15:00:00Z' as IsoUtcDateTime,
  snapshot: snapshot(),
  ...overrides,
});

test('ready-for-review story maps to NEEDS_REVIEW and carries human attention reasons', () => {
  const item = buildEditorialQueueItem(EditorialRole.REVIEWER, source('review'));
  assert.equal(item.bucket, EditorialQueueBucket.NEEDS_REVIEW);
  assert.equal(item.requiresHumanAttention, true);
  assert.ok(item.attentionReasons.includes('HUMAN_REVIEW_REQUIRED'));
});

test('blocked editorial gate outranks story review state', () => {
  const item = buildEditorialQueueItem(EditorialRole.OWNER, source('blocked', {
    snapshot: snapshot({
      editorialGate: {
        decision: IntegratedEditorialDecision.BLOCK,
        editorialBand: OrbiEditorialBand.PRIORITY,
        reasons: ['CRITICAL_RISK'],
      },
    }),
  }));

  assert.equal(item.bucket, EditorialQueueBucket.BLOCKED);
  assert.ok(item.attentionReasons.includes('EDITORIAL_BLOCKED'));
  assert.ok(item.attentionReasons.includes('CRITICAL_RISK'));
});

test('publication lifecycle derives scheduled, publishing and published buckets', () => {
  const approvedStory = CanonicalStoryStatus.APPROVED;

  assert.equal(buildEditorialQueueItem(EditorialRole.OWNER, source('scheduled', {
    snapshot: snapshot({ storyStatus: approvedStory, publicationStatus: PublicationStatus.SCHEDULED }),
  })).bucket, EditorialQueueBucket.SCHEDULED);

  assert.equal(buildEditorialQueueItem(EditorialRole.OWNER, source('publishing', {
    snapshot: snapshot({ storyStatus: approvedStory, publicationStatus: PublicationStatus.PUBLISHING }),
  })).bucket, EditorialQueueBucket.PUBLISHING);

  assert.equal(buildEditorialQueueItem(EditorialRole.OWNER, source('published', {
    snapshot: snapshot({ storyStatus: CanonicalStoryStatus.PUBLISHED, publicationStatus: PublicationStatus.PUBLISHED }),
  })).bucket, EditorialQueueBucket.PUBLISHED);
});

test('queue item carries assessment for every editorial action, including blocked actions and reasons', () => {
  const item = buildEditorialQueueItem(EditorialRole.VIEWER, source('viewer'));
  assert.equal(item.actionAssessments.length, Object.values(EditorialControlAction).length);
  assert.ok(item.actionAssessments.every((assessment) => assessment.allowed === false));
  assert.ok(item.actionAssessments.every((assessment) => assessment.reasons.includes('ROLE_NOT_AUTHORIZED')));
});

test('queue sorts attention buckets first, then score, then most recently updated', () => {
  const items = buildEditorialQueue(EditorialRole.OWNER, [
    source('published', {
      orbiScore: 100,
      snapshot: snapshot({ storyStatus: CanonicalStoryStatus.PUBLISHED, publicationStatus: PublicationStatus.PUBLISHED }),
    }),
    source('review-low', { orbiScore: 80 }),
    source('blocked', {
      orbiScore: 70,
      snapshot: snapshot({
        storyStatus: CanonicalStoryStatus.BLOCKED,
        editorialGate: {
          decision: IntegratedEditorialDecision.BLOCK,
          editorialBand: OrbiEditorialBand.HOLD,
          reasons: ['EDITORIAL_BLOCK_CONDITION_PRESENT'],
        },
      }),
    }),
    source('review-high-old', {
      orbiScore: 95,
      updatedAt: '2026-08-26T14:00:00Z' as IsoUtcDateTime,
    }),
    source('review-high-new', {
      orbiScore: 95,
      updatedAt: '2026-08-26T16:00:00Z' as IsoUtcDateTime,
    }),
  ]);

  assert.deepEqual(items.map((item) => item.storyId), [
    'blocked',
    'review-high-new',
    'review-high-old',
    'review-low',
    'published',
  ]);
});

test('queue filter selects a derived bucket without mutating the original queue', () => {
  const items = buildEditorialQueue(EditorialRole.EDITOR, [
    source('review'),
    source('approved', {
      snapshot: snapshot({ storyStatus: CanonicalStoryStatus.APPROVED, editorialGate: {
        decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
        editorialBand: OrbiEditorialBand.PRIORITY,
        reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
      } }),
    }),
  ]);

  const filtered = filterEditorialQueue(items, EditorialQueueBucket.APPROVED);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].storyId, 'approved');
  assert.equal(items.length, 2);
  assert.equal(filterEditorialQueue(items, null), items);
});
