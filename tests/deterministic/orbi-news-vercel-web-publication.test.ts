import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, ContentCategory, RiskLevel, SystemCapability, SystemMode, VerificationConfidence } from '../../domain/common/enums';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { CanonicalStoryStatus, ContentFormat, EditorialTone, type CanonicalStory } from '../../domain/editorial/canonical-story';
import { AutomationToggle, OperationalAction, type OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import type { PublishedNewsSourceRecord } from '../../domain/publications/public-news';
import { publishApprovedStoryToWeb } from '../../server/vercel/web-publication-service';

const story = (riskLevel: RiskLevel = RiskLevel.LOW): CanonicalStory => ({
  id: 'story-1' as any,
  organizationId: 'orbi-ecosystem' as any,
  eventId: 'event-1' as any,
  verificationRecordId: 'verification-1' as any,
  status: CanonicalStoryStatus.APPROVED,
  headline: 'Nueva tecnología de inteligencia artificial',
  dek: 'ORBI explica el anuncio y su impacto práctico.',
  slug: 'nueva-tecnologia-inteligencia-artificial',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [{ key: 'SUMMARY', heading: 'Qué ocurrió', body: 'Resumen basado en fuentes verificadas.' }],
  sourceRefs: [{ label: 'Fuente oficial', url: 'https://example.com/official', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel,
  orbiScore: 91,
  socialScore: null,
  shortScore: null,
  canonicalImageAssetId: null,
  createdAt: '2026-08-27T12:00:00.000Z' as IsoUtcDateTime,
  updatedAt: '2026-08-27T12:00:00.000Z' as IsoUtcDateTime,
  publishedAt: null,
});

const authority = (level: AutonomyLevel = AutonomyLevel.LEVEL_5): OperationalAuthoritySnapshot => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: level,
  toggles: { [AutomationToggle.AUTO_PUBLISH_WEB]: true },
  activeKillSwitches: [],
  capabilities: { [SystemCapability.PUBLIC_NEWS_PORTAL]: CapabilityStatus.AVAILABLE },
  dailyBudgets: { [OperationalAction.PUBLISH_WEB]: { limit: 8, used: 0 } },
  retryBudgets: {},
});

test('approved low-risk story can be persisted to web only after operational and publication gates allow', async () => {
  const written: PublishedNewsSourceRecord[] = [];
  const result = await publishApprovedStoryToWeb({
    story: story(),
    writer: { async publish(record) { written.push(record); } },
    existingRecords: [],
    authoritySnapshot: authority(),
    publishingEnabled: true,
    channelEnabled: true,
    retryCount: 0,
    maxRetries: 3,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
  });
  assert.equal(result.outcome, 'PUBLISHED');
  assert.equal(written.length, 1);
  assert.equal(written[0].article.slug, 'nueva-tecnologia-inteligencia-artificial');
});

test('high-risk story still requires human review and is not written', async () => {
  let writes = 0;
  const result = await publishApprovedStoryToWeb({
    story: story(RiskLevel.HIGH),
    writer: { async publish() { writes += 1; } },
    existingRecords: [], authoritySnapshot: authority(), publishingEnabled: true, channelEnabled: true,
    retryCount: 0, maxRetries: 3, nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
  });
  assert.equal(result.outcome, 'REVIEW_REQUIRED');
  assert.equal(writes, 0);
});

test('publication cannot run with insufficient autonomy even when story is approved', async () => {
  let writes = 0;
  const result = await publishApprovedStoryToWeb({
    story: story(),
    writer: { async publish() { writes += 1; } },
    existingRecords: [], authoritySnapshot: authority(AutonomyLevel.LEVEL_1), publishingEnabled: true, channelEnabled: true,
    retryCount: 0, maxRetries: 3, nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
  });
  assert.equal(result.outcome, 'DEFERRED');
  assert.equal(writes, 0);
});
