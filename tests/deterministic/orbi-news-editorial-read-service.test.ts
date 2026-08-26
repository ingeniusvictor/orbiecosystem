import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import { EditorialRole } from '../../domain/editorial/control-center';
import { EditorialQueueBucket, type EditorialQueueSource } from '../../domain/editorial/editorial-queue';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { PublicationStatus } from '../../domain/publications/publication';
import {
  createEditorialControlCenterReadService,
  emptyEditorialQueueReader,
} from '../../server/editorial/control-center-read-service';

const organizationId = 'orbi-ecosystem' as OrganizationId;

const source = (id: string, bucket: 'review' | 'approved'): EditorialQueueSource => ({
  storyId: id as CanonicalStoryId,
  revision: `rev-${id}`,
  headline: `Story ${id}`,
  slug: `story-${id}`,
  category: ContentCategory.TECH,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.HIGH,
  orbiScore: bucket === 'review' ? 90 : 86,
  updatedAt: '2026-08-26T15:00:00Z' as IsoUtcDateTime,
  snapshot: {
    storyStatus: bucket === 'review' ? CanonicalStoryStatus.READY_FOR_REVIEW : CanonicalStoryStatus.APPROVED,
    publicationStatus: PublicationStatus.NOT_SCHEDULED,
    editorialGate: {
      decision: bucket === 'review'
        ? IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW
        : IntegratedEditorialDecision.ALLOW_EDITORIAL,
      editorialBand: OrbiEditorialBand.PRIORITY,
      reasons: bucket === 'review'
        ? ['HUMAN_EDITORIAL_REVIEW_REQUIRED']
        : ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
    },
    breakingEligibility: { eligible: false, reasons: ['SOCIAL_SCORE_BELOW_BREAKING_THRESHOLD'] },
    isBreaking: false,
  },
});

test('read service builds role-aware queue and preserves revision', async () => {
  let receivedOrganizationId: OrganizationId | null = null;
  const service = createEditorialControlCenterReadService({
    async listQueueSources(nextOrganizationId) {
      receivedOrganizationId = nextOrganizationId;
      return [source('review', 'review'), source('approved', 'approved')];
    },
  });

  const items = await service.listQueue({ organizationId, role: EditorialRole.REVIEWER });
  assert.equal(receivedOrganizationId, organizationId);
  assert.equal(items.length, 2);
  assert.equal(items[0].bucket, EditorialQueueBucket.NEEDS_REVIEW);
  assert.equal(items[0].revision, 'rev-review');
});

test('read service filters by derived queue bucket', async () => {
  const service = createEditorialControlCenterReadService({
    async listQueueSources() {
      return [source('review', 'review'), source('approved', 'approved')];
    },
  });
  const approved = await service.listQueue({ organizationId, role: EditorialRole.OWNER, bucket: EditorialQueueBucket.APPROVED });
  assert.equal(approved.length, 1);
  assert.equal(approved[0].storyId, 'approved');
});

test('empty queue reader returns stable empty read model', async () => {
  const service = createEditorialControlCenterReadService(emptyEditorialQueueReader);
  assert.deepEqual(await service.listQueue({ organizationId, role: EditorialRole.VIEWER }), []);
});
