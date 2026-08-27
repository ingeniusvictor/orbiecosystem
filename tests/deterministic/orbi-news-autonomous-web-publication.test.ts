import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AutonomyLevel,
  CapabilityStatus,
  ContentCategory,
  RiskLevel,
  SystemCapability,
  SystemMode,
  VerificationConfidence,
} from '../../domain/common/enums';
import { CanonicalStoryStatus, ContentFormat, EditorialTone, type CanonicalStory } from '../../domain/editorial/canonical-story';
import { AutomationToggle, type OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import type { PublishedNewsSourceRecord } from '../../domain/publications/public-news';
import { assessAutonomousWebPublishing } from '../../server/news/autonomous-web-publishing-policy';
import { publishStoryAutonomouslyIfEligible } from '../../server/news/autonomous-web-publication-orchestrator';

const now = '2026-08-27T17:30:00.000Z' as never;

const story = (overrides: Partial<CanonicalStory> = {}): CanonicalStory => ({
  id: 'story-1' as never,
  organizationId: 'orbi' as never,
  eventId: 'event-1' as never,
  verificationRecordId: 'verification-1' as never,
  status: CanonicalStoryStatus.READY_FOR_REVIEW,
  headline: 'ORBI analiza un lanzamiento confirmado',
  dek: 'La noticia fue confirmada por la fuente primaria y corroborada independientemente.',
  slug: 'orbi-analiza-lanzamiento-confirmado',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Contenido original.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Contenido original.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Contenido original.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto', body: 'Contenido original.' },
    { key: 'ORBI_LENS', heading: 'Perspectiva ORBI', body: 'Contenido original.' },
  ],
  sourceRefs: [
    { label: 'Fuente oficial', url: 'https://official.example/news', isPrimary: true },
    { label: 'Medio independiente', url: 'https://media.example/report', isPrimary: false },
  ],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 90,
  socialScore: null,
  shortScore: null,
  canonicalImageAssetId: null,
  createdAt: now,
  updatedAt: now,
  publishedAt: null,
  ...overrides,
});

const authority: OperationalAuthoritySnapshot = {
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_5,
  toggles: { [AutomationToggle.AUTO_PUBLISH_WEB]: true },
  activeKillSwitches: [],
  capabilities: { [SystemCapability.PUBLIC_NEWS_PORTAL]: CapabilityStatus.AVAILABLE },
  dailyBudgets: {},
  retryBudgets: {},
};

test('strict autonomous web policy accepts only low-risk strongly corroborated non-breaking story', () => {
  assert.equal(assessAutonomousWebPublishing(story()).eligible, true);
  assert.equal(assessAutonomousWebPublishing(story({ riskLevel: RiskLevel.MEDIUM })).eligible, false);
  assert.equal(assessAutonomousWebPublishing(story({ format: ContentFormat.BREAKING_NEWS })).eligible, false);
  assert.equal(assessAutonomousWebPublishing(story({ verificationConfidence: VerificationConfidence.HIGH })).eligible, false);
  assert.equal(assessAutonomousWebPublishing(story({ sourceRefs: [{ label: 'Only', url: 'https://official.example/news', isPrimary: true }] })).eligible, false);
});

test('eligible story is deterministically approved then published without model authority', async () => {
  const records: PublishedNewsSourceRecord[] = [];
  const result = await publishStoryAutonomouslyIfEligible({
    story: story(),
    writer: { async publish(record) { records.push(record); } },
    existingRecords: [],
    authoritySnapshot: authority,
    nowUtc: now,
  });
  assert.equal(result.outcome, 'PUBLISHED');
  assert.equal(result.approvedStory?.status, CanonicalStoryStatus.APPROVED);
  assert.equal(result.publishedStory?.status, CanonicalStoryStatus.PUBLISHED);
  assert.equal(records.length, 1);
  assert.equal(records[0].article.slug, 'orbi-analiza-lanzamiento-confirmado');
});

test('policy rejection routes story to review and never calls writer', async () => {
  let writes = 0;
  const result = await publishStoryAutonomouslyIfEligible({
    story: story({ riskLevel: RiskLevel.MEDIUM }),
    writer: { async publish() { writes += 1; } },
    existingRecords: [],
    authoritySnapshot: authority,
    nowUtc: now,
  });
  assert.equal(result.outcome, 'REVIEW_REQUIRED');
  assert.equal(writes, 0);
});

test('operational authority still blocks publication even when content policy is eligible', async () => {
  const result = await publishStoryAutonomouslyIfEligible({
    story: story(),
    writer: { async publish() { throw new Error('SHOULD_NOT_WRITE'); } },
    existingRecords: [],
    authoritySnapshot: { ...authority, toggles: {} },
    nowUtc: now,
  });
  assert.equal(result.outcome, 'DEFERRED');
  assert.ok(result.reasons.some((reason) => reason.includes('AUTO_PUBLISH_WEB')));
});
